// src/engine/terminalEngine.ts
// Deterministic terminal simulation engine for OVERLOAD503
// Implements realistic fake in-memory server state, commands, traps, educational debriefs, and scoring.

export interface TerminalOutputLine {
  id: string;
  type: 'cmd' | 'ok' | 'warn' | 'err' | 'dim' | 'tip';
  text: string;
  timestamp?: number;
}

export interface OPcacheBox {
  id: string;
  label: string;
  content: string;
  mismatched: boolean;
  flagged: boolean;
}

export interface SessionItem {
  id: string;
  prefix: string;
  value: string;
  leaked: boolean;
  rotated: boolean;
}

export interface FallingRequest {
  id: string;
  lane: number; // 0, 1, 2
  method: 'POST' | 'GET';
  path: string;
  tag: string;
  isMalicious: boolean;
  blocked: boolean;
  missed: boolean;
}

export interface TerminalState {
  phpVersion: string;
  wordpressVersion: string;
  uploadProgressEnabled: boolean;
  workersHealthy: number;
  workersCrashed: number;
  crashedWorkerPid: number;
  workerKilled: boolean;
  heapPressure: number; // 0 - 100
  exposure: number;     // 0 - 100
  availability: number; // 0 - 100
  integrity: number;    // 0 - 100
  evidencePreserved: boolean;
  patchApplied: boolean;
  servicesRestarted: boolean;
  stalePointerCleared: boolean;
  attackerBlocked: boolean;
  verified: boolean;
  
  // Authentication
  login: boolean;
  tempPassword: string;
  passwordAttempts: number;
  lockoutUntil: number;
  passwordMode: 'login' | 'sudo' | null;

  // Station specific states
  activeDoorCode: string;
  doorUnlocked: boolean;
  freezeActive: boolean;
  freezeExpiresAt: number;

  opcacheBoxes: OPcacheBox[];
  sessions: SessionItem[];
  fallingRequests: FallingRequest[];

  // Scoring & Stats
  score: number;
  combo: number;
  highestCombo: number;
  hintsUsed: number;
  accuracyStats: {
    correctInputs: number;
    wrongInputs: number;
  };
  badgesEarned: Set<string>;
}

export const KNOWN_COMMANDS = [
  'help',
  'hint',
  'clear',
  'cls',
  'status',
  'ssh soc@prod-04',
  'tail -f /var/log/php-fpm.log',
  'logs',
  'ss',
  'iptables -A INPUT -s 203.0.113.77 -j DROP',
  'top',
  'kill -9 4821',
  'heap',
  'inspect memory',
  'clear 0x7f3a',
  'free 0x7f3a',
  'zero 0x7f3a',
  'freeze',
  'php -v',
  'backup logs',
  'update wordpress',
  'disable upload_progress',
  'restart php-fpm',
  'sudo apt install php8.4=8.4.27',
  'update php 8.4.27',
  'sudo systemctl restart php-fpm',
  'verify',
  'rotate',
  'flag'
];

