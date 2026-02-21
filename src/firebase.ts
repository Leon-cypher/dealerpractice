import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence, 
  setPersistence, 
  inMemoryPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRqgjEUfAaH6VDmWUojfXwcMpXlfEfuYA",
  authDomain: "leon-lab-7066b.web.app",
  projectId: "leon-lab-7066b",
  storageBucket: "leon-lab-7066b.firebasestorage.app",
  messagingSenderId: "949396562765",
  appId: "1:949396562765:web:e211271132e8a23d998d04",
  measurementId: "G-GXSYN1G6J5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// 設定登入狀態持久化
const initializePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("✅ Using localStorage persistence");
  } catch (error) {
    console.warn("⚠️ localStorage not available, using memory persistence:", error);
    try {
      await setPersistence(auth, inMemoryPersistence);
    } catch (fallbackError) {
      console.error("❌ Failed to set persistence:", fallbackError);
    }
  }
};

initializePersistence();

// 強制選擇帳號
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;