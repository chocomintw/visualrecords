import { Contact, ParsedData, BankRecord, SMS, CallLog } from "@/types"

// --- Bank Analytics ---

export interface BankStats {
    totalIncome: number
    totalExpense: number
    currentBalance: number
    expensesByReason: Record<string, number>
    pieData: { name: string; value: number }[]
    balanceHistory: { name: string; balance: number; amount: number }[]
}

export function processBankData(bankData: BankRecord[]): BankStats {
    if (!bankData || bankData.length === 0) {
        return {
            totalIncome: 0,
            totalExpense: 0,
            currentBalance: 0,
            expensesByReason: {},
            pieData: [],
            balanceHistory: [],
        }
    }

    const totalIncome = bankData
        .filter((r) => r.amount > 0)
        .reduce((sum, r) => sum + r.amount, 0)

    const totalExpense = bankData
        .filter((r) => r.amount < 0)
        .reduce((sum, r) => sum + Math.abs(r.amount), 0)

    const currentBalance = bankData.length > 0
        ? bankData.reduce((latest, current) => {
            const latestDate = new Date(latest.date).getTime() || 0
            const currentDate = new Date(current.date).getTime() || 0
            return currentDate > latestDate ? current : latest
        }).balance
        : 0

    const expensesByReason = bankData
        .filter((r) => r.amount < 0)
        .reduce((acc, curr) => {
            const reason = curr.reason || "Unknown"
            acc[reason] = (acc[reason] || 0) + Math.abs(curr.amount)
            return acc
        }, {} as Record<string, number>)

    const pieData = Object.entries(expensesByReason)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    const balanceHistory = bankData
        .map((r) => ({
            name: r.date,
            balance: r.balance,
            amount: r.amount,
        }))
        .filter((_, i) => (bankData.length > 50 ? i % Math.ceil(bankData.length / 50) === 0 : true))

    return {
        totalIncome,
        totalExpense,
        currentBalance,
        expensesByReason,
        pieData,
        balanceHistory,
    }
}

// --- Communication Analytics ---

export interface CommunicationStats {
    callsPerDay: { date: string; count: number }[]
    textsPerDay: { date: string; count: number }[]
    textsPerContact: { name: string; value: number }[]
    callsPerContact: { name: string; value: number }[]
    topContactsByInteractions: { name: string; texts: number; calls: number; total: number }[]
    contactsActivityByDay: { date: string; texts: number; calls: number; total: number }[]
    textsPerUnknown: { name: string; value: number }[]
    callsPerUnknown: { name: string; value: number }[]
    topUnknownByInteractions: { name: string; texts: number; calls: number; total: number }[]
    unknownNumbersByDay: { date: string; texts: number; calls: number; total: number }[]
}

export function processCommunicationData(data: ParsedData): CommunicationStats {
    const { sms, calls, contacts } = data
    const mainPhoneNumber = getMainPhoneNumber(sms, calls)

    return {
        callsPerDay: processCallsPerDay(calls),
        textsPerDay: processTextsPerDay(sms),
        textsPerContact: processTextsPerContact(sms, contacts, mainPhoneNumber),
        callsPerContact: processCallsPerContact(calls, contacts, mainPhoneNumber),
        topContactsByInteractions: processTopContactsByInteractions(sms, calls, contacts, mainPhoneNumber),
        contactsActivityByDay: processContactsActivityByDay(sms, calls, contacts, mainPhoneNumber),
        textsPerUnknown: processTextsPerUnknown(sms, contacts, mainPhoneNumber),
        callsPerUnknown: processCallsPerUnknown(calls, contacts, mainPhoneNumber),
        topUnknownByInteractions: processTopUnknownByInteractions(sms, calls, contacts, mainPhoneNumber),
        unknownNumbersByDay: processUnknownNumbersByDay(sms, calls, contacts, mainPhoneNumber),
    }
}

// Helper functions

