import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCgTruE_VVPJtHsbMif7M8ilzqzF1bVas0",
  authDomain: "itursh-1baed.firebaseapp.com",
  projectId: "itursh-1baed",
  storageBucket: "itursh-1baed.firebasestorage.app",
  messagingSenderId: "784866277132",
  appId: "1:784866277132:android:4b2df6320c77b99fda3b29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
