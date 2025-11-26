import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from "xlsx"
import type { SMS, CallLog, Contact } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to create a unique ID for deduplication
function createMessageId(item: any): string {
  // Normalize phone numbers: remove non-digits to handle formatting differences (e.g. "+1 555" vs "1555")
  const sender = String(item["Sender Number"] || "").replace(/\D/g, "")
  const receiver = String(item["Receiver Number"] || "").replace(/\D/g, "")

  // Normalize message: lowercase and remove all whitespace for aggressive deduplication
  const message = String(item["Message Body"] || item["Call Info"] || "").toLowerCase().replace(/\s+/g, "")

  // Normalize timestamp: try to parse as date to handle different formats (e.g. "12/31/2023" vs "2023-12-31")
  let timestamp = String(item["Timestamp"] || "").trim()
  try {
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      timestamp = date.toISOString()
    } else {
      timestamp = timestamp.toLowerCase()
    }
  } catch (e) {
    timestamp = timestamp.toLowerCase()
  }

  // Use pipe separator to avoid collisions
  return `${sender}|${receiver}|${message}|${timestamp}`
}

// Helper function to deduplicate array of items
function deduplicateItems<T>(items: T[], idField?: keyof T): T[] {
  const seen = new Set<string>()
  const deduped: T[] = []

  for (const item of items) {
    let id: string

    if (idField) {
      // Use specified field for ID
      id = String((item as any)[idField] || "")
    } else {
      // Create ID from content
      id = createMessageId(item as any)
    }

    if (!seen.has(id)) {
      seen.add(id)
      deduped.push(item)
    } else {
      console.log(`Skipping duplicate item: ${id}`)
    }
  }

  console.log(`Deduplication: ${items.length} -> ${deduped.length} items`)
  return deduped
}