export function createInitialTerminalState(): TerminalState {
  return {
    phpVersion: '8.4.24', // Vulnerable version
    wordpressVersion: '6.8.2',
    uploadProgressEnabled: true,
    workersHealthy: 2,
    workersCrashed: 3,
    crashedWorkerPid: 4821,
    workerKilled: false,
    heapPressure: 78,
    exposure: 62,
    availability: 78,
    integrity: 95,
    evidencePreserved: false,
    patchApplied: false,
    servicesRestarted: false,
    stalePointerCleared: false,
    attackerBlocked: false,
    verified: false,

    login: false,
    tempPassword: 'Ov3r-503',
    passwordAttempts: 0,
    lockoutUntil: 0,
    passwordMode: null,

    activeDoorCode: '5037',
    doorUnlocked: false,
    freezeActive: false,
    freezeExpiresAt: 0,

    opcacheBoxes: [
      { id: 'box-10', label: 'scripts', content: 'scripts', mismatched: false, flagged: false },
      { id: 'box-11', label: 'cached_ast', content: 'cached_ast', mismatched: false, flagged: false },
      { id: 'box-12', label: 'papers', content: 'sharp_object', mismatched: true, flagged: false },
      { id: 'box-13', label: 'user_tokens', content: 'user_tokens', mismatched: false, flagged: false },
      { id: 'box-14', label: 'classes', content: 'corrupted_zval', mismatched: true, flagged: false },
    ],

    sessions: [
      { id: 's1', prefix: '7f3a', value: '7f3a9c1e5b02d4a87e6f10c3b9a2d1e0', leaked: true, rotated: false },
      { id: 's2', prefix: 'a1b2', value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', leaked: false, rotated: false },
      { id: 's3', prefix: 'c4e9', value: 'c4e9081a2f3b4c5d6e7f8a9b0c1d2e3f', leaked: true, rotated: false },
      { id: 's4', prefix: '88fa', value: '88fa9102bc45de67fa890123456789ab', leaked: false, rotated: false },
    ],

    fallingRequests: [
      { id: 'req-4821', lane: 0, method: 'POST', path: '/upload multipart', tag: 'req-4821', isMalicious: true, blocked: false, missed: false },
      { id: 'req-4822', lane: 1, method: 'GET', path: '/api 500 x3', tag: 'req-4822', isMalicious: true, blocked: false, missed: false },
      { id: 'req-4823', lane: 0, method: 'POST', path: '/upload multipart', tag: 'req-4823', isMalicious: true, blocked: false, missed: false },
      { id: 'req-4824', lane: 1, method: 'GET', path: 'PHPSESSID oversized', tag: 'req-4824', isMalicious: true, blocked: false, missed: false },
      { id: 'req-4825', lane: 1, method: 'POST', path: '/upload multipart', tag: 'req-4825', isMalicious: true, blocked: false, missed: false },
      { id: 'req-4826', lane: 2, method: 'POST', path: '/upload multipart', tag: 'req-4826', isMalicious: true, blocked: false, missed: false },
      { id: 'req-4827', lane: 2, method: 'GET', path: '/api 500 x2', tag: 'req-4827', isMalicious: true, blocked: false, missed: false },
    ],

    score: 0,
    combo: 1,
    highestCombo: 1,
    hintsUsed: 0,
    accuracyStats: {
      correctInputs: 0,
      wrongInputs: 0,
    },
    badgesEarned: new Set<string>(),
  };
}

export function findClosestCommand(input: string): string | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;
  const verb = clean.split(' ')[0];
  const match = KNOWN_COMMANDS.find((cmd) => cmd.startsWith(verb) || cmd.startsWith(clean));
  return match || null;
}

export interface ExecuteResult {
  nextState: TerminalState;
  lines: TerminalOutputLine[];
  sfxTrigger?: 'tick' | 'error' | 'unlock' | 'warn' | 'glitch' | 'whoosh' | 'overload' | 'chime' | 'powerup' | 'keyClick';
  shake?: boolean;
}

