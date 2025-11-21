export interface SMS {
  'SMS #': string;
  'Sender Number': string;
  'Receiver Number': string;
  'Message Body': string;
  'Type': 'Sender' | 'Receiver';
  'Timestamp': string;
}

export interface CallLog {
  'Call #': string;
  'Sender Number': string;
  'Receiver Number': string;
  'Type': 'Sender' | 'Receiver';
  'Timestamp': string;
}

export interface Contact {
  'Contact Name': string;
  'Phone Number': string;
  'Additional Info'?: string;
}

export interface UploadedFiles {
  sms?: File[];
  calls?: File[];
  contacts?: File[];
}

export interface ParsedData {
  sms: SMS[];
  calls: CallLog[];
  contacts: Contact[];
}