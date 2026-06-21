import { useCallback, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { useAuth } from './useAuth';
import { useModal } from './useModal';
import type { ToastType } from './useToast';

type ShowToast = (message: string, type?: ToastType) => void;

export function useGameAuth(showToast: ShowToast) {
  const { user, profile, loading, setProfile } = useAuth();
  const inAppBrowserWarning = useModal(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const isInAppBrowser = useCallback(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ['line', 'fbav', 'fban', 'instagram', 'twitter', 'micromessenger', 'whatsapp']
      .some(k => ua.includes(k));
  }, []);

  const isSafariOrPrivateBrowser = useCallback(() => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fxios') && !ua.includes('edgios')) ||
      ua.includes('firefox') ||
      ua.includes('fxios') ||
      !!(navigator as any).brave
    );
  }, []);

  // Handle redirect login result on mount
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      if (error.code !== 'auth/no-redirect-operation' && !error.message?.includes('no redirect operation')) {
        showToast(`登入過程發生錯誤 (${error.code})，請重試。`, 'error');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    if (isInAppBrowser()) {
      inAppBrowserWarning.open();
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      const shouldFallback =
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/internal-error' ||
        error.message?.includes('storage') ||
        isSafariOrPrivateBrowser();
      if (shouldFallback) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch {
          showToast('登入失敗。請使用外部瀏覽器 (Chrome/Safari) 開啟', 'error');
        }
      } else if (error.code !== 'auth/cancelled-popup-request') {
        showToast(`登入發生錯誤：${error.message || '未知錯誤'}`, 'error');
      }
    }
  }, [isInAppBrowser, isSafariOrPrivateBrowser, inAppBrowserWarning, showToast]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const saveProfile = useCallback(async (nickname: string, avatarUrl: string | null) => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        id: user.uid,
        nickname,
        avatar_url: avatarUrl,
        updated_at: serverTimestamp(),
      }, { merge: true });
      setProfile({ nickname, avatar_url: avatarUrl });
    } catch {
      showToast('儲存失敗', 'error');
      throw new Error('save failed');
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [user, setProfile, showToast]);

  const proceedWithInAppLogin = useCallback(async () => {
    inAppBrowserWarning.close();
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch {
      showToast('登入失敗。建議使用外部瀏覽器開啟此網站。', 'error');
    }
  }, [inAppBrowserWarning, showToast]);

  const copyUrlToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('網址已複製！請貼到 Chrome、Safari 或 Edge 開啟。', 'success');
    } catch {
      showToast(`請手動複製網址：${window.location.href}`, 'info');
    }
  }, [showToast]);

  const handleAvatarChange = useCallback((url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  }, [setProfile]);

  // True when user is logged in but hasn't set a nickname yet
  const needsProfileSetup = !!user && !!profile && !profile.nickname;

  return {
    user,
    profile,
    loading,
    isUpdatingProfile,
    needsProfileSetup,
    handleGoogleLogin,
    handleLogout,
    saveProfile,
    handleAvatarChange,
    proceedWithInAppLogin,
    copyUrlToClipboard,
    inAppBrowserWarning,
  };
}
