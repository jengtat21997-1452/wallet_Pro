import { getAccessToken } from './auth';

const SPREADSHEET_NAME = 'รายรับรายจ่าย_App';

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
}

export async function getOrCreateSpreadsheet(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  // Search for the file in Drive
  const query = encodeURIComponent(`name='${SPREADSHEET_NAME}' and trashed=false and mimeType='application/vnd.google-apps.spreadsheet'`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // If not found, create a new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_NAME
      },
      sheets: [
        {
          properties: {
            title: 'Transactions'
          }
        }
      ]
    })
  });
  
  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;

  // Add Headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A1:F1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [['ID', 'Date', 'Type', 'Amount', 'Category', 'Note']]
    })
  });

  return spreadsheetId;
}

export async function fetchTransactions(spreadsheetId: string): Promise<Transaction[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A:F`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  
  if (!data.values || data.values.length <= 1) return [];

  // Skip header row
  const rows = data.values.slice(1);
  return rows.map((row: any[]) => ({
    id: row[0] || '',
    date: row[1] || '',
    type: row[2] as 'income' | 'expense',
    amount: parseFloat(row[3]) || 0,
    category: row[4] || '',
    note: row[5] || ''
  })).reverse(); // newest first
}

export async function addTransaction(spreadsheetId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const newId = crypto.randomUUID();
  const newTx: Transaction = { id: newId, ...transaction };

  const values = [
    [
      newTx.id,
      newTx.date,
      newTx.type,
      newTx.amount.toString(),
      newTx.category,
      newTx.note
    ]
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A:F:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  return newTx;
}
