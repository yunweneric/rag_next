/**
 * Firebase Admin SDK configuration for server-side operations
 */

import * as admin from "firebase-admin";

let adminApp: admin.app.App;

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    console.log('FIREBASE_SERVICE_ACCOUNT_KEY', process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    // In production, use service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      // In development, you can use application default credentials
      // Make sure you've run: gcloud auth application-default login
      adminApp = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
} else {
  adminApp = admin.app();
}

const adminDb = admin.firestore(adminApp);
const adminAuth = admin.auth(adminApp);

export { adminApp, adminDb, adminAuth, admin };