function createContactMap(contacts: Contact[]): { [key: string]: string } {
    const contactMap: { [key: string]: string } = {}
    contacts.forEach((contact) => {
        contactMap[contact["Phone Number"]] = contact["Contact Name"]
    })
    return contactMap
}

function truncateName(name: string): string {
    return name.length > 20 ? name.substring(0, 20) + "..." : name
}

function truncateNumber(number: string): string {
    if (number.length <= 12) return number
    return number.substring(0, 8) + "..." + number.substring(number.length - 4)
}

// Helper to detect the main phone number (user's own number)
function getMainPhoneNumber(sms: SMS[], calls: CallLog[]): string {
    // Try to get from the Type field in calls and SMS first
    const sentCalls = calls.filter((call) => call.Type === "Sender")
    const sentSMS = sms.filter((message) => message.Type === "Sender")

    if (sentCalls.length > 0 && sentCalls[0]["Sender Number"]) {
        return sentCalls[0]["Sender Number"]
    }
    if (sentSMS.length > 0 && sentSMS[0]["Sender Number"]) {
        return sentSMS[0]["Sender Number"]
    }

    // Fallback: count occurrences of each phone number
    const phoneCount: { [key: string]: number } = {}

    const allItems = [...calls, ...sms]
    allItems.forEach((item: any) => {
        if (item["Sender Number"] && item["Sender Number"].trim()) {
            const sender = item["Sender Number"].trim()
            phoneCount[sender] = (phoneCount[sender] || 0) + 1
        }
        if (item["Receiver Number"] && item["Receiver Number"].trim()) {
            const receiver = item["Receiver Number"].trim()
            phoneCount[receiver] = (phoneCount[receiver] || 0) + 1
        }
    })

    const sortedPhones = Object.entries(phoneCount).sort(([, a], [, b]) => b - a)
    return sortedPhones[0]?.[0] || ""
}

