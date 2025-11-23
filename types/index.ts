export interface SMS {
  "SMS #": string
  "Sender Number": string
  "Receiver Number": string
  "Message Body": string
  Type: "Sender" | "Receiver"
  Timestamp: string
}

export interface CallLog {
  "Call #": string
  "Sender Number": string
  "Call Info": string
  "Receiver Number": string
  Type: "Sender" | "Receiver"
  Timestamp: string
}

export interface Contact {
  "Contact Name": string
  "Phone Number": string
  "Full Name"?: string
}

export interface UploadedFiles {
  sms?: File[]
  calls?: File[]
  contacts?: File[]
  bank?: File[]
}

export interface ParsedData {
  sms: SMS[]
  calls: CallLog[]
  contacts: Contact[]
  bank: BankRecord[]
}

export interface BankRecord {
  id: string
  from: string
  routing: string
  reason: string
  amount: number
  balance: number
  date: string
  rawDate: string
}
