// src/lib/firebase/admin.ts

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { serverEnv } from '@/lib/server-env';
import path from 'path';
import fs from 'fs';

let app: App;

console.log('\n--- [Firebase Admin] Top of file ---');

if (!getApps().length) {
  try {
    console.log('[Firebase Admin] 1. No existing app found. Starting new initialization...');
    
    const jsonPath = serverEnv.FIREBASE_SERVICE_ACCOUNT_JSON_PATH;
    console.log(`[Firebase Admin] 2. Path to service account JSON received from server-env: "${jsonPath}"`);

    if (!jsonPath || typeof jsonPath !== 'string') {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_PATH is missing or not a string.');
    }

    const serviceAccountPath = path.resolve(process.cwd(), jsonPath);
    console.log(`[Firebase Admin] 3. Resolved absolute path to service account: ${serviceAccountPath}`);
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file does NOT exist at the resolved path.`);
    }
    console.log(`[Firebase Admin] 4. Service account file confirmed to exist.`);

    console.log('[Firebase Admin] 5. Reading and parsing service account file...');
    const serviceAccountFileContent = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountFileContent);
    console.log(`[Firebase Admin] 6. Successfully parsed service account for project: ${serviceAccount.project_id}`);

    console.log('[Firebase Admin] 7. Initializing app with parsed service account object and explicit projectId...');
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id, // Explicitly pass the projectId
    });
    console.log(`✅ [Firebase Admin] 8. SUCCESS: Initialized app for project: ${app.options.projectId}`);

  } catch (error: any) {
    console.error('❌ [Firebase Admin] 8. FATAL: Failed to initialize Firebase Admin SDK. This will break all auth functionality.');
    console.error(error);
  }
} else {
  app = getApps()[0];
  console.log(`[Firebase Admin] Using existing app instance for project: ${app.options.projectId}`);
}

/**
 * A server-side instance of the Firebase Admin Auth SDK.
 * Use this for all server-side authentication tasks like creating session cookies
 * and verifying them.
 */
export const adminAuth = getAuth(app!); // Non-null assertion: if init fails, we want it to crash.
export default app;
