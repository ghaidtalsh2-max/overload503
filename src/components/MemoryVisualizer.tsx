import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { sfx } from '../services/audioService';

interface MemoryVisualizerProps {
  pointerCleared: boolean;
  onClearPointer: () => void;
  stage: number;
}

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({
  pointerCleared,
  onClearPointer,
  stage
}) => {
  const [justCleared, setJustCleared] = useState(false);

  const handleClear = () => {
    if (pointerCleared) return;
    sfx.unlock();
    setJustCleared(true);
    onClearPointer();
    setTimeout(() => setJustCleared(false), 2000);
  };

  return (
    <div className="pn p-3 sm:p-4 rounded-2xl border border-[#EA4335]/60 bg-[#070d1f]/95 shadow-[0_0_25px_rgba(234,67,53,0.15)] flex flex-col gap-3 font-cairo">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="mono font-bold text-xs sm:text-sm tracking-wide text-white ltr">
          PHP ENGINE · HEAP MEMORY <span className="text-[#ff8a80]">· USE-AFTER-FREE (CVE-2026-109619)</span>
        </div>
        <div className="mono blink text-[11px] font-bold text-[#FBBC05] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
          <span>LIVE MEMORY AUDIT</span>
        </div>
      </div>

      {/* SVG Diagram: Pointer and Request colliding on freed block */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#040817] p-2 border border-slate-800">
        <svg
          width="100%"
          height="120"
          viewBox="0 0 600 120"
          aria-label="المؤشر القديم وطلب جديد يشيران إلى نفس الكتلة المحررة"
          role="img"
          className="overflow-visible"
        >
          {/* Stale Pointer Box */}
          <rect
            x="10"
            y="6"
            width="210"
            height="40"
            rx="10"
            fill={pointerCleared ? '#0a2214' : '#2a0d12'}
            stroke={pointerCleared ? '#34A853' : '#EA4335'}
            strokeWidth="2"
          />
          <text
            x="115"
            y="23"
            textAnchor="middle"
            fill={pointerCleared ? '#7ee2a0' : '#ff8a80'}
            fontSize="12"
            fontWeight="800"
            fontFamily="JetBrains Mono"
          >
            global_backtrace_ptr
          </text>
          <text
            x="115"
            y="39"
            textAnchor="middle"
            fill={pointerCleared ? '#a3e8bc' : '#ffb3ab'}
            fontSize="11"
            fontFamily="JetBrains Mono"
          >
            {pointerCleared ? '= NULL (CLEARED/SAFE)' : '= 0x7f3a (STALE/DANGLING)'}
          </text>

          {/* New Request Box */}
          <rect
            x="380"
            y="6"
            width="210"
            height="40"
            rx="10"
            fill="#2b2406"
            stroke="#FBBC05"
            strokeWidth="2"
          />
          <text
            x="485"
            y="23"
            textAnchor="middle"
            fill="#FBBC05"
            fontSize="12"
            fontWeight="800"
            fontFamily="JetBrains Mono"
          >
            NEW REQUEST #2
          </text>
          <text
            x="485"
            y="39"
            textAnchor="middle"
            fill="#ffe08a"
            fontSize="11"
            fontFamily="JetBrains Mono"
          >
            reuses the freed block
          </text>

          {/* Dashed Connecting Lines (Severed if pointerCleared) */}
          {!pointerCleared && (
            <path
              className="dash"
              d="M115 46 C115 85 240 75 300 114"
              fill="none"
              stroke="#EA4335"
              strokeWidth="3"
            />
          )}
          <path
            className="dash"
            d="M485 46 C485 85 360 75 300 114"
            fill="none"
            stroke="#FBBC05"
            strokeWidth="3"
          />
          <polygon points="295,106 300,118 305,106" fill="#fff" />
        </svg>

        {/* Memory Grid (Exact Reference HTML classes: mc m e x) */}
        <div className="grid grid-cols-12 gap-1.5 mt-1">
          <div className="mc m">a1</div>
          <div className="mc m">b7</div>
          <div className="mc e"></div>
          <div className="mc m">c2</div>
          <div className="mc m">9e</div>
          <div className="mc m">d4</div>
          <div className={`mc ${pointerCleared ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'x'}`}>
            {pointerCleared ? 'CLEARED' : 'FREED'}
          </div>
          <div className="mc m">f0</div>
          <div className="mc e"></div>
          <div className="mc m">3c</div>
          <div className="mc m">e8</div>
          <div className="mc e"></div>
        </div>

        <div className="mono text-center text-xs font-bold mt-2 ltr">
          {pointerCleared ? (
            <span className="text-[#7ee2a0]">▲ 0x7f3a · Pointer zeroed! Memory collision prevented.</span>
          ) : (
            <span className="text-[#ff8a80]">▲ 0x7f3a · PHP still trusts this address (Use-After-Free)</span>
          )}
        </div>
      </div>

      {/* 3 Core Educational Concept Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-right">
        <div className="rounded-xl p-2.5 bg-[#2a0d12]/70 border border-[#EA4335]/60">
          <div className="mono text-xs font-bold text-[#ff8a80] ltr text-right">
            1 · OOM FATAL ERROR
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-1 leading-snug">
            الذاكرة نفدت وانهار الطلب فجأة دون إكمال تنظيف المؤشرات الداخلية.
          </p>
        </div>

        <div className="rounded-xl p-2.5 bg-[#2b2406]/70 border border-[#FBBC05]/60">
          <div className="mono text-xs font-bold text-[#FBBC05] ltr text-right">
            2 · STALE POINTER
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-1 leading-snug">
            بقي مؤشر عام يشير لكتلة تم تحريرها وإعادتها لمجمع الذاكرة.
          </p>
        </div>

        <div className="rounded-xl p-2.5 bg-[#0d1d44]/70 border border-[#4285F4]/60">
          <div className="mono text-xs font-bold text-[#8ab4ff] ltr text-right">
            3 · REUSE → TRUST
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-1 leading-snug">
            طلب جديد يشغل المكان ذاته والمحرك يثق بالمؤشر القديم (RCE).
          </p>
        </div>
      </div>

      {/* Interactive Defensive Action Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleClear}
          disabled={pointerCleared}
          className={`flex-1 min-h-[48px] rounded-xl font-mono font-black text-sm sm:text-base tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            pointerCleared
              ? 'bg-emerald-900/60 border border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(52,168,83,0.3)]'
              : 'bg-gradient-to-r from-[#EA4335] to-[#c5221f] text-white shadow-[0_0_25px_rgba(234,67,53,0.6)] active:scale-95 hover:brightness-110 animate-pulse'
          }`}
        >
          {pointerCleared ? (
            <>
              <CheckCircle size={18} />
              <span>POINTER CLEARED (SAFE)</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>CLEAR THE POINTER (SET NULL)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
