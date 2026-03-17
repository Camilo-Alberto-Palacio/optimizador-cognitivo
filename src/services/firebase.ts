import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8s25P85i4NEnLm-c4KgByhceC-iwErZY",
  authDomain: "optimizadorcognitivo.firebaseapp.com",
  projectId: "optimizadorcognitivo",
  storageBucket: "optimizadorcognitivo.firebasestorage.app",
  messagingSenderId: "708270078689",
  appId: "1:708270078689:web:e07185005a281f4970d5a0",
  measurementId: "G-R0MH6BGV9Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
googleProvider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
googleProvider.addScope('https://www.googleapis.com/auth/fitness.body.read');
googleProvider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read');

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const getGoogleCredential = GoogleAuthProvider.credentialFromResult;
export const logoutFromFirebase = () => signOut(auth);

/**
 * Renueva el access token de Google de forma silenciosa.
 * Requiere un re-login del usuario por las restricciones de OAuth.
 * Devuelve el nuevo token o null si falla.
 */
export const refreshGoogleFitToken = async (): Promise<string | null> => {
  try {
    const silentProvider = new GoogleAuthProvider();
    // No pedimos 'select_account' para que sea más fluido
    silentProvider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    silentProvider.addScope('https://www.googleapis.com/auth/fitness.sleep.read');
    silentProvider.addScope('https://www.googleapis.com/auth/fitness.body.read');
    silentProvider.addScope('https://www.googleapis.com/auth/fitness.heart_rate.read');
    
    const result = await signInWithPopup(auth, silentProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return credential?.accessToken || null;
  } catch (err) {
    console.error('[Firebase] Token refresh failed:', err);
    return null;
  }
};

export default app;
