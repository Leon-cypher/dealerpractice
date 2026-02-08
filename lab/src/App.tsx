import React from 'react';

const LabApp: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col font-sans">
      
      {/* 頂部說明 */}
      <header className="p-4 border-b border-white/10 flex justify-center items-center bg-zinc-950">
        <h1 className="text-xl font-black text-red-500 tracking-tighter">DEALERPRO LAB - RED TABLE TEST</h1>
      </header>

      {/* 主要區域 */}
      <main className="flex-1 flex items-center justify-center bg-zinc-900">
        
        {/* 固定尺寸的亮紅色桌面 */}
        <div 
          className="bg-red-600 border-[15px] border-black shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex items-center justify-center relative"
          style={{ 
            width: '800px', 
            height: '400px', 
            borderRadius: '200px' // 形成橢圓形
          }}
        >
          {/* 中心文字 - 調亮一點確保看得到 */}
          <div className="text-white/20 font-black text-8xl tracking-widest pointer-events-none select-none">
            PRO
          </div>

          {/* 桌面內飾線 */}
          <div 
            className="absolute inset-8 border-4 border-black/20"
            style={{ borderRadius: '160px' }}
          ></div>
        </div>

      </main>

      <footer className="p-4 text-center bg-zinc-950">
        <div className="text-xs text-red-400 font-bold uppercase tracking-widest">
          IF YOU SEE A LARGE RED OVAL, THE RENDER IS WORKING.
        </div>
      </footer>
    </div>
  );
};

export default LabApp;
