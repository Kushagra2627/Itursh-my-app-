const admin = require('firebase-admin');
const path = require('path');

// Load the service account key
const serviceAccount = require(path.join(__dirname, '../../itursh-1baed-firebase-adminsdk-fbsvc-65dfcdcefc.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
