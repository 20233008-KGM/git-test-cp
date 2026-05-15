import { initializeApp } from 'firebase/app';
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA0c7LJmkNap67_snwfAlMCnwf6daus14k",
    authDomain: "awesome-69d30.firebaseapp.com",
    projectId: "awesome-69d30",
    storageBucket: "awesome-69d30.firebasestorage.app",
    messagingSenderId: "306370177530",
    appId: "1:306370177530:web:1a93a7d09b61c92a6d1c43",
    measurementId: "G-BJ6YXMK8QF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