export function executeCommand(
  rawInput: string,
  state: TerminalState,
  currentStation: number
): ExecuteResult {
  const lines: TerminalOutputLine[] = [];
  const next: TerminalState = {
    ...state,
    accuracyStats: { ...state.accuracyStats },
    badgesEarned: new Set(state.badgesEarned)
  };
  const trimmed = rawInput.trim();
  const lower = trimmed.toLowerCase();

  // Helper to append line
  const add = (text: string, type: 'cmd' | 'ok' | 'warn' | 'err' | 'dim' | 'tip' = 'dim') => {
    lines.push({ id: `line_${Date.now()}_${Math.random()}`, text, type, timestamp: Date.now() });
  };

  // Check lockout
  if (next.lockoutUntil > Date.now()) {
    const secs = Math.ceil((next.lockoutUntil - Date.now()) / 1000);
    add(`Account temporarily locked out due to multiple failed attempts. Retry in ${secs}s.`, 'err');
    return { nextState: next, lines, sfxTrigger: 'error' };
  }

  // PASSWORD HANDLING MODE (MASKED)
  if (next.passwordMode !== null) {
    add('••••••••', 'dim');
    if (trimmed === next.tempPassword) {
      if (next.passwordMode === 'login') {
        next.login = true;
        next.passwordMode = null;
        next.passwordAttempts = 0;
        next.score += 50;
        next.accuracyStats.correctInputs++;
        add('ACCESS GRANTED: soc@prod-04', 'ok');
        add('Last login: Tue 14:02 from 10.0.0.12', 'dim');
        add('ALERT: 3 php-fpm workers unresponsive due to out-of-memory crash.', 'warn');
        add('كلمة المرور المؤقتة من التذكرة صالحة لجلسة واحدة فقط: تابع فحص السجلات.', 'tip');
        return { nextState: next, lines, sfxTrigger: 'unlock' };
      } else if (next.passwordMode === 'sudo') {
        next.passwordMode = null;
        next.patchApplied = true;
        next.phpVersion = '8.4.27';
        next.exposure = Math.max(0, next.exposure - 28);
        next.availability = Math.min(100, next.availability + 15);
        next.score += 250;
        next.accuracyStats.correctInputs++;
        next.badgesEarned.add('PATCH_MASTER');
        add('Reading package lists... Done', 'dim');
        add('Building dependency tree... Done', 'dim');
        add('Upgrading: php8.4 (8.4.24 -> 8.4.27 security patch)', 'ok');
        add('[####------] 40%', 'warn');
        add('[########--] 80%', 'warn');
        add('[##########] 100%', 'ok');
        add('php8.4 8.4.27 installed successfully. Restart required to apply changes to Zend Engine.', 'ok');
        add('ترقية PHP نفسها هي الحل الجذري: الخلل تم إصلاحه في مجمع الذاكرة الداخلي (Zend Allocator).', 'tip');
        return { nextState: next, lines, sfxTrigger: 'unlock' };
      }
    } else {
      next.passwordAttempts++;
      next.score = Math.max(0, next.score - 15);
      next.accuracyStats.wrongInputs++;
      if (next.passwordAttempts >= 3) {
        next.lockoutUntil = Date.now() + 10000;
        add('Permission denied. 3 failed attempts: Terminal locked for 10 seconds.', 'err');
      } else {
        add(`Permission denied, please try again. (${3 - next.passwordAttempts} attempts remaining)`, 'err');
      }
      return { nextState: next, lines, sfxTrigger: 'error', shake: true };
    }
  }

  // Normal Command Echo
  add(`soc@prod-04:~$ ${trimmed}`, 'cmd');

  if (lower === 'clear' || lower === 'cls') {
    return { nextState: next, lines: [], sfxTrigger: 'keyClick' };
  }

  if (lower === 'help') {
    add('AVAILABLE INVESTIGATION & REMEDIATION COMMANDS:', 'dim');
    add('  ssh soc@prod-04              - Authenticate to incident console', 'dim');
    add('  logs / tail -f php-fpm.log   - Stream real-time server and fatal logs', 'dim');
    add('  ss                           - Inspect active network connections by IP', 'dim');
    add('  iptables -A ... -j DROP      - Firewall drop rule for malicious source IP', 'dim');
    add('  top / kill -9 <pid>          - Monitor and terminate crashed workers', 'dim');
    add('  heap / inspect memory        - Audit heap memory blocks and stale pointers', 'dim');
    add('  clear 0x7f3a                 - Zero out dangling global pointer', 'dim');
    add('  freeze                       - 3-second freeze power-up', 'dim');
    add('  php -v                       - Check installed runtime version', 'dim');
    add('  backup logs                  - Preserve evidence before running commands', 'dim');
    add('  update wordpress             - Upgrade web application CMS', 'dim');
    add('  disable upload_progress      - Disable PHP session upload progress', 'dim');
    add('  sudo apt install php8.4=8.4.27 - Deploy official security patch', 'dim');
    add('  sudo systemctl restart php-fpm - Reload engine with patched runtime', 'dim');
    add('  verify                       - Validate incident containment checklist', 'dim');
    return { nextState: next, lines, sfxTrigger: 'keyClick' };
  }

  if (lower === 'hint') {
    next.hintsUsed++;
    next.score = Math.max(0, next.score - 10);
    let hintText = 'افحص السجلات باستخدام logs للتعرف على مصدر الهجوم ورمز العامل المنهار.';
    if (!next.login) hintText = 'افتح جلسة عبر ssh soc@prod-04 واستخدم كلمة المرور المؤقتة من التذكرة.';
    else if (!next.attackerBlocked) hintText = 'استخدم ss لمعرفة عنوان المهاجم ثم احجبه بقاعدة iptables.';
    else if (!next.stalePointerCleared) hintText = 'افحص الذاكرة عبر heap وصفّر المؤشر المعلق عبر clear 0x7f3a.';
    else if (!next.patchApplied) hintText = 'تحديث ووردبريس فخ! الحل الجذري هو ترقية PHP إلى 8.4.27.';
    else if (!next.servicesRestarted) hintText = 'أعد تشغيل الخدمة عبر sudo systemctl restart php-fpm.';
    else hintText = 'اكتب verify للتحقق من سلامة كافة الضوابط وإنهاء الحادث.';
    add(`تلميح أمني (-10 نقاط): ${hintText}`, 'tip');
    return { nextState: next, lines, sfxTrigger: 'warn' };
  }

  // SSH LOGIN TRIGGER
  if (lower.startsWith('ssh')) {
    if (next.login) {
      add('Already authenticated as soc@prod-04.', 'dim');
      return { nextState: next, lines, sfxTrigger: 'keyClick' };
    }
    next.passwordMode = 'login';
    add("soc@prod-04's password:", 'warn');
    return { nextState: next, lines, sfxTrigger: 'keyClick' };
  }

  // ENFORCE AUTHENTICATION FOR PRIVILEGED COMMANDS
  if (!next.login) {
    add('bash: permission denied. Authenticate first using "ssh soc@prod-04" with ticket password.', 'err');
    next.score = Math.max(0, next.score - 5);
    next.accuracyStats.wrongInputs++;
    return { nextState: next, lines, sfxTrigger: 'error', shake: true };
  }

  // STATUS COMMAND
  if (lower === 'status') {
    add(`[SYSTEM METRICS] PHP ${next.phpVersion} | Workers: ${next.workersHealthy} healthy, ${next.workersCrashed} failed`, 'dim');
    add(`[SECURITY] Exposure: ${next.exposure}% | Availability: ${next.availability}% | Integrity: ${next.integrity}%`, 'dim');
    add(`[PATCH STATUS] Applied: ${next.patchApplied ? 'YES (8.4.27)' : 'NO (VULNERABLE)'} | Restarted: ${next.servicesRestarted ? 'YES' : 'NO'}`, 'dim');
    return { nextState: next, lines, sfxTrigger: 'keyClick' };
  }

  // LOGS COMMAND
  if (lower === 'logs' || lower.includes('tail')) {
    add('14:02:11 GET /index.php 200 - 14ms', 'dim');
    add('14:02:12 POST /upload multipart 128MB [src=203.0.113.77]', 'warn');
    add('14:02:12 FATAL: Allowed memory size of 134217728 bytes exhausted in zend_alloc.c', 'err');
    add('14:02:13 GET /index.php 500 [Worker PID 4821 crashed with SIGSEGV]', 'err');
    add('14:02:13 Set-Cookie: PHPSESSID=7f3a9c1e... (oversized: 4096 bytes leaked heap dump)', 'err');
    add('14:02:14 WARN: Stale pointer global_backtrace_ptr = 0x7f3a left pointing to FREED block!', 'warn');
    add('14:02:14 POST /upload multipart 128MB [src=203.0.113.77 attack wave continuing]', 'warn');
    add('رفع ضخم يستنزف الذاكرة حتى ينهار الطلب قبل التنظيف، وكوكي PHPSESSID الضخم يسرّب ذاكرة المجمع (CVE-2026-109618).', 'tip');
    next.score += 25;
    next.accuracyStats.correctInputs++;
    return { nextState: next, lines, sfxTrigger: 'tick' };
  }

  // SS COMMAND
  if (lower === 'ss' || lower.includes('netstat')) {
    add('State      Recv-Q Send-Q  Local Address:Port   Peer Address:Port', 'dim');
    add('ESTAB      0      0       10.0.0.12:443        203.0.113.77:51422  (x42 connections)', 'warn');
    add('ESTAB      0      0       10.0.0.12:443        198.51.100.9:40110  (x2 connections)', 'dim');
    add('معظم الاتصالات الاستنزافية تأتي من عنوان واحد (203.0.113.77): هذا هو مصدر الهجوم.', 'tip');
    next.score += 20;
    next.accuracyStats.correctInputs++;
    return { nextState: next, lines, sfxTrigger: 'tick' };
  }

  // IPTABLES BLOCK
  if (lower.startsWith('iptables')) {
    if (lower.includes('203.0.113.77') && (lower.includes('drop') || lower.includes('reject'))) {
      next.attackerBlocked = true;
      next.exposure = Math.max(0, next.exposure - 22);
      next.score += 100;
      next.accuracyStats.correctInputs++;
      add('Rule applied: iptables -A INPUT -s 203.0.113.77 -j DROP [ATTACKER ISOLATED]', 'ok');
      add('حجب المهاجم يخفف الضغط المباشر، لكن الثغرة ما زالت قائمة داخل مجمع الذاكرة للطلبات الداخلية.', 'tip');
      return { nextState: next, lines, sfxTrigger: 'tick' };
    } else {
      add('Firewall rule added, but target IP does not match malicious source 203.0.113.77.', 'warn');
      next.score = Math.max(0, next.score - 10);
      next.accuracyStats.wrongInputs++;
      return { nextState: next, lines, sfxTrigger: 'error' };
    }
  }

  // TOP / PROCESSES
  if (lower === 'top' || lower === 'ps') {
    add('PID    USER   PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND', 'dim');
    add('4817   www    20   0  245.2m  45.1m  12.0m S   0.0   2.3   0:01.12 php-fpm: pool www', 'dim');
    add('4819   www    20   0  248.0m  46.4m  12.1m S   1.2   2.4   0:01.30 php-fpm: pool www', 'dim');
    add('4821   www    20   0  512.8m 134.2m   4.2m D  98.4   8.9   0:04.88 php-fpm: CRASHING [SIGSEGV]', 'err');
    add('العامل 4821 يستهلك الذاكرة وانهار بسبب نفاذ الذاكرة: يمكن إنهاؤه عبر kill -9 4821.', 'tip');
    return { nextState: next, lines, sfxTrigger: 'keyClick' };
  }

  // KILL CRASHED WORKER
  if (lower === 'kill -9 4821' || lower === 'kill 4821') {
    next.workerKilled = true;
    next.workersCrashed = Math.max(0, next.workersCrashed - 1);
    next.workersHealthy = Math.min(5, next.workersHealthy + 1);
    next.availability = Math.min(100, next.availability + 8);
    next.score += 50;
    next.accuracyStats.correctInputs++;
    add('Worker process 4821 terminated with SIGKILL. Master respawned fresh worker.', 'ok');
    add('إنهاء العامل يحرر العملية لكنه قد يترك مؤشرات معلقة في الذاكرة المشتركة إذا لم يتم تصفيرها.', 'tip');
    return { nextState: next, lines, sfxTrigger: 'tick' };
  }

  // HEAP / INSPECT MEMORY
  if (lower === 'heap' || lower === 'inspect memory' || lower === 'inspect pointer') {
    add('[ZEND HEAP AUDITOR] Chunk base: 0x7f3a0000 | Total size: 2MB', 'dim');
    add('  Block 0x7f39 [ALLOCATED] Request #1 session data', 'dim');
    add('  Block 0x7f3a [FREED]     <-- CRITICAL: global_backtrace_ptr STILL POINTS HERE (STALE)', 'err');
    add('  Block 0x7f3b [ALLOCATED] Request #2 buffer', 'dim');
    add('المؤشر global_backtrace_ptr ما زال يشير إلى 0x7f3a المحررة: لو سكنه طلب جديد ستثق به PHP (Use-After-Free CVE-2026-109619). صفّره عبر clear 0x7f3a.', 'tip');
    next.score += 30;
    next.accuracyStats.correctInputs++;
    return { nextState: next, lines, sfxTrigger: 'tick' };
  }

  // CLEAR 0x7f3a / FREE / ZERO
  if (lower === 'clear 0x7f3a' || lower === 'free 0x7f3a' || lower === 'zero 0x7f3a' || lower === 'clear pointer') {
    next.stalePointerCleared = true;
    next.exposure = Math.max(0, next.exposure - 18);
    next.score += 150;
    next.accuracyStats.correctInputs++;
    next.badgesEarned.add('POINTER_CUTTER');
    add('global_backtrace_ptr set to NULL (0x0). Dangling pointer safely severed.', 'ok');
    add('تصفير المؤشر يمنع استغلال الذاكرة مؤقتاً، لكن الثغرة ما زالت قائمة في محرك PHP عند أي انهيار OOM قادم.', 'tip');
    return { nextState: next, lines, sfxTrigger: 'unlock' };
  }

  // FREEZE POWERUP
  if (lower === 'freeze') {
    next.freezeActive = true;
    next.freezeExpiresAt = Date.now() + 3000;
    add('FREEZE ACTIVATED: Time stopped for 3 seconds!', 'ok');
    return { nextState: next, lines, sfxTrigger: 'powerup' };
  }

  // PHP -V
  if (lower === 'php -v' || lower === 'php --version') {
    if (next.patchApplied) {
      add('PHP 8.4.27 (cli) (built: Oct 2026) ( NTS )', 'ok');
      add('Zend Engine v4.4.27 with Zend OPcache, Copyright (c) Zend Technologies', 'ok');
      add('Status: PATCHED (Memory allocator bounds-checked and stale pointer cleanup verified)', 'ok');
    } else {
      add('PHP 8.4.24 (cli) (built: Aug 2026) ( NTS )', 'err');
      add('Status: VULNERABLE to CVE-2026-109618 (OOM corrupt) & CVE-2026-109619 (UAF backtrace)', 'err');
    }
    return { nextState: next, lines, sfxTrigger: 'keyClick' };
  }

  // BACKUP LOGS
  if (lower === 'backup logs' || lower === 'tar -czf logs.tar.gz /var/log') {
    next.evidencePreserved = true;
    next.score += 100;
    next.accuracyStats.correctInputs++;
    next.badgesEarned.add('EVIDENCE_KEEPER');
    add('Backing up /var/log/php-fpm to /secure/evidence_20261028.tar.gz... [DONE]', 'ok');
    add('حفظ الأدلة الجنائية خطوة حاسمة في الاستجابة للحوادث تضمن عدم ضياع آثار الهجوم أثناء الإصلاح.', 'tip');
    return { nextState: next, lines, sfxTrigger: 'tick' };
  }

  // UPDATE WORDPRESS (THE KEY TRAP)
  if (lower === 'update wordpress' || lower === 'wp core update') {
    next.wordpressVersion = '6.8.3';
    next.score = Math.max(0, next.score - 40);
    next.accuracyStats.wrongInputs++;
    add('Updating WordPress core to 6.8.3... [OK]', 'ok');
    add('Warning: php -v still reports 8.4.24 [VULNERABLE]. Memory leak and UAF persist!', 'warn');
    add('الفخ الأمني: تحديث ووردبريس أو الإضافات لا يحل المشكلة لأن الثغرة في نواة محرك PHP المشغل لها!', 'tip');
    return { nextState: next, lines, sfxTrigger: 'error', shake: true };
  }

  // DISABLE UPLOAD_PROGRESS (PARTIAL FIX)
  if (lower === 'disable upload_progress' || lower.includes('session.upload_progress.enabled=0')) {
    next.uploadProgressEnabled = false;
    next.exposure = Math.max(0, next.exposure - 10);
    next.score += 40;
    next.accuracyStats.correctInputs++;
    add('session.upload_progress.enabled set to Off in php.ini.', 'warn');
    add('إصلاح جزئي: إغلاق upload_progress يعطل مساراً واحداً، لكن ثغرة الـ UAF ما زالت مفتوحة عبر مسارات أخرى.', 'tip');
    return { nextState: next, lines, sfxTrigger: 'warn' };
  }

  // RESTART PHP-FPM WITHOUT PATCH
  if (lower === 'restart php-fpm' || lower === 'systemctl restart php-fpm') {
    if (next.patchApplied) {
      next.servicesRestarted = true;
      next.workersHealthy = 5;
      next.workersCrashed = 0;
      next.availability = 100;
      next.exposure = 0;
      next.score += 100;
      next.accuracyStats.correctInputs++;
      add('Restarting php-fpm service... [OK]', 'ok');
      add('All workers reloaded with patched PHP 8.4.27 runtime.', 'ok');
      add('تم تحميل المحرك المرقّع بنجاح: السيرفر الآن محمي من انهيارات الذاكرة وتداخل المؤشرات.', 'tip');
      return { nextState: next, lines, sfxTrigger: 'unlock' };
    } else {
      next.score = Math.max(0, next.score - 20);
      next.accuracyStats.wrongInputs++;
      add('Restarted php-fpm service, but the vulnerable 8.4.24 engine reloaded!', 'warn');
      add('إعادة تشغيل الخادم بدون ترقيع المحرك مجرد إسعاف عابر، وستعود الثغرة بمجرد استقبال طلبات جديدة.', 'tip');
      return { nextState: next, lines, sfxTrigger: 'warn' };
    }
  }

  // SUDO APT INSTALL (THE REAL PATCH)
  if (lower.startsWith('sudo apt install php') || lower.startsWith('update php')) {
    if (lower.includes('8.4.27') || lower.includes('8.3.36') || lower.includes('8.5.12') || lower.includes('8.2.35')) {
      next.passwordMode = 'sudo';
      add('[sudo] password for soc:', 'warn');
      return { nextState: next, lines, sfxTrigger: 'keyClick' };
    } else {
      add('E: Version specified is not an official vendor security release for PHP2Shell.', 'err');
      add('الإصدارات الرسمية المعالجة للثغرتين هي: 8.5.12 أو 8.4.27 أو 8.3.36 أو 8.2.35.', 'tip');
      next.score = Math.max(0, next.score - 15);
      next.accuracyStats.wrongInputs++;
      return { nextState: next, lines, sfxTrigger: 'error' };
    }
  }

  // SUDO SYSTEMCTL RESTART PHP-FPM
  if (lower.includes('systemctl restart php-fpm')) {
    if (next.patchApplied) {
      next.servicesRestarted = true;
      next.workersHealthy = 5;
      next.workersCrashed = 0;
      next.availability = 100;
      next.exposure = 0;
      next.score += 100;
      next.accuracyStats.correctInputs++;
      add('php-fpm.service restarted successfully. 5 workers running patched engine.', 'ok');
      return { nextState: next, lines, sfxTrigger: 'unlock' };
    } else {
      add('php-fpm restarted, but runtime is still vulnerable 8.4.24. Patch first!', 'warn');
      return { nextState: next, lines, sfxTrigger: 'warn' };
    }
  }

  // VERIFY COMMAND
  if (lower === 'verify') {
    const checks = [
      { name: 'PHP Core Patched to Supported Version', pass: next.patchApplied },
      { name: 'Services Restarted with Clean Memory', pass: next.servicesRestarted },
      { name: 'Stale Pointer Cleared (No UAF)', pass: next.stalePointerCleared },
      { name: 'Attacker Source IP Blocked', pass: next.attackerBlocked }
    ];

    add('--- [INCIDENT REMEDIATION VERIFICATION] ---', 'dim');
    checks.forEach((c) => {
      add(`${c.pass ? '[PASS]' : '[FAIL]'} ${c.name}`, c.pass ? 'ok' : 'err');
    });

    const allPass = checks.every((c) => c.pass);
    if (allPass) {
      next.verified = true;
      next.score += 200;
      next.badgesEarned.add('ZERO_LEAK');
      add('VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL AND SECURED!', 'ok');
      add('تهانينا! لقد قمت باحتواء الحادث السيبراني وفهمت هندسة ثغرات الذاكرة في PHP.', 'tip');
      return { nextState: next, lines, sfxTrigger: 'chime' };
    } else {
      next.score = Math.max(0, next.score - 20);
      add('VERIFICATION FAILED: Review failed checks above and complete necessary actions.', 'err');
      return { nextState: next, lines, sfxTrigger: 'error', shake: true };
    }
  }

  // FLAG BOX (STATION 3 OPCACHE)
  if (lower.startsWith('flag box-')) {
    const boxId = lower.replace('flag', '').trim();
    const box = next.opcacheBoxes.find((b) => b.id === boxId);
    if (box) {
      if (box.mismatched) {
        box.flagged = true;
        next.score += 60;
        next.combo++;
        next.highestCombo = Math.max(next.highestCombo, next.combo);
        next.accuracyStats.correctInputs++;
        add(`Box ${box.id} flagged! Type confusion prevented before entering shared cache.`, 'ok');
        return { nextState: next, lines, sfxTrigger: 'tick' };
      } else {
        next.score = Math.max(0, next.score - 20);
        next.combo = 1;
        next.accuracyStats.wrongInputs++;
        add(`Box ${box.id} was legitimate! False positive penalty.`, 'err');
        return { nextState: next, lines, sfxTrigger: 'error', shake: true };
      }
    }
  }

  // ROTATE SESSIONS (STATION 3 SESSIONS)
  if (lower.startsWith('rotate')) {
    const target = lower.replace('rotate', '').trim();
    if (target === 'all') {
      next.sessions.forEach((s) => (s.rotated = true));
      next.score += 80;
      next.accuracyStats.correctInputs++;
      add('All session tokens rotated. Leaked cookies invalidated.', 'ok');
      return { nextState: next, lines, sfxTrigger: 'unlock' };
    } else {
      const match = next.sessions.find((s) => s.prefix.toLowerCase() === target || s.value.startsWith(target));
      if (match) {
        match.rotated = true;
        next.score += 40;
        next.combo++;
        next.highestCombo = Math.max(next.highestCombo, next.combo);
        next.accuracyStats.correctInputs++;
        add(`Session ${match.prefix}... invalidated and reissued.`, 'ok');
        return { nextState: next, lines, sfxTrigger: 'tick' };
      }
    }
  }

  // TYPE-TO-BLOCK (STATION 1)
  if (lower.startsWith('req-')) {
    const req = next.fallingRequests.find((r) => r.id === lower && !r.blocked && !r.missed);
    if (req) {
      if (req.isMalicious) {
        req.blocked = true;
        next.score += 120;
        next.combo++;
        next.highestCombo = Math.max(next.highestCombo, next.combo);
        next.accuracyStats.correctInputs++;
        add(`BLOCKED malicious request ${req.id} before reaching heap! (+120, x${next.combo} combo)`, 'ok');
        return { nextState: next, lines, sfxTrigger: 'tick' };
      } else {
        next.score = Math.max(0, next.score - 30);
        next.combo = 1;
        next.accuracyStats.wrongInputs++;
        add(`ERROR: ${req.id} was a clean request! You blocked a legitimate user. (-30)`, 'err');
        return { nextState: next, lines, sfxTrigger: 'error', shake: true };
      }
    }
  }

  // RECKLESS COMMANDS PENALTY
  if (lower.startsWith('rm') || lower.includes('disable monitoring') || lower.includes('format')) {
    next.integrity = Math.max(0, next.integrity - 35);
    next.score = Math.max(0, next.score - 100);
    next.accuracyStats.wrongInputs++;
    add(`RECKLESS COMMAND EXECUTED: ${trimmed}. Forensic integrity compromised! (-100 PTS)`, 'err');
    return { nextState: next, lines, sfxTrigger: 'overload', shake: true };
  }

  // UNKNOWN COMMAND WITH "DID YOU MEAN"
  const suggestion = findClosestCommand(trimmed);
  add(`bash: command not found: "${trimmed}"${suggestion ? `. Did you mean: "${suggestion}"?` : '. Type "help" for available commands.'}`, 'err');
  next.score = Math.max(0, next.score - 5);
  next.accuracyStats.wrongInputs++;
  return { nextState: next, lines, sfxTrigger: 'error' };
}
