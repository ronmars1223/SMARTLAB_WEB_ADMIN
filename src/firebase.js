// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Add this import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsoxuTXhtOyQQIWZNDpyiWfOw6XgK5F8Y",
  authDomain: "smartlab-e2107.firebaseapp.com",
  databaseURL: "https://smartlab-e2107-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartlab-e2107",
  storageBucket: "smartlab-e2107.firebasestorage.app",
  messagingSenderId: "1025540647070",
  appId: "1:1025540647070:web:af708cc3962933eac9738f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app); 