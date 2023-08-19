import 'dotenv/config';
import { google } from 'googleapis';

let jwtClient;
let sheets;

export async function connect() {
  jwtClient = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );
  
  await jwtClient.authorize();
  sheets = google.sheets('v4');
}

export async function getAllGifts() {
  const response = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: ['A2:E'],
  });

  return response.data.values.map(toGiftObject);
}

function toGiftObject(row) {
  const [id, description, photo_url, current, maximum] = row;
  return ({
    id,
    description,
    photo_url,
    current: parseIntWithDefault(current),
    maximum: parseIntWithDefault(maximum),
  });
}

function parseIntWithDefault(intAsString) {
  const parsed = Number.parseInt(intAsString);

  return !Number.isNaN(parsed) ? parsed : 0;
} 
