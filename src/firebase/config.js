// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
};


// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialize os serviços que vamos usar
const db = getFirestore(app);
const auth = getAuth(app);

// Função para autenticação anônima
export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Usuário logado anonimamente:", userCredential.user.uid);
    return userCredential.user.uid;
  } catch (error) {
    console.error("Erro ao fazer login anônimo:", error);
    return null; // Retorne null em caso de erro para lidar com ele no DuelDemo
  }
};

export { db, auth };