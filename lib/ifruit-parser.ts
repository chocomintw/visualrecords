import type { SMS, CallLog, Contact } from "@/types";

export interface IFruitExport {
  sms: SMS[];
  calls: CallLog[];
  contacts: Contact[];
}

export function parseIFruitFile(text: string): IFruitExport {
  const lines = text.split('\n').map(l => l.trim());
  const sms: SMS[] = [];
  const calls: CallLog[] = [];
  const contacts: Contact[] = [];
  
  let ownerNumber = "";
  let currentSection = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Check for header
    if (line.toLowerCase().startsWith("ifruit")) {
      const match = line.match(/Ifruit.*?- (\d+) -.*$/i);
      if (match) {
        ownerNumber = match[1];
      }
      continue;
    }
    
    if (line === "CONTACTS:") {
      currentSection = "CONTACTS";
      continue;
    } else if (line === "MESSAGE HISTORY:") {
      currentSection = "MESSAGES";
      continue;
    } else if (line === "CALL HISTORY:") {
      currentSection = "CALLS";
      continue;
    }
    
    if (currentSection === "CONTACTS") {
      // Format: Rami (07612383) - Offline
      const match = line.match(/^(.*?)\s*\(([\d#]+)\)/);
      if (match) {
        contacts.push({
          "Contact Name": match[1].trim(),
          "Phone Number": match[2],
          "Full Name": ""
        });
      }
    } else if (currentSection === "MESSAGES") {
      // Format: [01/APR/2026 - 23:17] #26743273 -> #03776575: come inside the trap
      const match = line.match(/^\[(.*?)\]\s*#(\d+)\s*->\s*#(\d+):\s*(.*)$/);
      if (match) {
        const timestamp = match[1];
        const sender = match[2];
        const receiver = match[3];
        const body = match[4];
        
        let type: "Sender" | "Receiver" = "Sender";
        if (ownerNumber) {
          type = (sender === ownerNumber) ? "Sender" : "Receiver";
        }
        
        sms.push({
          "SMS #": `SMS-${sms.length + 1}`,
          "Sender Number": sender,
          "Receiver Number": receiver,
          "Message Body": body,
          Type: type,
          Timestamp: timestamp
        });
      }
    } else if (currentSection === "CALLS") {
      // Format: [03/APR/2026 - 23:37] Outgoing call to #80653720.
      // Format: [03/APR/2026 - 16:33] Received call from #56484302.
      const outgoingMatch = line.match(/^\[(.*?)\]\s*Outgoing call to\s*#([\d_]+)\.?$/i);
      const receivedMatch = line.match(/^\[(.*?)\]\s*Received call from\s*#([\d_]+)\.?$/i);
      
      if (outgoingMatch) {
         calls.push({
           "Call #": `CALL-${calls.length + 1}`,
           "Sender Number": ownerNumber,
           "Receiver Number": outgoingMatch[2],
           "Call Info": "Outgoing call",
           Type: "Sender",
           Timestamp: outgoingMatch[1]
         });
      } else if (receivedMatch) {
         calls.push({
           "Call #": `CALL-${calls.length + 1}`,
           "Sender Number": receivedMatch[2],
           "Receiver Number": ownerNumber,
           "Call Info": "Received call",
           Type: "Receiver",
           Timestamp: receivedMatch[1]
         });
      } else {
         // Some numbers might not be just digits. We can adjust the regex above if needed -> [\d_]+
      }
    }
  }
  
  return { sms, calls, contacts };
}

export function generateCSV(data: any[], type: 'sms' | 'calls' | 'contacts'): string {
  if (data.length === 0) return "";
  
  let headers: string[] = [];
  if (type === 'sms') headers = ["SMS #","Sender Number","Receiver Number","Message Body","Type","Timestamp"];
  else if (type === 'calls') headers = ["Call #","Sender Number","Call Info","Receiver Number","Type","Timestamp"];
  else if (type === 'contacts') headers = ["Contact Name","Phone Number","Full Name"];
  
  const escapeCSV = (val: string) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(item => headers.map(h => escapeCSV(item[h] || "")).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}
