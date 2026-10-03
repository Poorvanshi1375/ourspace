// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: replace with *your* firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyAowhGjwyIKTIs9VcRJSSIQy7yFELmcOkg",
  authDomain: "ourspace-dev.firebaseapp.com",
  projectId: "ourspace-dev",
  storageBucket: "ourspace-dev.appspot.com",
  messagingSenderId: "619219833536",
  appId: "1:619219833536:web:f84f5410395650a954d325",
  measurementId: "G-XMG7L5GM6W"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);     