function processContactsActivityByDay(sms: SMS[], calls: CallLog[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const dailyData: { [key: string]: { texts: number; calls: number } } = {}

    sms.forEach((message) => {
        const date = message.Timestamp.split(" ")[0]
        const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
        if (contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            if (!dailyData[date]) dailyData[date] = { texts: 0, calls: 0 }
            dailyData[date].texts++
        }
    })

    calls.forEach((call) => {
        const date = call.Timestamp.split(" ")[0]
        const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
        if (contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            if (!dailyData[date]) dailyData[date] = { texts: 0, calls: 0 }
            dailyData[date].calls++
        }
    })

    return Object.entries(dailyData)
        .map(([date, counts]) => ({
            date,
            texts: counts.texts,
            calls: counts.calls,
            total: counts.texts + counts.calls,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
}

function processCallsPerDay(calls: CallLog[]) {
    const dayCounts: { [key: string]: number } = {}
    calls.forEach((call) => {
        const date = call.Timestamp.split(" ")[0]
        dayCounts[date] = (dayCounts[date] || 0) + 1
    })
    return Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
}

function processTextsPerDay(sms: SMS[]) {
    const dayCounts: { [key: string]: number } = {}
    sms.forEach((message) => {
        const date = message.Timestamp.split(" ")[0]
        dayCounts[date] = (dayCounts[date] || 0) + 1
    })
    return Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
}

function processTextsPerContact(sms: SMS[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const contactCounts: { [key: string]: number } = {}

    sms.forEach((message) => {
        const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
        const contactName = contactMap[contactNumber]
        if (contactName && contactNumber !== mainPhoneNumber) {
            contactCounts[contactName] = (contactCounts[contactName] || 0) + 1
        }
    })

    return Object.entries(contactCounts)
        .map(([name, value]) => ({ name: truncateName(name), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
}

function processCallsPerContact(calls: CallLog[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const contactCounts: { [key: string]: number } = {}

    calls.forEach((call) => {
        const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
        const contactName = contactMap[contactNumber]
        if (contactName && contactNumber !== mainPhoneNumber) {
            contactCounts[contactName] = (contactCounts[contactName] || 0) + 1
        }
    })

    return Object.entries(contactCounts)
        .map(([name, value]) => ({ name: truncateName(name), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
}

function processTopContactsByInteractions(sms: SMS[], calls: CallLog[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const interactionCounts: { [key: string]: { texts: number; calls: number } } = {}

    sms.forEach((message) => {
        const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
        const contactName = contactMap[contactNumber]
        if (contactName && contactNumber !== mainPhoneNumber) {
            if (!interactionCounts[contactName]) interactionCounts[contactName] = { texts: 0, calls: 0 }
            interactionCounts[contactName].texts++
        }
    })

    calls.forEach((call) => {
        const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
        const contactName = contactMap[contactNumber]
        if (contactName && contactNumber !== mainPhoneNumber) {
            if (!interactionCounts[contactName]) interactionCounts[contactName] = { texts: 0, calls: 0 }
            interactionCounts[contactName].calls++
        }
    })

    return Object.entries(interactionCounts)
        .map(([name, counts]) => ({
            name: truncateName(name),
            texts: counts.texts,
            calls: counts.calls,
            total: counts.texts + counts.calls,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
}

function processTextsPerUnknown(sms: SMS[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const unknownCounts: { [key: string]: number } = {}

    sms.forEach((message) => {
        const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
        if (!contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            unknownCounts[contactNumber] = (unknownCounts[contactNumber] || 0) + 1
        }
    })

    return Object.entries(unknownCounts)
        .map(([number, value]) => ({ name: truncateNumber(number), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
}

function processCallsPerUnknown(calls: CallLog[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const unknownCounts: { [key: string]: number } = {}

    calls.forEach((call) => {
        const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
        if (!contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            unknownCounts[contactNumber] = (unknownCounts[contactNumber] || 0) + 1
        }
    })

    return Object.entries(unknownCounts)
        .map(([number, value]) => ({ name: truncateNumber(number), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
}

function processTopUnknownByInteractions(sms: SMS[], calls: CallLog[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const interactionCounts: { [key: string]: { texts: number; calls: number } } = {}

    sms.forEach((message) => {
        const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
        if (!contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            if (!interactionCounts[contactNumber]) interactionCounts[contactNumber] = { texts: 0, calls: 0 }
            interactionCounts[contactNumber].texts++
        }
    })

    calls.forEach((call) => {
        const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
        if (!contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            if (!interactionCounts[contactNumber]) interactionCounts[contactNumber] = { texts: 0, calls: 0 }
            interactionCounts[contactNumber].calls++
        }
    })

    return Object.entries(interactionCounts)
        .map(([number, counts]) => ({
            name: truncateNumber(number),
            texts: counts.texts,
            calls: counts.calls,
            total: counts.texts + counts.calls,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
}

function processUnknownNumbersByDay(sms: SMS[], calls: CallLog[], contacts: Contact[], mainPhoneNumber: string) {
    const contactMap = createContactMap(contacts)
    const dailyData: { [key: string]: { texts: number; calls: number } } = {}

    sms.forEach((message) => {
        const date = message.Timestamp.split(" ")[0]
        const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
        if (!contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            if (!dailyData[date]) dailyData[date] = { texts: 0, calls: 0 }
            dailyData[date].texts++
        }
    })

    calls.forEach((call) => {
        const date = call.Timestamp.split(" ")[0]
        const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
        if (!contactMap[contactNumber] && contactNumber !== mainPhoneNumber) {
            if (!dailyData[date]) dailyData[date] = { texts: 0, calls: 0 }
            dailyData[date].calls++
        }
    })

    return Object.entries(dailyData)
        .map(([date, counts]) => ({
            date,
            texts: counts.texts,
            calls: counts.calls,
            total: counts.texts + counts.calls,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
}
