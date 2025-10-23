/**
 * Firebase Admin SDK configuration for server-side operations
 */

import * as admin from "firebase-admin";

let adminApp: admin.app.App | undefined;

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // In production, use service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('Firebase Admin initialized with service account');
    } else {
      // In development, try to use application default credentials
      // If that fails, create a mock admin for development
      try {
        adminApp = admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
        });
        console.log('Firebase Admin initialized with application default credentials');
      } catch (defaultCredsError) {
        console.warn('Application default credentials not available, creating mock admin for development');
        // Create a mock admin app for development
        adminApp = admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
        }, 'dev-admin');
      }
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    // In development, don't throw error, just log it
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase Admin initialization failed, but continuing in development mode');
    } else {
      throw error;
    }
  }
} else {
  adminApp = admin.app();
}

const adminDb = adminApp ? admin.firestore(adminApp) : null;
const adminAuth = adminApp ? admin.auth(adminApp) : null;

export { adminApp, adminDb, adminAuth, admin };