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
  const response = await sheets.spreadsheets.values.batchGet({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    ranges: [
      'Presentes!A2:E',
      'PresentesConvidados!A2:B',
    ],
  });

  const gifts = response.data.valueRanges[0].values.map(toGiftObject);
  const gifters = response.data.valueRanges[1].values ? response.data.valueRanges[1].values.reduce((map, [giftId, guestKey]) => {
    if (map.has(giftId)) {
      map.get(giftId).add(guestKey);
    } else {
      map.set(giftId, new Set([guestKey]));
    }
    return map;
  }, new Map()) : new Map();

  return { gifts, gifters };
}

export async function chooseGift(giftId, guestKey) {
  const { gifts } = await getAllGifts();

  const chosenGiftIndex = gifts.findIndex(({ id }) => id === giftId);
  const chosenGift = gifts[chosenGiftIndex];
  chosenGift.current += 1;
  const rowNumber = chosenGiftIndex + 2;

  await sheets.spreadsheets.values.update({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'RAW',
    range: [`Presentes!D${rowNumber}`],
    requestBody: { values: [[chosenGift.current]] }
  });

  await sheets.spreadsheets.values.append({
      auth: jwtClient,
      spreadsheetId: process.env.SPREADSHEET_ID,
      valueInputOption: 'RAW',
      range: ['PresentesConvidados'],
      resource: { values: [[giftId, guestKey]] },
  });

  return { newCurrent: chosenGift.current };
}

export function generateId() {
  return nanoid();
}

export async function findGuest(key) {
  const response = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: ['Convidados!A2:F'],
    sheets: []
  });

  if (!response.data?.values?.length)
  {
    return false;
  }

  const guestColumns = response.data.values.find((guestData) => guestData[4] === key);

  if (!guestColumns) {
    return null;
  }

  const guest = {
    name: guestColumns[0],
    surname: guestColumns[1],
    notes: guestColumns[2],
    contact: guestColumns[3],
    key: guestColumns[4],
    specialMessage: guestColumns[5],
  };

  return guest;
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
