import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRqgjEUfAaH6VDmWUojfXwcMpXlfEfuYA",
  authDomain: "leon-lab-7066b.firebaseapp.com",
  projectId: "leon-lab-7066b",
  storageBucket: "leon-lab-7066b.firebasestorage.app",
  messagingSenderId: "949396562765",
  appId: "1:949396562765:web:e211271132e8a23d998d04",
  measurementId: "G-GXSYN1G6J5"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出各項服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// 嘗試設定持久性，如果失敗則使用記憶體模式
const initializePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn("localStorage not available, falling back to memory persistence:", error);
    try {
      await setPersistence(auth, inMemoryPersistence);
    } catch (fallbackError) {
      console.error("Failed to set any persistence:", fallbackError);
    }
  }
};

initializePersistence();

// 設定 Google Provider 參數
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
