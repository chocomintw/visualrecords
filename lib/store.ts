import { create } from "zustand"
import type { UploadedFiles, ParsedData, Contact } from "@/types"
import { processBankData, processCommunicationData, BankStats, CommunicationStats } from "@/lib/analytics"
import { parseFile, validateSMSData, validateCallData, validateContactData, parseBankData } from "@/lib/utils"
import { sanitizeHTML } from "./sentinel"

/**
 * 🛡️ Sentinel: Helper function to sanitize all parts of the parsed data.
 *
 * This function iterates over the data and applies HTML sanitization to prevent
 * Stored XSS vulnerabilities. By cleaning the data on ingestion, we ensure that
 * any malicious scripts are neutralized before they are stored in the application state.
 */
const sanitizeParsedData = (data: ParsedData): ParsedData => {
  return {
    ...data,
    sms: data.sms.map((item) => ({ ...item, "Message Body": sanitizeHTML(item["Message Body"]) })),
    calls: data.calls.map((item) => ({ ...item, "Call Info": sanitizeHTML(item["Call Info"]) })),
    contacts: data.contacts.map((item) => ({
      ...item,
      "Contact Name": sanitizeHTML(item["Contact Name"]),
      "Full Name": sanitizeHTML(item["Full Name"]),
    })),
    bank: data.bank.map((item) => ({ ...item, from: sanitizeHTML(item.from), reason: sanitizeHTML(item.reason) })),
  }
}

interface AppState {
  // Current state
  parsedData: ParsedData
  bankStats: BankStats | null
  communicationStats: CommunicationStats | null
  isLoading: boolean
  error: string

  // Actions
  setParsedData: (data: ParsedData) => void
  setContacts: (contacts: Contact[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  resetState: () => void
  handleFilesUpload: (files: UploadedFiles) => Promise<void>
  loadSession: (data: ParsedData) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  parsedData: { sms: [], calls: [], contacts: [], bank: [] },
  bankStats: null,
  communicationStats: null,
  isLoading: false,
  error: "",

  // Actions
  setParsedData: (data) => {
    set({
      parsedData: data,
      bankStats: data.bank.length > 0 ? processBankData(data.bank) : null,
      communicationStats: processCommunicationData(data)
    })
  },

  setContacts: (contacts) => {
    set((state) => {
      const newData = { ...state.parsedData, contacts }
      return {
        parsedData: newData,
        // Re-process communication stats as they depend on contacts
        communicationStats: processCommunicationData(newData)
      }
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  resetState: () =>
    set({
      parsedData: { sms: [], calls: [], contacts: [], bank: [] },
      bankStats: null,
      communicationStats: null,
      error: "",
    }),

  handleFilesUpload: async (files: UploadedFiles) => {
    // If no files are selected, clear the data and return early
    if (Object.keys(files).length === 0) {
      get().resetState()
      return
    }

    set({ isLoading: true, error: "" })

    try {
      const currentData = get().parsedData
      const newData: ParsedData = { ...currentData }

      // Parse SMS data from multiple files
      if (files.sms) {
        if (files.sms.length > 0) {
          console.log(
            "Processing SMS files:",
            files.sms.map((f) => f.name),
          )
          const allSmsData = []
          for (const file of files.sms) {
            const smsData = await parseFile(file)
            allSmsData.push(...smsData)
          }
          newData.sms = validateSMSData(allSmsData)
          console.log("Validated SMS data:", newData.sms.length)
        } else {
          newData.sms = []
        }
      }

      // Parse Call data from multiple files
      if (files.calls) {
        if (files.calls.length > 0) {
          console.log(
            "Processing Calls files:",
            files.calls.map((f) => f.name),
          )
          const allCallData = []
          for (const file of files.calls) {
            const callData = await parseFile(file)
            allCallData.push(...callData)
          }
          newData.calls = validateCallData(allCallData)
          console.log("Validated Calls data:", newData.calls.length)
        } else {
          newData.calls = []
        }
      }

      // Parse Contact data from multiple files
      if (files.contacts) {
        if (files.contacts.length > 0) {
          console.log(
            "Processing Contacts files:",
            files.contacts.map((f) => f.name),
          )
          const allContactData = []
          for (const file of files.contacts) {
            const contactData = await parseFile(file)
            allContactData.push(...contactData)
          }
          newData.contacts = validateContactData(allContactData)
          console.log("Validated Contacts data:", newData.contacts.length)
        } else {
          newData.contacts = []
        }
      }

      // Parse Bank data from multiple files
      if (files.bank) {
        if (files.bank.length > 0) {
          console.log(
            "Processing Bank files:",
            files.bank.map((f) => f.name),
          )
          const allBankData = []
          for (const file of files.bank) {
            // Use specific bank parser
            const bankData = await parseBankData(file)
            allBankData.push(...bankData)
          }
          newData.bank = allBankData
          console.log("Validated Bank data:", newData.bank.length)
        } else {
          newData.bank = []
        }
      }

      console.log("Final parsed data:", {
        smsCount: newData.sms.length,
        callsCount: newData.calls.length,
        contactsCount: newData.contacts.length,
        bankCount: newData.bank.length,
      })

      // Validate that we have at least one data type
      if (newData.sms.length === 0 && newData.calls.length === 0 && newData.bank.length === 0) {
        // Only show error if we actually tried to upload something and it failed, 
        // OR if the user explicitly cleared everything.
        // But if we are just merging, we might end up with empty state if the user cleared everything.

        // If the user provided files but we ended up with no data, that's an error (parsing failed or empty files).
        // But here we are just checking the final state.

        // Let's relax this check. If the result is empty, it's empty.
        // But we want to warn if the *input* files were invalid.
        // The parsing logic above handles parsing.

        // If we have no data, we should just set the state to empty and return.
        set({ error: "", parsedData: newData, bankStats: null, communicationStats: null })
        return
      }

      // 🛡️ Sentinel: Sanitize all data before storing to prevent XSS
      const sanitizedData = sanitizeParsedData(newData)

      // Process stats immediately
      const bankStats = sanitizedData.bank.length > 0 ? processBankData(sanitizedData.bank) : null
      const communicationStats = processCommunicationData(sanitizedData)

      set({
        parsedData: sanitizedData,
        bankStats,
        communicationStats
      })
    } catch (err) {
      const errorMsg = `Error processing files: ${err instanceof Error ? err.message : "Unknown error"}`
      console.error("Error processing files:", err)
      set({ error: errorMsg, parsedData: { sms: [], calls: [], contacts: [], bank: [] }, bankStats: null, communicationStats: null })
    } finally {
      set({ isLoading: false })
    }
  },

  loadSession: (data: ParsedData) => {
    try {
      set({ isLoading: true, error: "" })

      // 🛡️ Sentinel: Sanitize all data loaded from a session to prevent XSS
      const sanitizedData = sanitizeParsedData(data)

      // Process stats immediately
      const bankStats = sanitizedData.bank.length > 0 ? processBankData(sanitizedData.bank) : null
      const communicationStats = processCommunicationData(sanitizedData)

      set({
        parsedData: sanitizedData,
        bankStats,
        communicationStats,
        isLoading: false
      })
    } catch (err) {
      const errorMsg = `Error loading session: ${err instanceof Error ? err.message : "Unknown error"}`
      console.error("Error loading session:", err)
      set({ error: errorMsg, isLoading: false })
    }
  },
}))
