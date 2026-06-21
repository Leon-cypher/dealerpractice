import { XCircle, AlertCircle, Info } from 'lucide-react';

interface InAppBrowserWarningModalProps {
  isOpen: boolean;
  onCopyUrl: () => void;
  onProceed: () => void;
  onClose: () => void;
}

/**
 * App 內建瀏覽器（LINE / Facebook / IG 等）登入警告 Modal。
 * Google 安全政策不允許在內建瀏覽器登入，引導使用者改用外部瀏覽器。
 * 由 useGameAuth 的 inAppBrowserWarning 狀態驅動。
 */
export function InAppBrowserWarningModal({
  isOpen,
  onCopyUrl,
  onProceed,
  onClose,
}: InAppBrowserWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[4000] p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-red-500 p-6 md:p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_80px_rgba(239,68,68,0.4)] animate-in zoom-in-95 duration-500">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_32px_rgba(239,68,68,0.4)]">
            <XCircle className="w-10 h-10 text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3 drop-shadow-[0_2px_12px_rgba(255,255,255,0.3)]">無法在此環境登入</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            偵測到您正在使用 App 內建瀏覽器（如 LINE、Facebook 等）。
            根據 <span className="text-red-400 font-bold">Google 安全政策</span>，
            此環境不支援 Google 登入。
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm border border-red-500/40 rounded-2xl p-4 mb-4 shadow-inner">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
            <div className="text-xs text-red-200">
              <p className="font-bold mb-1">Google 安全限制：</p>
              <p>為了保護您的帳號安全，Google 不允許在內建瀏覽器中進行登入。這是無法繞過的安全機制。</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-500/40 rounded-2xl p-4 mb-6 text-left shadow-inner">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <div className="text-xs text-blue-200 space-y-2">
              <p className="font-bold">請使用外部瀏覽器開啟：</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-300">
                <li><span className="font-bold">LINE</span>：點選右上角「•••」→「在其他瀏覽器開啟」</li>
                <li><span className="font-bold">Facebook/IG</span>：點選右上角「⋯」→「在瀏覽器開啟」</li>
                <li><span className="font-bold">或直接複製網址</span>：到 Chrome/Safari 開啟</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onCopyUrl}
            className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold shadow-[0_4px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.5)] hover:from-blue-400 hover:to-blue-500 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            複製網址（推薦）
          </button>
          <button
            onClick={onProceed}
            className="w-full bg-gradient-to-br from-slate-700 to-slate-800 text-white py-4 rounded-xl font-bold hover:from-slate-600 hover:to-slate-700 transition-all duration-300 border border-white/10 hover:scale-105"
          >
            仍要嘗試登入
          </button>
          <button
            onClick={onClose}
            className="w-full bg-white/10 backdrop-blur-sm text-white py-4 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/10 hover:scale-105"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
