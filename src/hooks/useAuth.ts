import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  nickname: string;
  avatar_url: string | null;
}

/**
 * 認證與用戶資料管理 Hook
 * 統一處理 Firebase Auth 和 Firestore Profile
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // 獲取用戶資料
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // 如果沒有資料，使用預設值
            setProfile({
              nickname: firebaseUser.displayName || '匿名玩家',
              avatar_url: firebaseUser.photoURL
            });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setProfile({
            nickname: firebaseUser.displayName || '匿名玩家',
            avatar_url: firebaseUser.photoURL
          });
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    profile,
    loading,
    setProfile
  };
}
