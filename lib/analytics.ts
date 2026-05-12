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
    callsPerDay: { date: string; count: number; outgoing: number; incoming: number }[]
    textsPerDay: { date: string; count: number }[]
    textsPerContact: { name: string; value: number }[]
    callsPerContact: { name: string; value: number; outgoing: number; incoming: number }[]
    topContactsByInteractions: { name: string; texts: number; calls: number; total: number }[]
    contactsActivityByDay: { date: string; texts: number; calls: number; total: number }[]
    textsPerUnknown: { name: string; value: number }[]
    callsPerUnknown: { name: string; value: number }[]
    topUnknownByInteractions: { name: string; texts: number; calls: number; total: number }[]
    unknownNumbersByDay: { date: string; texts: number; calls: number; total: number }[]
    mainPhoneNumber: string
    callConversations: any[]
}

export function processCommunicationData(data: ParsedData): CommunicationStats {
    const { sms, calls, contacts } = data
    const mainPhoneNumber = getMainPhoneNumber(sms, calls)
    const contactMap = createContactMap(contacts)

    // Initialize maps for single-pass aggregation
    const dailyMap: Record<string, { texts: number; calls: number; outgoing: number; incoming: number }> = {}
    const contactMapStats: Record<string, { texts: number; calls: number; outgoing: number; incoming: number }> = {}
    const unknownMapStats: Record<string, { texts: number; calls: number }> = {}
    const unknownDailyMap: Record<string, { texts: number; calls: number }> = {}
    const callConversationMap: Record<string, { contactName: string; calls: any[]; lastActivityTime: number; lastActivity: string }> = {}

    // Helper to get or init daily entry
    const getDaily = (date: string) => {
        if (!dailyMap[date]) dailyMap[date] = { texts: 0, calls: 0, outgoing: 0, incoming: 0 }
        return dailyMap[date]
    }

    // Helper to get or init contact entry
    const getContact = (name: string) => {
        if (!contactMapStats[name]) contactMapStats[name] = { texts: 0, calls: 0, outgoing: 0, incoming: 0 }
        return contactMapStats[name]
    }

    // Process SMS in one pass
    sms.forEach((message) => {
        const date = message.Timestamp.split(" ")[0]
        const isOutgoing = message["Sender Number"] === mainPhoneNumber || message.Type === "Sender"
        const contactNumber = isOutgoing ? message["Receiver Number"] : message["Sender Number"]
        const contactName = contactMap[contactNumber]

        // Global daily
        const d = getDaily(date)
        d.texts++

        if (contactName && contactNumber !== mainPhoneNumber) {
            // Known contact stats
            const c = getContact(contactName)
            c.texts++
        } else if (contactNumber !== mainPhoneNumber) {
            // Unknown contact stats
            if (!unknownMapStats[contactNumber]) unknownMapStats[contactNumber] = { texts: 0, calls: 0 }
            unknownMapStats[contactNumber].texts++

            // Unknown daily
            if (!unknownDailyMap[date]) unknownDailyMap[date] = { texts: 0, calls: 0 }
            unknownDailyMap[date].texts++
        }
    })

    // Process Calls in one pass
    calls.forEach((call) => {
        const date = call.Timestamp.split(" ")[0]
        const isOutgoing = call["Sender Number"] === mainPhoneNumber || call.Type === "Sender"
        const contactNumber = isOutgoing ? call["Receiver Number"] : call["Sender Number"]
        const contactName = contactMap[contactNumber]

        // Global daily
        const d = getDaily(date)
        d.calls++
        if (isOutgoing) d.outgoing++
        else d.incoming++

        if (contactName && contactNumber !== mainPhoneNumber) {
            // Known contact stats
            const c = getContact(contactName)
            c.calls++
            if (isOutgoing) c.outgoing++
            else c.incoming++
        } else if (contactNumber !== mainPhoneNumber) {
            // Unknown contact stats
            if (!unknownMapStats[contactNumber]) unknownMapStats[contactNumber] = { texts: 0, calls: 0 }
            unknownMapStats[contactNumber].calls++

            // Unknown daily
            if (!unknownDailyMap[date]) unknownDailyMap[date] = { texts: 0, calls: 0 }
            unknownDailyMap[date].calls++
        }
        // Call Conversations (New)
        if (!callConversationMap[contactName || contactNumber]) {
            callConversationMap[contactName || contactNumber] = {
                contactName: contactName || `Unknown (${contactNumber})`,
                calls: [],
                lastActivityTime: 0,
                lastActivity: ""
            }
        }
        const conv = callConversationMap[contactName || contactNumber]
        conv.calls.push({ ...call, isOutgoing })
        const callTime = new Date(call.Timestamp).getTime()
        if (callTime > conv.lastActivityTime) {
            conv.lastActivityTime = callTime
            conv.lastActivity = call.Timestamp
        }
    })

    // Downsampling helper
    const downsample = (arr: any[], max: number) => {
        if (arr.length <= max) return arr
        const ratio = Math.ceil(arr.length / max)
        return arr.filter((_, i) => i % ratio === 0)
    }

    // Final result building
    return {
        callsPerDay: downsample(Object.entries(dailyMap)
            .map(([date, s]) => ({ 
                date, 
                count: s.calls + s.texts, 
                calls: s.calls,
                texts: s.texts,
                outgoing: s.outgoing, 
                incoming: s.incoming 
            }))
            .sort((a, b) => a.date.localeCompare(b.date)), 60),
        
        textsPerDay: downsample(Object.entries(dailyMap)
            .filter(([_, s]) => s.texts > 0 || s.calls > 0) // Ensure we have some activity to show
            .map(([date, s]) => ({ date, count: s.texts, calls: s.calls }))
            .sort((a, b) => a.date.localeCompare(b.date)), 60),

        textsPerContact: Object.entries(contactMapStats)
            .filter(([_, s]) => s.texts > 0)
            .map(([name, s]) => ({ name: truncateName(name), value: s.texts }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8),

        callsPerContact: Object.entries(contactMapStats)
            .filter(([_, s]) => s.calls > 0)
            .map(([name, s]) => ({ name: truncateName(name), value: s.calls, outgoing: s.outgoing, incoming: s.incoming }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8),

        topContactsByInteractions: Object.entries(contactMapStats)
            .map(([name, s]) => ({
                name: truncateName(name),
                texts: s.texts,
                calls: s.calls,
                total: s.texts + s.calls
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10),

        contactsActivityByDay: downsample(Object.entries(dailyMap)
            .map(([date, s]) => ({
                date,
                texts: s.texts,
                calls: s.calls,
                total: s.texts + s.calls
            }))
            .sort((a, b) => a.date.localeCompare(b.date)), 60),

        textsPerUnknown: Object.entries(unknownMapStats)
            .filter(([_, s]) => s.texts > 0)
            .map(([number, s]) => ({ name: truncateNumber(number), value: s.texts }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8),

        callsPerUnknown: Object.entries(unknownMapStats)
            .filter(([_, s]) => s.calls > 0)
            .map(([number, s]) => ({ name: truncateNumber(number), value: s.calls }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8),

        topUnknownByInteractions: Object.entries(unknownMapStats)
            .map(([number, s]) => ({
                name: truncateNumber(number),
                texts: s.texts,
                calls: s.calls,
                total: s.texts + s.calls
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10),

        unknownNumbersByDay: downsample(Object.entries(unknownDailyMap)
            .map(([date, s]) => ({
                date,
                texts: s.texts,
                calls: s.calls,
                total: s.texts + s.calls
            }))
            .sort((a, b) => a.date.localeCompare(b.date)), 60),

        callConversations: Object.values(callConversationMap)
            .map(c => ({
                ...c,
                callCount: c.calls.length,
                calls: c.calls.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
            }))
            .sort((a, b) => b.lastActivityTime - a.lastActivityTime),

        mainPhoneNumber
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