export async function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error("No data found in file"))
          return
        }

        console.log(`Parsing file: ${file.name}, size: ${file.size} bytes`)

        // Check if it's a CSV or Excel file
        if (file.name.endsWith(".csv")) {
          // Parse CSV
          const text = data as string
          const lines = text.split("\n").filter((line) => line.trim())

          if (lines.length === 0) {
            console.log(`File ${file.name} is empty`)
            resolve([])
            return
          }

          // For phone export files, we need special handling
          const isPhoneExport = lines.some(line =>
            line.includes("Phone Number:") || line.includes("=== MESSAGES ===") || line.includes("=== CALLS ===")
          )

          if (isPhoneExport) {
            console.log(`Detected phone export format in ${file.name}`)
            const result = parsePhoneExportCSV(lines)
            resolve(result)
          } else {
            // Standard CSV parsing for non-phone-export files
            let headerIndex = -1
            const headerPatterns = [
              /Sender Number.*Target Number.*Message.*Timestamp/i,
              /Sender Number.*Receiver Number.*Message.*Timestamp/i,
              /Sender Number.*Target Number.*Call Info.*Timestamp/i,
              /Sender Number.*Receiver Number.*Call Info.*Timestamp/i
            ]

            for (let i = 0; i < Math.min(20, lines.length); i++) {
              if (headerPatterns.some(pattern => pattern.test(lines[i]))) {
                headerIndex = i
                break
              }
            }

            if (headerIndex === -1) {
              console.log(`No specific header pattern found in ${file.name}, using default parsing`)
              headerIndex = 0
            }

            const headers = lines[headerIndex].split(",").map((h) => h.trim().replace(/['"]/g, ""))
            console.log(`CSV headers for ${file.name}:`, headers)

            const result = lines.slice(headerIndex + 1)
              .filter(line => line.trim() && !line.includes("===") && !line.includes("Phone Number:") && !line.includes("Export Date:"))
              .map((line, index) => {
                const values: string[] = []
                let inQuotes = false
                let currentValue = ""

                for (let i = 0; i < line.length; i++) {
                  const char = line[i]
                  if (char === '"') {
                    inQuotes = !inQuotes
                  } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim().replace(/['"]/g, ""))
                    currentValue = ""
                  } else {
                    currentValue += char
                  }
                }
                values.push(currentValue.trim().replace(/['"]/g, ""))

                const obj: any = {}
                headers.forEach((header, index) => {
                  if (header && index < values.length) {
                    obj[header] = values[index] || ""
                  }
                })
                return obj
              })
              .filter(obj => Object.keys(obj).length > 0 && obj[headers[0]])

            console.log(`Parsed ${result.length} rows from ${file.name}`)
            if (result.length > 0) {
              console.log(`First row sample from ${file.name}:`, result[0])
            }
            resolve(result)
          }
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          // Parse Excel
          const workbook = XLSX.read(data, { type: "binary" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Convert to array of arrays first to handle phone export format
          const jsonArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          let jsonData: any[] = []

          // Check if this is a phone export file (has metadata at top)
          const isPhoneExport = jsonArray.some(row =>
            row && row[0] && String(row[0]).includes("Phone Number:")
          )

          if (isPhoneExport) {
            console.log(`Detected phone export format in ${file.name}`)
            // Find the header row for messages and calls
            let messagesHeaderIndex = -1
            let callsHeaderIndex = -1

            for (let i = 0; i < jsonArray.length; i++) {
              const row = jsonArray[i]
              if (row && row[0] === "MESSAGES") {
                messagesHeaderIndex = i + 1
              } else if (row && row[0] === "CALLS") {
                callsHeaderIndex = i + 1
                break
              }
            }

            // Parse messages
            if (messagesHeaderIndex !== -1 && jsonArray[messagesHeaderIndex]) {
              const messagesHeaders = jsonArray[messagesHeaderIndex].map(h => String(h || "").trim())
              for (let i = messagesHeaderIndex + 1; i < (callsHeaderIndex !== -1 ? callsHeaderIndex - 1 : jsonArray.length); i++) {
                const row = jsonArray[i]
                if (row && row.some(cell => cell !== null && cell !== undefined && cell !== "")) {
                  const obj: any = {}
                  messagesHeaders.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                      obj[header] = String(row[index] || "")
                    }
                  })
                  if (Object.keys(obj).length > 0) {
                    obj._type = "SMS" // Mark as SMS
                    jsonData.push(obj)
                  }
                }
              }
            }

            // Parse calls
            if (callsHeaderIndex !== -1 && jsonArray[callsHeaderIndex]) {
              const callsHeaders = jsonArray[callsHeaderIndex].map(h => String(h || "").trim())
              for (let i = callsHeaderIndex + 1; i < jsonArray.length; i++) {
                const row = jsonArray[i]
                if (row && row.some(cell => cell !== null && cell !== undefined && cell !== "")) {
                  const obj: any = {}
                  callsHeaders.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                      obj[header] = String(row[index] || "")
                    }
                  })
                  if (Object.keys(obj).length > 0) {
                    obj._type = "Call" // Mark as Call
                    jsonData.push(obj)
                  }
                }
              }
            }
          } else {
            // Standard Excel format
            jsonData = XLSX.utils.sheet_to_json(worksheet)
          }

          console.log(`Parsed ${jsonData.length} rows from Excel file ${file.name}`)
          if (jsonData.length > 0) {
            console.log(`Excel headers for ${file.name}:`, Object.keys(jsonData[0] as any))
            console.log(`First row sample from ${file.name}:`, jsonData[0])
          }
          resolve(jsonData)
        } else {
          reject(new Error("Unsupported file format"))
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error)
        reject(error)
      }
    }

    reader.onerror = () => {
      console.error(`FileReader error for ${file.name}`)
      reject(new Error("Failed to read file"))
    }

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  })
}

