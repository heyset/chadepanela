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
  const giftGiftersMap = response.data.valueRanges[1].values ? response.data.valueRanges[1].values.reduce((map, [giftId, guestKey]) => {
    if (map.has(giftId)) {
      map.get(giftId).add(guestKey);
    } else {
      map.set(giftId, new Set([guestKey]));
    }
    return map;
  }, new Map()) : new Map();

  return { gifts, giftGiftersMap, giftersTable: response.data.valueRanges[1] };
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

export async function unchooseGift(giftId, guestKey) {
  const { gifts, giftersTable } = await getAllGifts();

  const chosenGiftIndex = gifts.findIndex(({ id }) => id === giftId);
  const chosenGift = gifts[chosenGiftIndex];
  chosenGift.current -= 1;
  const giftRowNumber = chosenGiftIndex + 2;


  await sheets.spreadsheets.values.update({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'RAW',
    range: [`Presentes!D${giftRowNumber}`],
    requestBody: { values: [[chosenGift.current]] }
  });

  const jointTableRowIndex = giftersTable.values.findIndex(([id, key]) => id === giftId && key === guestKey) + 1;

  sheets.spreadsheets.batchUpdate({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: '1428345834',
              dimension: 'ROWS',
              startIndex: jointTableRowIndex,
              endIndex: jointTableRowIndex + 1,
            },
          },
        }
      ],
    },
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
    range: ['Convidados!A2:I'],
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

  const rsvpDictionary = {
    Pendente: 'pending',
    Ausente: 'declined',
    Confirmado: 'accepted',
  };

  const guest = {
    name: guestColumns[0],
    surname: guestColumns[1],
    notes: guestColumns[2],
    contact: guestColumns[3],
    key: guestColumns[4],
    specialMessage: guestColumns[5],
    rsvp: {
      status: rsvpDictionary[guestColumns[6]] || rsvpDictionary['Pendente'],
      message: guestColumns[6],
    },
    isBetaTester: guestColumns[8] === 'Sim',
  };

  return guest;
}

export async function updateGuestRSVP(key, rsvp) {
  const allGuestsResponse = await sheets.spreadsheets.values.get({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: ['Convidados!A2:G'],
    sheets: []
  });
  const guestIndex = allGuestsResponse.data.values.findIndex((guestData) => guestData[4] === key);

  const rsvpDictionary = {
    pending: 'Pendente',
    declined: 'Ausente',
    accepted: 'Confirmado',
  };
  const newRSVP = rsvpDictionary[rsvp];

  const rowNumber = guestIndex + 2;

  await sheets.spreadsheets.values.update({
    auth: jwtClient,
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'RAW',
    range: [`Convidados!G${rowNumber}`],
    requestBody: { values: [[newRSVP]] }
  });

  return { newRSVP };
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
