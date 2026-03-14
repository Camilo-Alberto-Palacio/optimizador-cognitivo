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

// Inicializamos la Aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Inicializamos el servicio de Autenticación
export const auth = getAuth(app);

// Inicializamos la Base de Datos
export const db = getFirestore(app);

// Configuramos el Proveedor de Google
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Funciones de conveniencia para exportar y usar en los componentes
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutFromFirebase = () => signOut(auth);

export default app;
