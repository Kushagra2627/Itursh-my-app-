const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;

// 1. Try to load from an environment variable (for EC2/Deployment)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT Env Var:", e.message);
  }
}

// 2. Fallback to the local file (for Local Development)
if (!serviceAccount) {
  try {
    // Note: Using the exact filename you placed in the backend folder
    serviceAccount = require(path.join(__dirname, '../../itursh-1baed-firebase-adminsdk-fbsvc-65dfcdcefc.json'));
  } catch (e) {
    console.error("Firebase Service Account file not found. Make sure to set FIREBASE_SERVICE_ACCOUNT in your .env");
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.error("CRITICAL: Firebase Admin could not be initialized due to missing credentials.");
}

module.exports = admin;
