'use strict';
const { google } = require('googleapis');
const fs = require('fs');
const os = require('os');
const path = require('path');
async function downloadFileFromDrive(fileId) {
  const auth1 = new google.auth.GoogleAuth({
    keyFile: path.join(
      __dirname,
      'question-bulk-upload-328207-6ba6526a9398.json'
    ),
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive.photos.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
  const drive = google.drive({
    version: 'v3',
    auth: auth1,
  });
  const readFileRes = await drive.files.get({fileId: fileId});
  return drive.files
    .get({fileId, alt: 'media'}, {responseType: 'stream'})
    .then(res => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(os.tmpdir(), readFileRes.data.name);
        console.log(`writing to ${filePath}`);
        const dest = fs.createWriteStream(filePath);
        let progress = 0;

        res.data
          .on('end', () => {
            console.log(`Done downloading file ==> ${fileId}`);
            resolve(filePath);
          })
          .on('error', err => {
            console.error('Error downloading file.');
            reject(err);
          })
          .on('data', d => {
            progress += d.length;
            if (process.stdout.isTTY) {
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write(`Downloaded ${progress} bytes for ==> ${fileId}`);
            }
          })
          .pipe(dest);
      });
    });
}

if (module === require.main) {
  if (process.argv.length !== 3) {
    throw new Error('File id is missing!');
  }
  const fileId = process.argv[2];
  downloadFileFromDrive(fileId).catch((error) => {
    console.log(' downloadFileFromDrive ERROR::', error);
  });
}
module.exports = downloadFileFromDrive;
