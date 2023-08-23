import 'dotenv/config';
import { customAlphabet } from 'nanoid';
import { google } from 'googleapis';

import { BusinessLogicError } from './business-logic-error.js';

let jwtClient;
let sheets;

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);

export async function connect() {
  const base64Key = process.env.PRIVATE_KEY;
  const buffer = Buffer.from(base64Key, 'base64');
  const privateKey = buffer.toString('ascii');

  jwtClient = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );
  
  await jwtClient.authorize();
  sheets = google.sheets('v4');
}

export async function getAllGifts() {
  const response = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: ['Presentes!A2:E'],
  });

  return response.data.values.map(toGiftObject);
}

export async function chooseGift(giftId) {
  const gifts = await getAllGifts();

  const chosenGiftIndex = gifts.findIndex(({ id }) => id === giftId);
  const chosenGift = gifts[chosenGiftIndex];
  if (chosenGift.current >= chosenGift.maximum) {
    throw new BusinessLogicError({
      message: 'Cannot choose this gift, it has already reached maximum',
      code: 1,
    });
  }

  chosenGift.current += 1;
  const rowNumber = chosenGiftIndex + 2;

  await sheets.spreadsheets.values.update({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'RAW',
    range: [`Presentes!D${rowNumber}`],
    requestBody: { values: [[chosenGift.current]] }
  });

  return { newCurrent: chosenGift.current };
}

export function generateId() {
  return nanoid();
}

export async function verifyKey(key) {
  const response = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: ['Convidados!E2:E'],
    sheets: []
  });

  if (!response.data?.values?.length)
  {
    return false;
  }

  const keys = response.data.values.flat();
  return keys.findIndex((existingKey) => existingKey === key) !== -1;
}

function toGiftObject(row) {
  const [id, description, photo_url, current, maximum] = row;
  return ({
    id,
    description,
    photo_url: parsePhotoUrl(photo_url),
    current: parseIntWithDefault(current),
    maximum: parseIntWithDefault(maximum),
  });
}

function parsePhotoUrl(photoUrl) {
  if (!photoUrl?.includes('drive.google')) {
    return photoUrl;
  }

  const extractedId = photoUrl.match(/(?<=file\/d\/).*(?=\/view)/)[0];
  const extractedPhotoUrl = `https://drive.google.com/uc?id=${extractedId}`;

  return extractedPhotoUrl;
}

function parseIntWithDefault(intAsString) {
  const parsed = Number.parseInt(intAsString);

  return !Number.isNaN(parsed) ? parsed : 0;
}

// Populate IDs
// const response = await sheets.spreadsheets.values.get({
//   auth: jwtClient,
//   spreadsheetId: process.env.SPREADSHEET_ID,
//   range: ['A2:E'],
// });

// console.log(response.data.values.map(() => [nanoid()]));

// await sheets.spreadsheets.values.update({
//   auth: jwtClient,
//   spreadsheetId: process.env.SPREADSHEET_ID,
//   valueInputOption: 'RAW',
//   range: ['A2:A'],
//   requestBody: { values: response.data.values.map(() => [nanoid()]) }
// });
