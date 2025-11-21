import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SMS, CallLog, Contact } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function parseFile(file: File): Promise<any[]> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  try {
    if (fileExtension === 'csv') {
      return await parseCSVFile(file);
    } else if (fileExtension === 'xlsx') {
      return await parseXLSXFile(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or XLSX files.');
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('CSV parsing complete. First 3 rows:', results.data.slice(0, 3));
        console.log('CSV columns:', results.meta.fields);
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data as any[]);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

async function parseXLSXFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellText: true,
          raw: true
        });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON using XLSX utils - more reliable approach
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 'A', // Use column letters
          raw: false, // Get formatted text
          defval: '' // Default value for empty cells
        });
        
        console.log('Raw parsed data:', jsonData);
        
        // Process the data to handle the header row properly
        const processedData = processSheetData(jsonData);
        
        console.log('Final processed data sample:', processedData.slice(0, 3));
        console.log('Total processed rows:', processedData.length);
        
        resolve(processedData);
      } catch (error) {
        console.error('XLSX parsing error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Process sheet data to handle different file types and header rows
function processSheetData(data: any[]): any[] {
  if (data.length === 0) return [];
  
  console.log('Processing sheet data, first row:', data[0]);
  
  // Check if first row contains headers or is a title row
  const firstRow = data[0];
  const secondRow = data[1];
  
  // If first row looks like a title (contains 'CALLS', 'SMS', etc.), skip it
  if (firstRow && typeof firstRow === 'object' && 
      Object.values(firstRow).some((val: any) => 
        val && val.toString().toLowerCase().includes('call') || 
        val && val.toString().toLowerCase().includes('sms'))) {
    console.log('Detected title row, skipping:', firstRow);
    data = data.slice(1);
  }
  
  // Now use the first row as headers
  if (data.length > 0) {
    const headers = data[0];
    const result = [];
    
    console.log('Using headers:', headers);
    
    // Process remaining rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const processedRow: any = {};
      
      // Map each column to its header
      Object.keys(headers).forEach((colKey) => {
        const header = headers[colKey];
        if (header && header !== '') {
          processedRow[header] = row[colKey] || '';
        }
      });
      
      // Only add row if it has data in the first column
      if (Object.values(processedRow).some(val => val && val !== '')) {
        result.push(processedRow);
      }
    }
    
    console.log('Processed data result count:', result.length);
    return result;
  }
  
  return [];
}

// SIMPLIFIED validation that works with the aggressive parsing
export function validateSMSData(data: any[]): SMS[] {
  console.log('=== SMS VALIDATION START ===');
  console.log('Input data length:', data.length);
  
  if (data.length === 0) {
    console.log('No data to validate');
    return [];
  }

  // Log the actual structure of first few items
  console.log('First 3 raw data items:');
  data.slice(0, 3).forEach((item, index) => {
    console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
    console.log(`Item ${index} keys:`, Object.keys(item));
  });

  const validated = data
    .filter(item => {
      const isValidObject = item && typeof item === 'object';
      if (!isValidObject) {
        console.log('Filtered out non-object item:', item);
      }
      return isValidObject;
    })
    .map(item => {
      // Direct mapping - use the exact column names we expect
      const sms: SMS = {
        'SMS #': String(item['SMS #'] || item['sms'] || item['id'] || ''),
        'Sender Number': String(item['Sender Number'] || item['sender'] || item['from'] || ''),
        'Receiver Number': String(item['Receiver Number'] || item['receiver'] || item['to'] || ''),
        'Message Body': String(item['Message Body'] || item['message'] || item['body'] || item['content'] || ''),
        'Type': String(item['Type'] || item['type'] || '').trim() === 'Receiver' ? 'Receiver' as const : 'Sender' as const,
        'Timestamp': String(item['Timestamp'] || item['timestamp'] || item['date'] || item['time'] || '')
      };

      console.log('Mapped SMS:', sms);
      return sms;
    })
    .filter(sms => {
      // More lenient validation - only require basic fields
      const hasBasicData = sms['SMS #'] && 
                          sms['Sender Number'] && 
                          sms['Receiver Number'] && 
                          sms['Timestamp'];
      
      if (!hasBasicData) {
        console.log('Invalid SMS item (filtered out):', sms);
        console.log('Missing fields:', {
          hasSMS: !!sms['SMS #'],
          hasSender: !!sms['Sender Number'], 
          hasReceiver: !!sms['Receiver Number'],
          hasTimestamp: !!sms['Timestamp']
        });
      }
      
      return hasBasicData;
    });

  console.log('=== SMS VALIDATION RESULTS ===');
  console.log('Valid items:', validated.length);
  console.log('Invalid items:', data.length - validated.length);
  
  if (validated.length > 0) {
    console.log('First 3 validated items:', validated.slice(0, 3));
  } else {
    console.log('NO VALID ITEMS FOUND - Debugging first invalid item:');
    if (data.length > 0) {
      const firstItem = data[0];
      console.log('First item structure:', firstItem);
      console.log('First item keys:', Object.keys(firstItem));
      console.log('First item values:', {
        'SMS #': firstItem['SMS #'],
        'Sender Number': firstItem['Sender Number'],
        'Receiver Number': firstItem['Receiver Number'], 
        'Message Body': firstItem['Message Body'],
        'Type': firstItem['Type'],
        'Timestamp': firstItem['Timestamp']
      });
    }
  }
  
  return validated;
}

export function validateCallData(data: any[]): CallLog[] {
  console.log('=== CALL VALIDATION START ===');
  console.log('Input data length:', data.length);
  
  if (data.length === 0) {
    console.log('No data to validate');
    return [];
  }

  // Log the actual structure of first few items
  console.log('First 3 raw data items:');
  data.slice(0, 3).forEach((item, index) => {
    console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
    console.log(`Item ${index} keys:`, Object.keys(item));
  });

  const validated = data
    .filter(item => {
      const isValidObject = item && typeof item === 'object';
      if (!isValidObject) {
        console.log('Filtered out non-object item:', item);
      }
      return isValidObject;
    })
    .map(item => {
      // Direct mapping for call logs - handle different column name variations
      const call: CallLog = {
        'Call #': String(item['Call #'] || item['Call'] || item['call #'] || item['call'] || item['id'] || ''),
        'Sender Number': String(item['Sender Number'] || item['Sender'] || item['sender number'] || item['sender'] || item['from'] || ''),
        'Receiver Number': String(item['Receiver Number'] || item['Receiver'] || item['receiver number'] || item['receiver'] || item['to'] || ''),
        'Type': String(item['Type'] || item['type'] || '').trim() === 'Receiver' ? 'Receiver' as const : 'Sender' as const,
        'Timestamp': String(item['Timestamp'] || item['timestamp'] || item['date'] || item['time'] || '')
      };

      console.log('Mapped Call:', call);
      return call;
    })
    .filter(call => {
      // More lenient validation - only require basic fields
      const hasBasicData = call['Call #'] && 
                          call['Sender Number'] && 
                          call['Receiver Number'] && 
                          call['Timestamp'];
      
      if (!hasBasicData) {
        console.log('Invalid Call item (filtered out):', call);
        console.log('Missing fields:', {
          hasCall: !!call['Call #'],
          hasSender: !!call['Sender Number'], 
          hasReceiver: !!call['Receiver Number'],
          hasTimestamp: !!call['Timestamp']
        });
      }
      
      return hasBasicData;
    });

  console.log('=== CALL VALIDATION RESULTS ===');
  console.log('Valid items:', validated.length);
  console.log('Invalid items:', data.length - validated.length);
  
  if (validated.length > 0) {
    console.log('First 3 validated items:', validated.slice(0, 3));
  } else {
    console.log('NO VALID ITEMS FOUND - Debugging first invalid item:');
    if (data.length > 0) {
      const firstItem = data[0];
      console.log('First item structure:', firstItem);
      console.log('First item keys:', Object.keys(firstItem));
      console.log('First item values:', {
        'Call #': firstItem['Call #'],
        'Sender Number': firstItem['Sender Number'],
        'Receiver Number': firstItem['Receiver Number'], 
        'Type': firstItem['Type'],
        'Timestamp': firstItem['Timestamp']
      });
    }
  }
  
  return validated;
}

export function validateContactData(data: any[]): Contact[] {
  console.log('Validating Contact data, input length:', data.length);
  
  if (data.length === 0) return [];

  console.log('Contact column names from first item:', Object.keys(data[0]));
  
  const validated = data
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const normalizedItem = normalizeKeys(item);
      
      const contact: Contact = {
        'Contact Name': String(normalizedItem['contact name'] || normalizedItem['name'] || normalizedItem['contact'] || ''),
        'Phone Number': String(normalizedItem['phone number'] || normalizedItem['phone'] || normalizedItem['number'] || ''),
        'Additional Info': normalizedItem['additional info'] || normalizedItem['info'] || normalizedItem['notes'] || ''
      };

      return contact;
    })
    .filter(contact => {
      const isValid = contact['Contact Name'] &&
        contact['Phone Number'];
      
      return isValid;
    });

  console.log('Contact validation result:', validated.length, 'valid items out of', data.length);
  return validated;
}

// Helper function to normalize object keys
function normalizeKeys(obj: any): any {
  const normalized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const normalizedKey = key.toLowerCase().trim();
      normalized[normalizedKey] = obj[key];
    }
  }
  return normalized;
}