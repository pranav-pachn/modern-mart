// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDL-5iR09phSY50z36ANQIKkzFxPzmaSE4",
  authDomain: "grocery-web-441f4.firebaseapp.com",
  projectId: "grocery-web-441f4",
  storageBucket: "grocery-web-441f4.firebasestorage.app",
  messagingSenderId: "740539337125",
  appId: "1:740539337125:web:9ca50591822bc75bff804c",
  measurementId: "G-18KYH5PDE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);