import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAUOPFTdUUj7Kz34k8BwXg49J8xCkF7XJk',
  authDomain: 'avellaneda-en-vivo.firebaseapp.com',
  projectId: 'avellaneda-en-vivo',
  storageBucket: 'avellaneda-en-vivo.firebasestorage.app',
  messagingSenderId: '1082383998928',
  appId: '1:1082383998928:web:eef3a97352e336c53663d5',
  measurementId: 'G-9V6JB7D2Y2',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };