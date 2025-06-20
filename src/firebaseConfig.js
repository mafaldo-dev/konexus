// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_SECRET_API_GOOGLE,
  authDomain: process.env.REACT_APP_SECRET_AUTH_DOMAINS,
  projectId: "keppler-63a74",
  storageBucket: "keppler-63a74.firebasestorage.app",
  messagingSenderId: "783076782517",
  appId: "1:783076782517:web:fa7e7c286efcfdcc3969fc",
  measurementId: "G-N1XMFCEH3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)
//const analytics = getAnalytics(app);


export { db }