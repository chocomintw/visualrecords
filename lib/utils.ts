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
    // Skip the header row
    if (item["SMS"] === "SMS #") {
      continue
    }

    // Fixed mapping for Excel format:
    // SMS = "SMS #"
    // __EMPTY = "Sender Number"
    // __EMPTY_1 = "Receiver Number" 
    // __EMPTY_2 = "Message Body"
    // __EMPTY_3 = "Type"
    // __EMPTY_4 = "Timestamp"
    
    const smsId = String(item["SMS"] || "")
    const sender = String(item["__EMPTY"] || "")
    const receiver = String(item["__EMPTY_1"] || "")
    const message = String(item["__EMPTY_2"] || "")
    const type = (item["__EMPTY_3"] || "Unknown") as "Sender" | "Receiver"
    const timestamp = String(item["__EMPTY_4"] || "")

    // Validate required fields
    if (sender && receiver && message && timestamp) {
      validated.push({
        "SMS #": smsId,
        "Sender Number": sender,
        "Receiver Number": receiver,
        "Message Body": message,
        "Type": type,
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
    // Skip the header row
    if (item["Call"] === "Call #") {
      continue
    }

    // Fixed mapping for Excel format:
    // Call = "Call #"
    // __EMPTY = "Sender Number"
    // __EMPTY_1 = "Receiver Number"
    // __EMPTY_2 = "Type" 
    // __EMPTY_3 = "Timestamp"
    
    const callId = String(item["Call"] || "")
    const sender = String(item["__EMPTY"] || "")
    const receiver = String(item["__EMPTY_1"] || "")
    const type = (item["__EMPTY_2"] || "Unknown") as "Sender" | "Receiver"
    const timestamp = String(item["__EMPTY_3"] || "")

    // Validate required fields
    if (sender && receiver && timestamp) {
      validated.push({
        "Call #": callId,
        "Sender Number": sender,
        "Receiver Number": receiver,
        "Type": type,
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
    // Skip the header row - check for "Contact Name" in the first column
    if (item["Contact Name"] === "Contact Name" && item["Phone Number"] === "Phone Number") {
      continue
    }

    // Use the actual column names from the Excel file
    const name = String(item["Contact Name"] || "")
    const phone = String(item["Phone Number"] || "")

    // Validate required fields
    if (name && phone) {
      validated.push({
        "Contact Name": name,
        "Phone Number": phone,
        "Additional Info": undefined
      })
    }
  }

  console.log(`Contact validation: ${validated.length} valid out of ${data.length} total`)
  if (validated.length > 0) {
    console.log("Sample validated Contact:", validated[0])
  }
  
  return validated
}