// New function to parse phone export CSV files
function parsePhoneExportCSV(lines: string[]): any[] {
  const result: any[] = []
  let currentSection: string | null = null
  let ownerPhoneNumber: string | null = null

  for (let i = 0; i < lines.length; i++) {
    // Remove BOM from first line if present
    let line = lines[i].trim()
    if (i === 0 && line.charCodeAt(0) === 0xFEFF) {
      line = line.substring(1)
    }

    // Extract owner phone number from metadata
    if (line.includes("Phone Number:")) {
      ownerPhoneNumber = line.replace("Phone Number:", "").trim().replace(/"/g, "")
      console.log(`Detected owner phone number: ${ownerPhoneNumber}`)
      continue
    }

    // Skip metadata lines
    if (line.includes("Export Date:") || !line) {
      continue
    }

    // Detect section headers
    if (line.includes("=== MESSAGES ===")) {
      currentSection = "SMS"
      console.log(`Detected MESSAGES section at line ${i}`)
      continue
    } else if (line.includes("=== CALLS ===")) {
      currentSection = "Call"
      console.log(`Detected CALLS section at line ${i}`)
      continue
    }

    // Process data rows - check if this is a header row for the current section
    if (currentSection && (line.includes("Sender Number") && line.includes("Target Number"))) {
      console.log(`Skipping header row in ${currentSection} section: ${line}`)
      continue
    }

    if (currentSection && line && !line.includes("===")) {
      // Parse CSV row
      const values: string[] = []
      let inQuotes = false
      let currentValue = ""

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim().replace(/['"]/g, ""))
          currentValue = ""
        } else {
          currentValue += char
        }
      }
      values.push(currentValue.trim().replace(/['"]/g, ""))

      if (values.length >= 4) {
        const senderNumber = values[0] || ""
        const receiverNumber = values[1] || ""
        const content = values[2] || ""
        const timestamp = values[3] || ""

        // Determine type based on owner phone number
        let type: "Sender" | "Receiver" = "Sender" // Default to Sender

        if (ownerPhoneNumber) {
          if (senderNumber === ownerPhoneNumber) {
            type = "Sender"
          } else if (receiverNumber === ownerPhoneNumber) {
            type = "Receiver"
          } else {
            // If neither matches, try partial matching (in case of formatting differences)
            const cleanOwner = ownerPhoneNumber.replace(/\D/g, "")
            const cleanSender = senderNumber.replace(/\D/g, "")
            const cleanReceiver = receiverNumber.replace(/\D/g, "")

            if (cleanSender === cleanOwner) {
              type = "Sender"
            } else if (cleanReceiver === cleanOwner) {
              type = "Receiver"
            } else {
              console.warn(`Could not determine type for message. Owner: ${ownerPhoneNumber}, Sender: ${senderNumber}, Receiver: ${receiverNumber}`)
              type = "Sender" // Fallback to Sender
            }
          }
        }

        const obj: any = {
          "Sender Number": senderNumber,
          "Receiver Number": receiverNumber,
          "Timestamp": timestamp,
          "Type": type
        }

        if (currentSection === "SMS") {
          obj["Message Body"] = content
          obj._type = "SMS"
        } else if (currentSection === "Call") {
          obj["Call Info"] = content
          obj._type = "Call"
        }

        // Only add if we have valid data
        if (senderNumber && receiverNumber && timestamp &&
          senderNumber !== "Sender Number" && receiverNumber !== "Target Number") {
          result.push(obj)
        }
      }
    }
  }

  console.log(`Parsed phone export: ${result.length} total records (${result.filter(r => r._type === "SMS").length} SMS, ${result.filter(r => r._type === "Call").length} Calls)`)
  if (ownerPhoneNumber) {
    const sentCount = result.filter(r => r.Type === "Sender").length
    const receivedCount = result.filter(r => r.Type === "Receiver").length
    console.log(`Message types - Sent: ${sentCount}, Received: ${receivedCount}`)
  }

  return result
}

export function validateSMSData(data: any[]): SMS[] {
  console.log("Validating SMS data, raw data count:", data.length)

  if (data.length === 0) {
    console.log("No SMS data to validate")
    return []
  }

  const validated: SMS[] = []

  for (const item of data) {
    // Skip calls if they're mixed in
    if (item._type === "Call") {
      continue
    }

    // Handle both old and new column names
    const smsId = String(item["SMS #"] || item["SMS"] || item["SMS #"] || "")
    const sender = String(item["Sender Number"] || item["Sender"] || item["__EMPTY"] || "")
    const receiver = String(item["Receiver Number"] || item["Target Number"] || item["Receiver"] || item["__EMPTY_1"] || "")
    const message = String(item["Message Body"] || item["Message"] || item["__EMPTY_2"] || "")
    const timestamp = String(item["Timestamp"] || item["Date"] || item["__EMPTY_4"] || "")

    // Skip if this looks like a header row (contains header text)
    if (sender === "Sender Number" || receiver === "Receiver Number" || receiver === "Target Number" || message === "Message Body" || message === "Message") {
      continue
    }

    // Skip if this looks like invalid data (contains header-like values)
    if (smsId === "SMS #" || timestamp === "Timestamp") {
      continue
    }

    // Skip metadata rows
    if (sender.includes("Phone Number:") || sender.includes("Export Date:") || sender.includes("===")) {
      continue
    }

    // Validate required fields have actual data (not empty or header values)
    if (sender && receiver && message && timestamp &&
      sender !== "Sender Number" && receiver !== "Receiver Number" && receiver !== "Target Number" &&
      message !== "Message Body" && message !== "Message" && timestamp !== "Timestamp") {

      // Determine type - use existing Type if available, otherwise default to "Sender"
      let messageType: "Sender" | "Receiver" = item.Type || "Sender"

      // If Type is not set, try to determine from context
      if (!item.Type) {
        messageType = "Sender" // Default fallback
      }

      validated.push({
        "SMS #": smsId,
        "Sender Number": sender,
        "Receiver Number": receiver,
        "Message Body": message,
        "Type": messageType,
        "Timestamp": timestamp
      })
    }
  }

  // Deduplicate before returning
  const deduped = deduplicateItems(validated)
  console.log(`SMS validation: ${deduped.length} valid out of ${data.length} total (after deduplication)`)
  if (deduped.length > 0) {
    console.log("Sample validated SMS:", deduped[0])
  }

  return deduped
}

export function validateCallData(data: any[]): CallLog[] {
  console.log("Validating Call data, raw data count:", data.length)

  if (data.length === 0) {
    console.log("No Call data to validate")
    return []
  }

  const validated: CallLog[] = []

  for (const item of data) {
    // Skip SMS if they're mixed in
    if (item._type === "SMS") {
      continue
    }

    // Handle both old and new column names
    const callId = String(item["Call #"] || item["Call"] || item["Call #"] || "")
    const sender = String(item["Sender Number"] || item["Sender"] || item["__EMPTY"] || "")
    const receiver = String(item["Receiver Number"] || item["Target Number"] || item["Receiver"] || item["__EMPTY_1"] || "")
    const callInfo = String(item["Call Info"] || item["Info"] || item["__EMPTY_2"] || "")
    const timestamp = String(item["Timestamp"] || item["Date"] || item["__EMPTY_4"] || "")

    // Skip if this looks like a header row (contains header text)
    if (sender === "Sender Number" || receiver === "Receiver Number" || receiver === "Target Number") {
      continue
    }

    // Skip if this looks like invalid data (contains header-like values)
    if (callId === "Call #" || timestamp === "Timestamp") {
      continue
    }

    // Skip metadata rows
    if (sender.includes("Phone Number:") || sender.includes("Export Date:") || sender.includes("===")) {
      continue
    }

    // Validate required fields have actual data (not empty or header values)
    if (sender && receiver && timestamp &&
      sender !== "Sender Number" && receiver !== "Receiver Number" && receiver !== "Target Number" &&
      timestamp !== "Timestamp") {

      // Determine type - use existing Type if available, otherwise default to "Sender"
      let callType: "Sender" | "Receiver" = item.Type || "Sender"

      // If Type is not set, try to determine from context
      if (!item.Type) {
        callType = "Sender" // Default fallback
      }

      validated.push({
        "Call #": callId,
        "Sender Number": sender,
        "Receiver Number": receiver,
        "Call Info": callInfo,
        "Type": callType,
        "Timestamp": timestamp
      })
    }
  }

  // Deduplicate before returning
  const deduped = deduplicateItems(validated)
  console.log(`Call validation: ${deduped.length} valid out of ${data.length} total (after deduplication)`)
  if (deduped.length > 0) {
    console.log("Sample validated Call:", deduped[0])
  }

  return deduped
}

export function validateContactData(data: any[]): Contact[] {
  console.log("Validating Contact data, raw data count:", data.length)

  if (data.length === 0) {
    console.log("No Contact data to validate")
    return []
  }

  const validated: Contact[] = []

  for (const item of data) {
    // Handle both old and new column names
    const name = String(item["Contact Name"] || item["Name"] || "")
    const phone = String(item["Phone Number"] || item["Phone"] || item["Number"] || "")

    // Skip if this looks like a header row (contains header text)
    if (name === "Contact Name" || phone === "Phone Number" || name === "Name" || phone === "Phone") {
      continue
    }

    // Skip metadata rows
    if (name.includes("Phone Number:") || name.includes("Export Date:") || name.includes("===")) {
      continue
    }

    // Validate required fields have actual data (not empty or header values)
    if (name && phone && name !== "Contact Name" && phone !== "Phone Number" && name !== "Name" && phone !== "Phone") {
      validated.push({
        "Contact Name": name,
        "Phone Number": phone,
        "Full Name": undefined
      })
    }
  }

  // Deduplicate contacts based on phone number
  const deduped = deduplicateItems(validated, "Phone Number" as keyof Contact)
  console.log(`Contact validation: ${deduped.length} valid out of ${data.length} total (after deduplication)`)
  if (deduped.length > 0) {
    console.log("Sample validated Contact:", deduped[0])
  }

  return deduped
}

export async function parseBankData(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error("No data found in file"))
          return
        }

        console.log(`Parsing bank file: ${file.name}, size: ${file.size} bytes`)

        let rawData: any[] = []

        if (file.name.endsWith(".csv")) {
          const text = data as string
          const lines = text.split("\n").filter((line) => line.trim())

          // Find the header line (starts with ",From,Routing")
          // Based on user input: ",From,Routing,Reason,Amount,Balance,Date,,,"
          let headerIndex = -1
          for (let i = 0; i < Math.min(10, lines.length); i++) {
            if (lines[i].includes("From") && lines[i].includes("Amount") && lines[i].includes("Date")) {
              headerIndex = i
              break
            }
          }

          if (headerIndex === -1) {
            console.warn("Could not find standard bank header, trying default parsing")
            headerIndex = 0
          }

          const headers = lines[headerIndex].split(",").map(h => h.trim().replace(/['"]/g, ""))

          rawData = lines.slice(headerIndex + 1).map(line => {
            // Handle CSV parsing with potential quoted values
            const values: string[] = []
            let inQuotes = false
            let currentValue = ""

            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/['"]/g, ""))
                currentValue = ""
              } else {
                currentValue += char
              }
            }
            values.push(currentValue.trim().replace(/['"]/g, ""))

            const obj: any = {}
            headers.forEach((header, index) => {
              if (header) { // Only map if header is not empty
                obj[header] = values[index] || ""
              }
            })
            return obj
          })

        } else {
          // Excel
          const workbook = XLSX.read(data, { type: "binary" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Convert to array of arrays first to find header
          const jsonArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          let headerIndex = -1
          for (let i = 0; i < Math.min(10, jsonArray.length); i++) {
            const row = jsonArray[i]
            if (row.includes("From") && row.includes("Amount") && row.includes("Date")) {
              headerIndex = i
              break
            }
          }

          if (headerIndex !== -1) {
            // Re-parse with header row
            rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex })
          } else {
            rawData = XLSX.utils.sheet_to_json(worksheet)
          }
        }

        // Transform to BankRecord
        const validated = rawData.map((item, index) => {
          // Clean amount string "-100.00 $" -> -100.00
          const amountStr = String(item["Amount"] || "").replace(/[$,]/g, "").trim()
          const balanceStr = String(item["Balance"] || "").replace(/[$,]/g, "").trim()

          return {
            id: String(index),
            from: String(item["From"] || ""),
            routing: String(item["Routing"] || ""),
            reason: String(item["Reason"] || ""),
            amount: parseFloat(amountStr) || 0,
            balance: parseFloat(balanceStr) || 0,
            date: String(item["Date"] || ""),
            rawDate: String(item["Date"] || "")
          }
        }).filter(r => r.from && r.date) // Basic validation

        console.log(`Parsed ${validated.length} bank records`)
        resolve(validated)

      } catch (error) {
        console.error(`Error parsing bank file ${file.name}:`, error)
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  })
}