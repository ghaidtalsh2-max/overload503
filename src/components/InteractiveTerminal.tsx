import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { sfx } from '../services/audioService';

export interface TerminalLog {
  id: string;
  type: 'cmd' | 'output' | 'error' | 'alert' | 'system';
  text: string;
  timestamp: string;
}

interface InteractiveTerminalProps {
  currentStage: number; // 1, 2, 3, 4
  onInvestigationCommand: (category: string, points: number) => void;
  patchDeployed: boolean;
  onDeployPatch: () => void;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  currentStage,
  onInvestigationCommand,
  patchDeployed,
  onDeployPatch
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'OVERLOAD503 INCIDENT SHELL v2.4 — SECURITY SESSION ESTABLISHED',
      timestamp: '14:02:10'
    },
    {
      id: 'init-2',
      type: 'alert',
      text: 'CRITICAL ALERT: PHP worker process instability detected. Type "help" for investigation commands.',
      timestamp: '14:02:11'
    }
  ]);

  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal on new log
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Stage change terminal notices
  useEffect(() => {
    const time = new Date().toTimeString().split(' ')[0];
    if (currentStage === 1) {
      appendLog('system', 'STAGE 1: Investigating memory limit breach & unhandled fatal crash...', time);
    } else if (currentStage === 2) {
      appendLog('alert', 'STAGE 2: Pointer inspection unlocked. Type "inspect pointer" or "trace free".', time);
    } else if (currentStage === 3) {
      appendLog('system', 'STAGE 3: Patch Lab online. Type "patch check" to examine available update.', time);
    } else if (currentStage === 4) {
      appendLog('system', 'STAGE 4: Final lockdown challenge active. Match CVEs to secure the perimeter.', time);
    }
  }, [currentStage]);

  const appendLog = (type: TerminalLog['type'], text: string, timestamp?: string) => {
    const time = timestamp || new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { id: `log_${Date.now()}_${Math.random()}`, type, text, timestamp: time }]);
  };

  const handleCommandSubmit = (commandToRun?: string) => {
    const cmd = (commandToRun !== undefined ? commandToRun : inputVal).trim();
    if (!cmd) return;

    sfx.keyClick();
    const time = new Date().toTimeString().split(' ')[0];
    appendLog('cmd', `> ${cmd}`, time);

    // Add to history
    setHistory((prev) => [cmd, ...prev.slice(0, 20)]);
    setHistoryIndex(-1);
    setInputVal('');

    const lower = cmd.toLowerCase();

    // Command Dispatcher
    if (lower === 'clear') {
      setLogs([]);
      return;
    }

    if (lower === 'help') {
      sfx.tick();
      appendLog('output', 'Available Commands for Current Stage:');
      appendLog('output', '  status          - Display PHP engine & worker state');
      appendLog('output', '  logs            - View recent web server & PHP-FPM access/error logs');
      appendLog('output', '  inspect memory  - Dump heap allocator statistics & uncleaned frames');
      appendLog('output', '  inspect worker  - Inspect worker process termination signals');
      if (currentStage >= 2) {
        appendLog('output', '  inspect pointer - Trace stale global_backtrace_ptr address');
        appendLog('output', '  trace free      - Trace request memory deallocation sequence');
      }
      if (currentStage >= 3) {
        appendLog('output', '  patch check     - View vendor CVE advisory & fixed PHP version');
        appendLog('output', '  patch deploy    - Deploy vendor security update to Zend allocator');
      }
      appendLog('output', '  clear           - Clear terminal window');
      onInvestigationCommand('help', 10);
      return;
    }

    if (lower === 'status') {
      sfx.tick();
      appendLog('output', '[SERVER STATUS]');
      appendLog('output', '  Hostname: srv-web-prod-04.dc.internal');
      appendLog('output', '  Runtime:  PHP 8.3.4 (CLI/FPM) [VULNERABLE ENGINE DETECTED]');
      appendLog('output', '  Workers:  8 Active, 3 Unresponsive, 1 Exited Signal 9');
      appendLog('output', '  Memory:   128MB Limit Reached | Allocator: Zend MM (Heap Corrupted)');
      onInvestigationCommand('status', 10);
      return;
    }

    if (lower === 'logs') {
      sfx.tick();
      appendLog('output', '[SIMULATED /var/log/php-fpm.log]');
      appendLog('output', '  14:02:11 POST /upload (multipart 128MB) HTTP/1.1 200');
      appendLog('error',  '  14:02:12 FATAL: Allowed memory size of 134217728 bytes exhausted');
      appendLog('alert',  '  14:02:12 WARN: Emergency bail-out triggered; global_backtrace_ptr NOT cleared');
      appendLog('output', '  14:02:13 GET /index.php 500 Internal Server Error');
      appendLog('error',  '  14:02:13 PHPSESSID: Stale pointer 0x7f3a points to freed request buffer!');
      appendLog('alert',  '  14:02:14 CRITICAL: CVE-2026-109618 & CVE-2026-109619 condition met');
      onInvestigationCommand('logs', 15);
      return;
    }

    if (lower === 'inspect memory') {
      sfx.tick();
      appendLog('output', '[HEAP MEMORY AUDIT]');
      appendLog('output', '  Zend Allocator chunk size: 2MB');
      appendLog('output', '  Active chunk: 0x7f3a0000 - 0x7f3a2000');
      appendLog('error',  '  Block 0x7f3a: Status = FREED (Previously allocated for stacktrace)');
      appendLog('alert',  '  Reference Count: 0 | Global pointers referencing this block: 1 (global_backtrace_ptr)');
      appendLog('output', '  Vulnerability: Stale pointer left un-zeroed during unexpected OOM termination!');
      onInvestigationCommand('inspect_memory', 15);
      return;
    }

    if (lower === 'inspect worker') {
      sfx.tick();
      appendLog('output', '[WORKER PROCESS AUDIT]');
      appendLog('output', '  Worker PID: 3418 | User: www-data | Status: ZOMBIE/UNSTABLE');
      appendLog('output', '  Last Signal: SIGSEGV (11) on memory dereference 0x7f3a');
      appendLog('output', '  Core Dump: Suppressed by system settings');
      appendLog('error',  '  Conclusion: Restarting worker alone will NOT prevent subsequent exploit!');
      onInvestigationCommand('inspect_worker', 15);
      return;
    }

    if (lower === 'inspect pointer' && currentStage >= 2) {
      sfx.tick();
      appendLog('output', '[POINTER ANALYSIS: CVE-2026-109619]');
      appendLog('alert',  '  global_backtrace_ptr address = 0x7f3a');
      appendLog('output', '  State: DANGLING POINTER. The underlying Zend memory block has been returned.');
      appendLog('output', '  Risk: When a new incoming HTTP request reuses block 0x7f3a, attacker-controlled data');
      appendLog('output', '  is interpreted as internal backtrace frames -> Remote Code Execution (RCE)!');
      onInvestigationCommand('inspect_pointer', 20);
      return;
    }

    if (lower === 'trace free' && currentStage >= 2) {
      sfx.tick();
      appendLog('output', '[DEALLOCATION TRACE]');
      appendLog('output', '  1. Request #1 hits OOM in multipart parser.');
      appendLog('output', '  2. zend_bailout() abruptly halts execution.');
      appendLog('output', '  3. Request memory pool is swept and freed.');
      appendLog('error',  '  4. BUG: Cleanup handler fails to set global_backtrace_ptr = NULL!');
      onInvestigationCommand('trace_free', 20);
      return;
    }

    if (lower === 'patch check' && currentStage >= 3) {
      sfx.tick();
      appendLog('output', '[SECURITY ADVISORY CHECK]');
      appendLog('output', '  CVE-2026-109618: Fixed in PHP 8.3.6 (Sanitizes multipart OOM cleanup)');
      appendLog('output', '  CVE-2026-109619: Fixed in PHP 8.3.6 (Explicitly zeroes global backtrace state on bailout)');
      appendLog('output', '  Available Update: PHP 8.3.6 Security Release package ready for deployment.');
      onInvestigationCommand('patch_check', 20);
      return;
    }

    if (lower === 'patch deploy' && currentStage >= 3) {
      if (patchDeployed) {
        appendLog('output', 'Patch is already deployed and verified.');
        return;
      }
      sfx.unlock();
      appendLog('system', '[SIMULATION] Identifying PHP runtime...');
      setTimeout(() => appendLog('system', '[SIMULATION] Checking installed version... (PHP 8.3.4 detected)'), 300);
      setTimeout(() => appendLog('system', '[SIMULATION] Security update available: PHP 8.3.6-security-patch'), 600);
      setTimeout(() => appendLog('system', '[SIMULATION] Deploying approved vendor patch...'), 900);
      setTimeout(() => appendLog('system', '[SIMULATION] Verifying runtime version... (PHP 8.3.6 verified)'), 1200);
      setTimeout(() => {
        appendLog('output', '[SIMULATION] Reviewing application logs... All memory allocations clean.');
        appendLog('output', '[VERIFIED] Memory allocator sanitized. Stale pointers properly zeroed.');
        sfx.chime();
        onDeployPatch();
      }, 1500);
      return;
    }

    // Unknown command
    sfx.error();
    appendLog('error', `bash: ${cmd}: command not recognized. Type "help" for a list of available investigation tools.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  // Quick command suggestions based on stage
  const getSuggestions = () => {
    const base = ['help', 'logs', 'status', 'inspect memory', 'inspect worker'];
    if (currentStage >= 2) base.push('inspect pointer', 'trace free');
    if (currentStage >= 3) base.push('patch check', 'patch deploy');
    return base;
  };

  return (
    <div className="pn flex flex-col h-full rounded-2xl overflow-hidden border border-[#4285F4]/40 bg-[#070d1f]/95 shadow-[0_0_25px_rgba(66,133,244,0.15)] font-mono text-xs">
      
      {/* Terminal Title Bar */}
      <div className="px-3 py-2 bg-[#0a1228] border-b border-[#4285F4]/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#34A853]" />
          <span className="font-bold text-[#8fa6d6] tracking-wide text-[11px] ltr">
            TERMINAL · /var/log/php-fpm
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]/70" />
        </div>
      </div>

      {/* Output Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 ltr text-left min-h-[180px] max-h-[340px]">
        {logs.map((log) => {
          let color = 'text-slate-300';
          if (log.type === 'cmd') color = 'text-[#8ab4ff] font-bold';
          if (log.type === 'error') color = 'text-[#ff8a80] font-semibold';
          if (log.type === 'alert') color = 'text-[#FBBC05] font-semibold';
          if (log.type === 'system') color = 'text-[#7ee2a0]';

          return (
            <div key={log.id} className="leading-relaxed break-all">
              <span className="text-slate-500 mr-2 select-none text-[10px]">[{log.timestamp}]</span>
              <span className={color}>{log.text}</span>
            </div>
          );
        })}
        <div ref={outputEndRef} />
      </div>

      {/* Mobile Quick-Tap Suggestion Chips */}
      <div className="px-2.5 py-1.5 bg-[#050914] border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] text-slate-500 shrink-0 font-bold">CHIPS:</span>
        {getSuggestions().map((s) => (
          <button
            key={s}
            onClick={() => handleCommandSubmit(s)}
            className="px-2 py-0.5 rounded-md bg-[#0a1838] border border-[#4285F4]/40 text-[#8ab4ff] hover:bg-[#4285F4] hover:text-white transition-all text-[10px] whitespace-nowrap active:scale-95 cursor-pointer shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Prompt */}
      <div className="p-2 bg-[#091124] border-t border-[#4285F4]/30 flex items-center gap-2 shrink-0 ltr">
        <span className="text-[#34A853] font-bold">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type command (e.g. logs, inspect memory, help)..."
          className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-slate-500"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        <button
          onClick={() => handleCommandSubmit()}
          className="p-1.5 rounded-lg bg-[#4285F4]/20 hover:bg-[#4285F4] text-[#8ab4ff] hover:text-white transition cursor-pointer"
          title="Send Command"
        >
          <Send size={12} />
        </button>
      </div>

    </div>
  );
};
