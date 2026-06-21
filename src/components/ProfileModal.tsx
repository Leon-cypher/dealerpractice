import React, { memo, useCallback, useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import AvatarUpload from './AvatarUpload';
import { cn } from '../utils/cn';

interface ProfileModalProps {
  isOpen: boolean;
  userId: string;
  currentNickname: string | null;
  currentAvatarUrl: string | null;
  isUpdating: boolean;
  onClose: () => void;
  onSave: (nickname: string, avatarUrl: string | null) => Promise<void>;
  onAvatarChange: (url: string) => void;
}

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Ace',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Dealer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Shark',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Chips'
];

export const ProfileModal = memo<ProfileModalProps>(({
  isOpen,
  userId,
  currentNickname,
  currentAvatarUrl,
  isUpdating,
  onClose,
  onSave,
  onAvatarChange
}) => {
  const [nickname, setNickname] = useState(currentNickname || '');

  const handleNicknameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value.replace(/[<>]/g, ''));
  }, []);

  const handleSave = useCallback(async () => {
    await onSave(nickname, currentAvatarUrl);
  }, [nickname, currentAvatarUrl, onSave]);

  const handleClose = useCallback(() => {
    if (currentNickname) {
      onClose();
    }
  }, [currentNickname, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[3000] p-4">
      <div className="bg-slate-900 border-2 border-brand-gold p-8 rounded-[3rem] max-w-md w-full text-center shadow-[0_0_100px_rgba(201,160,80,0.2)] relative">
        {/* 關閉按鈕 - 只有已設定暱稱的使用者才能關閉 */}
        {currentNickname && (
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            title="關閉"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}

        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">
          新荷官入職設定
        </h2>
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-8">
          請設定您的參賽個人資料
        </p>

        {/* 頭像上傳 */}
        <AvatarUpload
          userId={userId}
          currentAvatarUrl={currentAvatarUrl || ''}
          onUploadSuccess={onAvatarChange}
        />

        {/* 預設頭像挑選 */}
        <div className="mt-6">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-3">
            或挑選預設頭像
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {DEFAULT_AVATARS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => onAvatarChange(url)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 overflow-hidden bg-slate-800",
                  currentAvatarUrl === url
                    ? "border-brand-gold ring-2 ring-brand-gold/20"
                    : "border-white/10"
                )}
              >
                <img src={url} alt="" className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        {/* 暱稱輸入 */}
        <div className="mt-8 space-y-6">
          <div className="text-left space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
              荷官暱稱
            </label>
            <input
              type="text"
              placeholder="輸入暱稱 (最多12字)"
              value={nickname}
              maxLength={12}
              onChange={handleNicknameChange}
              className="w-full bg-black border-2 border-white/5 rounded-2xl p-4 text-white text-center font-bold focus:border-brand-gold outline-none transition-all"
            />
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3">
            {currentNickname && (
              <button
                onClick={handleClose}
                className="flex-1 bg-white/10 text-white py-5 rounded-2xl font-bold uppercase hover:bg-white/20 transition-all"
              >
                取消
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isUpdating || !nickname.trim()}
              className={cn(
                "py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 bg-yellow-400 text-slate-900",
                currentNickname ? "flex-1" : "w-full"
              )}
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                currentNickname ? "儲存變更" : "完成入職設定"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileModal.displayName = 'ProfileModal';
