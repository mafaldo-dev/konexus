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
  projectId: process.env.REACT_APP_SECRET_PROJECT_ID,
  storageBucket: process.env.REACT_APP_SECRET_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_SECRET_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_SECRET_APP_ID,
  measurementId: process.env.REACT_APP_SECRET_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)
//const analytics = getAnalytics(app);


export { db }