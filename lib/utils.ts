import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from "xlsx"
import type { SMS, CallLog, Contact } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

          // Get headers and log them for debugging
          const headers = lines[0].split(",").map((h) => h.trim().replace(/['"]/g, ""))
          console.log(`CSV headers for ${file.name}:`, headers)

          // Parse rows
          const result = lines.slice(1).map((line, index) => {
            const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""))
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ""
            })
            return obj
          })

          console.log(`Parsed ${result.length} rows from ${file.name}`)
          if (result.length > 0) {
            console.log(`First row sample from ${file.name}:`, result[0])
          }
          resolve(result)
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          // Parse Excel
          const workbook = XLSX.read(data, { type: "binary" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

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

export function validateSMSData(data: any[]): SMS[] {
  console.log("Validating SMS data, raw data count:", data.length)

  if (data.length === 0) {
    console.log("No SMS data to validate")
    return []
  }

  const validated: SMS[] = []

  for (const item of data) {
    // Skip the header row - check if this looks like a header
    const smsId = String(item["SMS #"] || item["SMS"] || "")
    const sender = String(item["Sender Number"] || item["__EMPTY"] || "")
    const receiver = String(item["Receiver Number"] || item["__EMPTY_1"] || "")
    const message = String(item["Message Body"] || item["__EMPTY_2"] || "")
    const type = String(item["Type"] || item["__EMPTY_3"] || "")
    const timestamp = String(item["Timestamp"] || item["__EMPTY_4"] || "")

    // Skip if this looks like a header row (contains header text)
    if (sender === "Sender Number" || receiver === "Receiver Number" || message === "Message Body") {
      continue
    }

    // Skip if this looks like invalid data (contains header-like values)
    if (smsId === "SMS #" || type === "Type" || timestamp === "Timestamp") {
      continue
    }

    // Validate required fields have actual data (not empty or header values)
    if (sender && receiver && message && timestamp &&
      sender !== "Sender Number" && receiver !== "Receiver Number" &&
      message !== "Message Body" && timestamp !== "Timestamp") {
      validated.push({
        "SMS #": smsId,
        "Sender Number": sender,
        "Receiver Number": receiver,
        "Message Body": message,
        "Type": (type || "Unknown") as "Sender" | "Receiver",
        "Timestamp": timestamp
      })
    }
  }

  console.log(`SMS validation: ${validated.length} valid out of ${data.length} total`)
  if (validated.length > 0) {
    console.log("Sample validated SMS:", validated[0])
  }

  return validated
}

export function validateCallData(data: any[]): CallLog[] {
  console.log("Validating Call data, raw data count:", data.length)

  if (data.length === 0) {
    console.log("No Call data to validate")
    return []
  }

  const validated: CallLog[] = []

  for (const item of data) {
    // Skip the header row - check if this looks like a header
    const callId = String(item["Call #"] || item["Call"] || "")
    const sender = String(item["Sender Number"] || item["__EMPTY"] || "")
    const receiver = String(item["Receiver Number"] || item["__EMPTY_1"] || "")
    const type = String(item["Type"] || item["__EMPTY_2"] || "")
    const timestamp = String(item["Timestamp"] || item["__EMPTY_3"] || "")

    // Skip if this looks like a header row (contains header text)
    if (sender === "Sender Number" || receiver === "Receiver Number") {
      continue
    }

    // Skip if this looks like invalid data (contains header-like values)
    if (callId === "Call #" || type === "Type" || timestamp === "Timestamp") {
      continue
    }

    // Validate required fields have actual data (not empty or header values)
    if (sender && receiver && timestamp &&
      sender !== "Sender Number" && receiver !== "Receiver Number" &&
      timestamp !== "Timestamp") {
      validated.push({
        "Call #": callId,
        "Sender Number": sender,
        "Receiver Number": receiver,
        "Type": (type || "Unknown") as "Sender" | "Receiver",
        "Timestamp": timestamp
      })
    }
  }

  console.log(`Call validation: ${validated.length} valid out of ${data.length} total`)
  if (validated.length > 0) {
    console.log("Sample validated Call:", validated[0])
  }

  return validated
}

export function validateContactData(data: any[]): Contact[] {
  console.log("Validating Contact data, raw data count:", data.length)

  if (data.length === 0) {
    console.log("No Contact data to validate")
    return []
  }

  const validated: Contact[] = []

  for (const item of data) {
    // Skip the header row - check if this looks like a header
    const name = String(item["Contact Name"] || "")
    const phone = String(item["Phone Number"] || "")

    // Skip if this looks like a header row (contains header text)
    if (name === "Contact Name" || phone === "Phone Number") {
      continue
    }

    // Validate required fields have actual data (not empty or header values)
    if (name && phone && name !== "Contact Name" && phone !== "Phone Number") {
      validated.push({
        "Contact Name": name,
        "Phone Number": phone,
        "Full Name": undefined
      })
    }
  }

  console.log(`Contact validation: ${validated.length} valid out of ${data.length} total`)
  if (validated.length > 0) {
    console.log("Sample validated Contact:", validated[0])
  }

  return validated
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