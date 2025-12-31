import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDG1AbKMX5xhdh3CTxOGilX21YoFev-ojI",
  authDomain: "educagame-1ef93.firebaseapp.com",
  projectId: "educagame-1ef93",
  storageBucket: "educagame-1ef93.firebasestorage.app",
  messagingSenderId: "161877422862",
  appId: "1:161877422862:web:3989327364361cd5ac9d5f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);