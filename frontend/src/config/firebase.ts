// Firebase configuration for Fragranza
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcJSZ0ZGRaPypCZngGBSF7J3QI3NpDeks",
  authDomain: "fragranza-olio.firebaseapp.com",
  projectId: "fragranza-olio",
  storageBucket: "fragranza-olio.firebasestorage.app",
  messagingSenderId: "825505520720",
  appId: "1:825505520720:web:c526ae47d5dea98fde0555",
  measurementId: "G-1HHCSJP5RN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Auth
const auth = getAuth(app);

export { app, analytics, auth };
export default app;
