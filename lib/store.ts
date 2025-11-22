import { create } from "zustand"
import type { UploadedFiles, ParsedData } from "@/types"

interface AppState {
  // Current state
  parsedData: ParsedData
  isLoading: boolean
  error: string

  // Actions
  setParsedData: (data: ParsedData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  resetState: () => void
  handleFilesUpload: (files: UploadedFiles) => Promise<void>
}

import { parseFile, validateSMSData, validateCallData, validateContactData } from "@/lib/utils"

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  parsedData: { sms: [], calls: [], contacts: [] },
  isLoading: false,
  error: "",

  // Actions
  setParsedData: (data) => set({ parsedData: data }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  resetState: () =>
    set({
      parsedData: { sms: [], calls: [], contacts: [] },
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
      const newData: ParsedData = { sms: [], calls: [], contacts: [] }

      // Parse SMS data from multiple files
      if (files.sms && files.sms.length > 0) {
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
      }

      // Parse Call data from multiple files
      if (files.calls && files.calls.length > 0) {
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
      }

      // Parse Contact data from multiple files
      if (files.contacts && files.contacts.length > 0) {
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
      }

      console.log("Final parsed data:", {
        smsCount: newData.sms.length,
        callsCount: newData.calls.length,
        contactsCount: newData.contacts.length,
      })

      // Validate that we have at least one data type
      if (newData.sms.length === 0 && newData.calls.length === 0) {
        const fileTypes = []
        if (files.sms?.length) fileTypes.push("SMS")
        if (files.calls?.length) fileTypes.push("Call Logs")
        
        const errorMsg = `No valid data was found in the uploaded ${fileTypes.join(" and ")} files. Please check that your files contain the required columns and data.`
        console.error(errorMsg)
        console.log("Uploaded files:", {
          smsFiles: files.sms?.map(f => f.name) || [],
          callFiles: files.calls?.map(f => f.name) || [],
          contactFiles: files.contacts?.map(f => f.name) || []
        })
        set({ error: errorMsg, parsedData: { sms: [], calls: [], contacts: [] } })
        return
      }

      set({ parsedData: newData })
    } catch (err) {
      const errorMsg = `Error processing files: ${err instanceof Error ? err.message : "Unknown error"}`
      console.error("Error processing files:", err)
      set({ error: errorMsg, parsedData: { sms: [], calls: [], contacts: [] } })
    } finally {
      set({ isLoading: false })
    }
  },
}))
