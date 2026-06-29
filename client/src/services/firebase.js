import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0VNBKlq-tEPt2EZAnpwfU3cluVlVyYI",
  authDomain: "smart-bus-ticketing-app-bffb1.firebaseapp.com",
  projectId: "smart-bus-ticketing-app-bffb1",
  storageBucket: "smart-bus-ticketing-app-bffb1.firebasestorage.app",
  messagingSenderId: "339482946871",
  appId: "1:339482946871:web:3837669ce2c3f7fc6e7eb2",
  measurementId: "G-NS1E2K0G6L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Storage
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

export default app;
