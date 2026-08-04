import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Read config or fallback to provisioned details
const firebaseConfig = {
  projectId: "clever-healer-n7c1c",
  appId: "1:1087602735667:web:189a1788c3ae7e0c264146",
  apiKey: "AIzaSyCvE6d-Bm0jOOTYlqofrz0BAQA1t4ywW8E",
  authDomain: "clever-healer-n7c1c.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-faturathieinvoic-dac9e5d8-682a-4ddc-8f24-216ffdd16c43",
  storageBucket: "clever-healer-n7c1c.firebasestorage.app",
  messagingSenderId: "1087602735667"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
