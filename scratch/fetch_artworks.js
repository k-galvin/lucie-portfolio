import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    env[key] = val;
  }
});

const firebaseConfig = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.PUBLIC_FIREBASE_APP_ID,
};

console.log('Initializing Firebase with Project ID:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  try {
    const querySnapshot = await getDocs(collection(db, 'artworks'));
    console.log(`Found ${querySnapshot.size} artworks:`);
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      console.log(`- ID: ${docSnap.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  ImageUrl: ${data.imageUrl}`);
      console.log(`  Status: ${data.status}`);
      console.log('-----------------------------------');
    });
  } catch (err) {
    console.error('Error fetching artworks:', err);
  }
}

main();
