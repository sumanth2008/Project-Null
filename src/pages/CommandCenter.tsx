import { useState, useRef, useEffect } from 'react';
import { Terminal, Plus, X, Shield, ShieldAlert, Cpu, Folder, File as FileIcon, Loader2 } from 'lucide-react';
import { ai, MODELS } from '../lib/gemini';

type PermissionLevel = 1 | 2 | 3; // 1: User, 2: Developer, 3: Root

interface OutputLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'ai';
  text: string;
}

interface Tab {
  id: string;
  title: string;
  cwd: string;
  level: PermissionLevel;
  output: OutputLine[];
  history: string[];
  historyIdx: number;
  awaitingInput?: 'password' | null;
  isRunning?: boolean;
}

interface VFSNode {
  type: 'dir' | 'file';
  content?: string;
  owner: 'root' | 'user';
}

const INITIAL_VFS: Record<string, VFSNode> = {
  '/': { type: 'dir', owner: 'root' },
  '/home': { type: 'dir', owner: 'root' },
  '/home/user': { type: 'dir', owner: 'user' },
  '/home/user/readme.txt': { type: 'file', owner: 'user', content: 'Welcome to NullMatrix OS.\nType "help" for available commands.\nUse "ai <prompt>" to translate natural language to commands.' },
  '/etc': { type: 'dir', owner: 'root' },
  '/etc/passwd': { type: 'file', owner: 'root', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash' },
  '/var': { type: 'dir', owner: 'root' },
  '/var/log': { type: 'dir', owner: 'root' },
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function CommandCenter() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: generateId(), title: 'bash', cwd: '/home/user', level: 1, output: [{ id: generateId(), type: 'system', text: 'NullMatrix OS v2.4.1\nTerminal Subsystem Initialized. Sandbox active.' }], history: [], historyIdx: -1 }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [vfs, setVfs] = useState<Record<string, VFSNode>>(INITIAL_VFS);
  const [input, setInput] = useState('');
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab.output]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTabId]);

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const print = (tabId: string, type: OutputLine['type'], text: string) => {
    updateTab(tabId, { output: [...(tabs.find(t => t.id === tabId)?.output || []), { id: generateId(), type, text }] });
  };

  const resolvePath = (cwd: string, path: string) => {
    if (path.startsWith('/')) return path.replace(/\/+$/, '') || '/';
    if (path === '~') return '/home/user';
    
    const parts = cwd.split('/').filter(Boolean);
    const newParts = path.split('/').filter(Boolean);
    
    for (const part of newParts) {
      if (part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    
    return '/' + parts.join('/');
  };

  const checkPermission = (tab: Tab, path: string, write: boolean = false): boolean => {
    if (tab.level === 3) return true; // Root can do anything
    const node = vfs[path];
    if (write) {
      // Users can only write to /home/user
      return path.startsWith('/home/user');
    }
    // Users can read most things, but let's restrict /root
    if (path.startsWith('/root')) return false;
    return true;
  };

  const isDangerous = (cmd: string, level: PermissionLevel) => {
    if (/rm\s+-r[fF]?\s+\//.test(cmd)) return true;
    if (/mkfs/.test(cmd)) return true;
    if (/dd\s+if=/.test(cmd)) return true;
    if (/>\s*\//.test(cmd) && level < 3) return true; // Redirect to root without level 3
    return false;
  };

  const executeCommand = async (cmdStr: string, tabId: string, isAiGenerated: boolean = false) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const args: string[] = cmdStr.trim().match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    if (args.length === 0) return;

    const cmd = args[0].toLowerCase();
    const cleanArgs = args.slice(1).map(a => a.replace(/^["']|["']$/g, ''));

    // Security Sandbox Check
    if (isDangerous(cmdStr, tab.level)) {
      print(tabId, 'error', `[SECURITY SANDBOX] Blocked dangerous command: ${cmdStr}\nIncident logged.`);
      return;
    }

    switch (cmd) {
      case 'help':
        print(tabId, 'output', `NullMatrix OS Terminal Commands:
  ls [dir]       - List directory contents
  cd [dir]       - Change directory
  pwd            - Print working directory
  mkdir [dir]    - Create directory
  touch [file]   - Create empty file
  cat [file]     - Read file content
  rm [file]      - Remove file
  clear          - Clear terminal output
  su             - Switch user (elevate to root)
  devmode        - Switch to developer mode
  ai [prompt]    - AI Command Interpreter (e.g., "ai create a react app")
  
Developer & Security Tools (Simulated):
  git, npm, python, node, docker
  nmap, wireshark, tcpdump
  htop, top, free, df, neofetch
  vim, rg (ripgrep), jq
  tmux, fzf`);
        break;
      
      case 'clear':
        updateTab(tabId, { output: [] });
        break;

      case 'pwd':
        print(tabId, 'output', tab.cwd);
        break;

      case 'ls': {
        const target = resolvePath(tab.cwd, cleanArgs[0] || '.');
        if (!vfs[target]) {
          print(tabId, 'error', `ls: cannot access '${target}': No such file or directory`);
          break;
        }
        if (vfs[target].type === 'file') {
          print(tabId, 'output', target);
          break;
        }
        const items = Object.keys(vfs).filter(p => {
          if (p === target) return false;
          const relative = p.substring(target === '/' ? 1 : target.length + 1);
          return relative.length > 0 && !relative.includes('/');
        });
        if (items.length === 0) {
          print(tabId, 'output', '');
        } else {
          const formatted = items.map(p => {
            const name = p.split('/').pop();
            return vfs[p].type === 'dir' ? `<span class="text-blue-400 font-bold">${name}/</span>` : name;
          }).join('  ');
          print(tabId, 'output', `<div dangerouslySetInnerHTML="true">${formatted}</div>`); // We'll render HTML safely below
        }
        break;
      }

      case 'cd': {
        const target = resolvePath(tab.cwd, cleanArgs[0] || '~');
        if (!vfs[target]) {
          print(tabId, 'error', `cd: ${cleanArgs[0]}: No such file or directory`);
        } else if (vfs[target].type !== 'dir') {
          print(tabId, 'error', `cd: ${cleanArgs[0]}: Not a directory`);
        } else if (!checkPermission(tab, target)) {
          print(tabId, 'error', `cd: ${cleanArgs[0]}: Permission denied`);
        } else {
          updateTab(tabId, { cwd: target });
        }
        break;
      }

      case 'mkdir': {
        if (!cleanArgs[0]) {
          print(tabId, 'error', `mkdir: missing operand`);
          break;
        }
        const target = resolvePath(tab.cwd, cleanArgs[0]);
        if (vfs[target]) {
          print(tabId, 'error', `mkdir: cannot create directory '${cleanArgs[0]}': File exists`);
        } else if (!checkPermission(tab, target, true)) {
          print(tabId, 'error', `mkdir: cannot create directory '${cleanArgs[0]}': Permission denied`);
        } else {
          setVfs(prev => ({ ...prev, [target]: { type: 'dir', owner: tab.level === 3 ? 'root' : 'user' } }));
        }
        break;
      }

      case 'touch': {
        if (!cleanArgs[0]) {
          print(tabId, 'error', `touch: missing file operand`);
          break;
        }
        const target = resolvePath(tab.cwd, cleanArgs[0]);
        if (!checkPermission(tab, target, true)) {
          print(tabId, 'error', `touch: cannot touch '${cleanArgs[0]}': Permission denied`);
        } else {
          setVfs(prev => ({ ...prev, [target]: { type: 'file', content: '', owner: tab.level === 3 ? 'root' : 'user' } }));
        }
        break;
      }

      case 'cat': {
        if (!cleanArgs[0]) {
          print(tabId, 'error', `cat: missing file operand`);
          break;
        }
        const target = resolvePath(tab.cwd, cleanArgs[0]);
        if (!vfs[target]) {
          print(tabId, 'error', `cat: ${cleanArgs[0]}: No such file or directory`);
        } else if (vfs[target].type === 'dir') {
          print(tabId, 'error', `cat: ${cleanArgs[0]}: Is a directory`);
        } else if (!checkPermission(tab, target)) {
          print(tabId, 'error', `cat: ${cleanArgs[0]}: Permission denied`);
        } else {
          print(tabId, 'output', vfs[target].content || '');
        }
        break;
      }

      case 'rm': {
        if (!cleanArgs[0]) {
          print(tabId, 'error', `rm: missing operand`);
          break;
        }
        const target = resolvePath(tab.cwd, cleanArgs[0]);
        if (!vfs[target]) {
          print(tabId, 'error', `rm: cannot remove '${cleanArgs[0]}': No such file or directory`);
        } else if (vfs[target].type === 'dir' && !args.includes('-r') && !args.includes('-rf')) {
          print(tabId, 'error', `rm: cannot remove '${cleanArgs[0]}': Is a directory`);
        } else if (!checkPermission(tab, target, true)) {
          print(tabId, 'error', `rm: cannot remove '${cleanArgs[0]}': Permission denied`);
        } else {
          setVfs(prev => {
            const next = { ...prev };
            // Remove target and all children if dir
            Object.keys(next).forEach(p => {
              if (p === target || p.startsWith(target + '/')) {
                delete next[p];
              }
            });
            return next;
          });
        }
        break;
      }

      case 'su':
      case 'sudo':
        if (tab.level === 3) {
          print(tabId, 'output', 'Already running as root.');
        } else {
          print(tabId, 'system', 'Authentication required for root elevation.');
          updateTab(tabId, { awaitingInput: 'password' });
        }
        break;

      case 'devmode':
        if (tab.level >= 2) {
          print(tabId, 'output', 'Developer mode is already active.');
        } else {
          updateTab(tabId, { level: 2 });
          print(tabId, 'system', 'Developer mode enabled. Level 2 permissions granted.');
        }
        break;

      case 'ai': {
        const prompt = cleanArgs.join(' ');
        if (!prompt) {
          print(tabId, 'error', 'ai: missing prompt. Usage: ai <natural language request>');
          break;
        }
        
        updateTab(tabId, { isRunning: true });
        print(tabId, 'ai', `[AI Interpreter] Translating: "${prompt}"...`);
        
        try {
          const res = await ai.models.generateContent({
            model: MODELS.FLASH,
            contents: `You are an AI terminal assistant. Translate the following natural language request into a sequence of bash commands. 
            Return ONLY the commands, separated by newlines. Do not use markdown formatting (no \`\`\`bash).
            Assume a Debian/Ubuntu environment.
            Request: ${prompt}`
          });
          
          const commands = res.text?.split('\n').map(c => c.trim()).filter(Boolean) || [];
          
          if (commands.length === 0) {
            print(tabId, 'error', '[AI Error] Could not generate commands.');
          } else {
            for (const c of commands) {
              print(tabId, 'ai', `[AI Executing] $ ${c}`);
              // Simulate execution delay
              await new Promise(resolve => setTimeout(resolve, 800));
              await executeCommand(c, tabId, true);
            }
            print(tabId, 'ai', `[AI Interpreter] Task completed successfully.`);
          }
        } catch (err) {
          print(tabId, 'error', `[AI Error] Connection failed.`);
        } finally {
          updateTab(tabId, { isRunning: false });
        }
        break;
      }

      // Simulated Developer Tools
      case 'git':
        updateTab(tabId, { isRunning: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cleanArgs[0] === 'status') {
          print(tabId, 'output', `On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean`);
        } else if (cleanArgs[0] === 'clone') {
          const repo = cleanArgs[1] || 'repository';
          const dirName = repo.split('/').pop()?.replace('.git', '') || 'project';
          print(tabId, 'output', `Cloning into '${dirName}'...\nremote: Enumerating objects: 342, done.\nremote: Counting objects: 100% (342/342), done.\nremote: Compressing objects: 100% (214/214), done.\nremote: Total 342 (delta 124), reused 310 (delta 98), pack-reused 0\nReceiving objects: 100% (342/342), 4.20 MiB | 8.40 MiB/s, done.\nResolving deltas: 100% (124/124), done.`);
          const target = resolvePath(tab.cwd, dirName);
          setVfs(prev => ({ ...prev, [target]: { type: 'dir', owner: tab.level === 3 ? 'root' : 'user' } }));
        } else {
          print(tabId, 'output', `git ${cleanArgs.join(' ')}: command executed successfully.`);
        }
        updateTab(tabId, { isRunning: false });
        break;

      case 'npm':
        updateTab(tabId, { isRunning: true });
        await new Promise(resolve => setTimeout(resolve, 800));
        if (cleanArgs[0] === 'install' || cleanArgs[0] === 'i') {
          print(tabId, 'output', `added 142 packages, and audited 143 packages in 3s\n\n24 packages are looking for funding\n  run \`npm fund\` for details\n\nfound 0 vulnerabilities`);
        } else if (cleanArgs[0] === 'run' || cleanArgs[0] === 'start') {
          print(tabId, 'output', `> project@1.0.0 ${cleanArgs[0] === 'run' ? (cleanArgs[1] || 'dev') : 'start'}\n> vite\n\n  VITE v4.4.9  ready in 320 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose\n  ➜  press h to show help`);
        } else if (cleanArgs[0] === 'create') {
          const dirName = cleanArgs[2] || 'vite-project';
          print(tabId, 'output', `Scaffolding project in ${dirName}...\n\nDone. Now run:\n\n  cd ${dirName}\n  npm install\n  npm run dev`);
          const target = resolvePath(tab.cwd, dirName);
          setVfs(prev => ({ ...prev, [target]: { type: 'dir', owner: tab.level === 3 ? 'root' : 'user' } }));
        } else {
          print(tabId, 'output', `npm ${cleanArgs.join(' ')}: operation completed.`);
        }
        updateTab(tabId, { isRunning: false });
        break;

      case 'python':
      case 'python3':
        if (cleanArgs[0] === '--version' || cleanArgs[0] === '-V') {
          print(tabId, 'output', `Python 3.11.4`);
        } else if (cleanArgs.length > 0) {
          print(tabId, 'output', `Executing ${cleanArgs[0]}...\nDone.`);
        } else {
          print(tabId, 'output', `Python 3.11.4 (main, Jun  7 2023, 00:00:00) [GCC 11.3.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> `);
        }
        break;

      case 'node':
        if (cleanArgs[0] === '--version' || cleanArgs[0] === '-v') {
          print(tabId, 'output', `v20.5.0`);
        } else if (cleanArgs.length > 0) {
          print(tabId, 'output', `Executing ${cleanArgs[0]}...\nDone.`);
        } else {
          print(tabId, 'output', `Welcome to Node.js v20.5.0.\nType ".help" for more information.\n> `);
        }
        break;

      case 'nmap':
        updateTab(tabId, { isRunning: true });
        print(tabId, 'system', `Starting Nmap 7.93 ( https://nmap.org ) at ${new Date().toISOString()}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        print(tabId, 'output', `Nmap scan report for ${cleanArgs[0] || 'localhost'} (127.0.0.1)
Host is up (0.00013s latency).
Not shown: 996 closed tcp ports (conn-refused)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3000/tcp open  ppp

Nmap done: 1 IP address (1 host up) scanned in 2.14 seconds`);
        updateTab(tabId, { isRunning: false });
        break;

      case 'wireshark':
      case 'tcpdump':
        updateTab(tabId, { isRunning: true });
        print(tabId, 'system', `${cmd}: listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes`);
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const time = new Date().toISOString().split('T')[1].slice(0, -1);
          print(tabId, 'output', `${time} IP 192.168.1.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 60000)} > 10.0.0.1.443: Flags [P.], seq ${Math.floor(Math.random() * 1000)}:${Math.floor(Math.random() * 2000)}, ack 1, win 502, length ${Math.floor(Math.random() * 100)}`);
        }
        print(tabId, 'system', `\n5 packets captured\n5 packets received by filter\n0 packets dropped by kernel`);
        updateTab(tabId, { isRunning: false });
        break;

      case 'htop':
        print(tabId, 'output', `<div class="font-mono text-xs whitespace-pre">
  1  [||||||||||||||||||||||||||||||||||||||||100.0%]   Tasks: 42, 120 thr; 1 running
  2  [||||||||||||||||||||||||||||||||||||||||100.0%]   Load average: 2.14 1.89 1.55 
  3  [||||||||||||||||||||||||||||||||||||||||100.0%]   Uptime: 14 days, 02:14:00
  4  [||||||||||||||||||||||||||||||||||||||||100.0%]
  Mem[||||||||||||||||||||||||||||||||||14.2G/32.0G]
  Swp[|                                  120M/8.00G]

  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command
 1337 root       20   0 14.2G  2.1G  1.1G S 45.2  6.5 14h22:12 /usr/bin/dockerd
 9001 user       20   0 4200M  1.2G  500M R 24.5  3.7  2h10:00 node server.js
 4040 user       20   0 1200M  400M  200M S  5.0  1.2  0h45:12 vim src/index.ts
    1 root       20   0  168M   12M    8M S  0.0  0.0  0h02:14 /sbin/init
</div>`);
        break;

      case 'top':
        print(tabId, 'output', `<div class="font-mono text-xs whitespace-pre">
top - ${new Date().toISOString().split('T')[1].slice(0, 8)} up 14 days,  2:14,  1 user,  load average: 2.14, 1.89, 1.55
Tasks:  42 total,   1 running,  41 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.5 us,  3.2 sy,  0.0 ni, 84.1 id,  0.1 wa,  0.0 hi,  0.1 si,  0.0 st
MiB Mem :  32768.0 total,  18236.0 free,  14532.0 used,   4200.0 buff/cache
MiB Swap:   8192.0 total,   8072.0 free,    120.0 used.  16800.0 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1337 root      20   0   14.2g   2.1g   1.1g S  45.2   6.5 862:12.45 dockerd
 9001 user      20   0   4200m   1.2g   500m R  24.5   3.7 130:00.12 node
 4040 user      20   0   1200m   400m   200m S   5.0   1.2  45:12.34 vim
    1 root      20   0  168000  12000   8000 S   0.0   0.0   2:14.56 init
</div>`);
        break;

      case 'df':
        print(tabId, 'output', `<div class="font-mono text-xs whitespace-pre">
Filesystem     1K-blocks      Used Available Use% Mounted on
udev            16384000         0  16384000   0% /dev
tmpfs            3276800      1200   3275600   1% /run
/dev/nvme0n1p2 500000000 125000000 350000000  27% /
tmpfs           16384000         0  16384000   0% /dev/shm
tmpfs               5120         4      5116   1% /run/lock
/dev/nvme0n1p1   1048576    100000    948576  10% /boot/efi
tmpfs            3276800        40   3276760   1% /run/user/1000
</div>`);
        break;

      case 'free':
        print(tabId, 'output', `<div class="font-mono text-xs whitespace-pre">
               total        used        free      shared  buff/cache   available
Mem:        32768000    14532000    14036000      250000     4200000    16800000
Swap:        8192000      120000     8072000
</div>`);
        break;

      case 'neofetch':
        print(tabId, 'output', `<div class="flex gap-4 font-mono text-xs">
  <div class="text-emerald-500 font-bold whitespace-pre">
      /\\
     /  \\
    /    \\
   /      \\
  /________\\
  </div>
  <div>
    <span class="text-emerald-400 font-bold">user@nullmatrix</span>
    <br/>-----------------
    <br/><span class="text-emerald-400 font-bold">OS</span>: NullMatrix OS v2.4.1
    <br/><span class="text-emerald-400 font-bold">Kernel</span>: 6.5.0-generic
    <br/><span class="text-emerald-400 font-bold">Uptime</span>: 14 days, 2 hours
    <br/><span class="text-emerald-400 font-bold">Packages</span>: 1337 (dpkg)
    <br/><span class="text-emerald-400 font-bold">Shell</span>: bash 5.2.15
    <br/><span class="text-emerald-400 font-bold">Terminal</span>: NullTerm
    <br/><span class="text-emerald-400 font-bold">CPU</span>: Quantum Processor X (128) @ 4.5GHz
    <br/><span class="text-emerald-400 font-bold">Memory</span>: 14532MiB / 32768MiB
  </div>
</div>`);
        break;

      case 'vim':
      case 'vi':
      case 'nano':
        if (!cleanArgs[0]) {
          print(tabId, 'error', `${cmd}: missing filename`);
          break;
        }
        updateTab(tabId, { isRunning: true });
        print(tabId, 'system', `Opening ${cleanArgs[0]} in ${cmd}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        print(tabId, 'output', `[Simulated Editor] File ${cleanArgs[0]} opened. (Read-only mode in simulation)`);
        updateTab(tabId, { isRunning: false });
        break;

      case 'rg':
      case 'ripgrep':
      case 'grep':
        if (!cleanArgs[0]) {
          print(tabId, 'error', `${cmd}: missing pattern`);
          break;
        }
        updateTab(tabId, { isRunning: true });
        print(tabId, 'system', `Searching for pattern '${cleanArgs[0]}' in ${activeTab.cwd}...`);
        await new Promise(resolve => setTimeout(resolve, 800));
        print(tabId, 'output', `<span class="text-purple-400">src/main.ts</span>:12:  const <span class="text-red-400 font-bold">${cleanArgs[0]}</span> = "found";\n<span class="text-purple-400">src/utils.ts</span>:45:  return <span class="text-red-400 font-bold">${cleanArgs[0]}</span>;`);
        updateTab(tabId, { isRunning: false });
        break;

      case 'jq':
        updateTab(tabId, { isRunning: true });
        print(tabId, 'system', `Processing JSON data...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        print(tabId, 'output', `{
  <span class="text-blue-400">"status"</span>: <span class="text-emerald-400">"success"</span>,
  <span class="text-blue-400">"data"</span>: {
    <span class="text-blue-400">"id"</span>: <span class="text-yellow-400">1337</span>,
    <span class="text-blue-400">"message"</span>: <span class="text-emerald-400">"Parsed successfully by jq"</span>
  }
}`);
        updateTab(tabId, { isRunning: false });
        break;

      case 'tmux':
        print(tabId, 'system', `[tmux] New session created. (Simulated)`);
        break;

      case 'fzf':
        updateTab(tabId, { isRunning: true });
        print(tabId, 'system', `[fzf] Interactive search...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        print(tabId, 'output', `> src/index.ts\n  src/components/App.tsx\n  package.json\n  README.md\n  24/24 items matched`);
        updateTab(tabId, { isRunning: false });
        break;

      case 'docker':
        updateTab(tabId, { isRunning: true });
        if (cleanArgs[0] === 'ps') {
          print(tabId, 'output', `CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS          PORTS                                       NAMES\na1b2c3d4e5f6   nginx:latest  "/docker-entrypoint.…"   14 days ago      Up 14 days      0.0.0.0:80->80/tcp, :::80->80/tcp           web-proxy\nf6e5d4c3b2a1   postgres:15   "docker-entrypoint.s…"   14 days ago      Up 14 days      0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   db-main`);
        } else if (cleanArgs[0] === 'build') {
          await new Promise(resolve => setTimeout(resolve, 1500));
          print(tabId, 'output', `Sending build context to Docker daemon  2.048kB\nStep 1/4 : FROM node:18-alpine\n ---> 3b8d91c1cb9d\nStep 2/4 : WORKDIR /app\n ---> Running in 1a2b3c4d5e6f\nRemoving intermediate container 1a2b3c4d5e6f\n ---> 4c5d6e7f8a9b\nStep 3/4 : COPY . .\n ---> 5d6e7f8a9b0c\nStep 4/4 : CMD ["npm", "start"]\n ---> Running in 6e7f8a9b0c1d\nRemoving intermediate container 6e7f8a9b0c1d\n ---> 7f8a9b0c1d2e\nSuccessfully built 7f8a9b0c1d2e`);
        } else if (cleanArgs[0] === 'run') {
          await new Promise(resolve => setTimeout(resolve, 1500));
          print(tabId, 'output', `Unable to find image '${cleanArgs[1] || 'hello-world'}:latest' locally\nlatest: Pulling from library/${cleanArgs[1] || 'hello-world'}\n719385e32844: Pull complete\nDigest: sha256:c79d06dfdfd3d3eb04cafd062bacabde3f65cb0727def260a7fad461d1a0800e\nStatus: Downloaded newer image for ${cleanArgs[1] || 'hello-world'}:latest\n\nHello from Docker!\nThis message shows that your installation appears to be working correctly.`);
        } else {
          print(tabId, 'system', `[Docker] Running docker ${cleanArgs.join(' ')}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          print(tabId, 'output', `Docker operation completed successfully.`);
        }
        updateTab(tabId, { isRunning: false });
        break;

      default:
        print(tabId, 'error', `bash: ${cmd}: command not found`);
    }
  };

  const handleInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !activeTab.awaitingInput) return;

    const currentInput = input;
    setInput('');

    if (activeTab.awaitingInput === 'password') {
      print(activeTabId, 'input', 'Password: ****');
      // Accept any password for simulation, or require "root"
      if (currentInput === 'root' || currentInput !== '') {
        updateTab(activeTabId, { level: 3, awaitingInput: null });
        print(activeTabId, 'system', 'Privilege elevation successful. Root mode enabled.\nWARNING: You are now running with unrestricted access.');
      } else {
        updateTab(activeTabId, { awaitingInput: null });
        print(activeTabId, 'error', 'su: Authentication failure');
      }
      return;
    }

    const prompt = activeTab.level === 3 ? 'root@nullmatrix:~#' : activeTab.level === 2 ? `dev@nullmatrix:${activeTab.cwd}$` : `user@nullmatrix:${activeTab.cwd}$`;
    print(activeTabId, 'input', `${prompt} ${currentInput}`);
    
    const newHistory = [...activeTab.history, currentInput];
    updateTab(activeTabId, { history: newHistory, historyIdx: newHistory.length });
    
    await executeCommand(currentInput, activeTabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Basic auto-complete
      const args = input.split(' ');
      const lastArg = args[args.length - 1];
      if (lastArg) {
        const targetDir = resolvePath(activeTab.cwd, lastArg.includes('/') ? lastArg.substring(0, lastArg.lastIndexOf('/')) : '.');
        const prefix = lastArg.includes('/') ? lastArg.substring(lastArg.lastIndexOf('/') + 1) : lastArg;
        
        const matches = Object.keys(vfs).filter(p => {
          if (p === targetDir) return false;
          const relative = p.substring(targetDir === '/' ? 1 : targetDir.length + 1);
          return relative.startsWith(prefix) && !relative.substring(prefix.length).includes('/');
        });

        if (matches.length === 1) {
          const matchName = matches[0].substring(matches[0].lastIndexOf('/') + 1);
          const isDir = vfs[matches[0]].type === 'dir';
          const newLastArg = lastArg.substring(0, lastArg.length - prefix.length) + matchName + (isDir ? '/' : '');
          args[args.length - 1] = newLastArg;
          setInput(args.join(' '));
        } else if (matches.length > 1) {
          const matchNames = matches.map(m => m.substring(m.lastIndexOf('/') + 1) + (vfs[m].type === 'dir' ? '/' : '')).join('  ');
          print(activeTabId, 'output', matchNames);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeTab.historyIdx > 0) {
        const newIdx = activeTab.historyIdx - 1;
        updateTab(activeTabId, { historyIdx: newIdx });
        setInput(activeTab.history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeTab.historyIdx < activeTab.history.length - 1) {
        const newIdx = activeTab.historyIdx + 1;
        updateTab(activeTabId, { historyIdx: newIdx });
        setInput(activeTab.history[newIdx]);
      } else {
        updateTab(activeTabId, { historyIdx: activeTab.history.length });
        setInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (activeTab.isRunning) {
        updateTab(activeTabId, { isRunning: false });
        print(activeTabId, 'system', '^C\nProcess terminated by user.');
        const prompt = activeTab.level === 3 ? 'root@nullmatrix:~#' : activeTab.level === 2 ? `dev@nullmatrix:${activeTab.cwd}$` : `user@nullmatrix:${activeTab.cwd}$`;
        print(activeTabId, 'input', `${prompt} ^C`);
      }
      setInput('');
    }
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: generateId(),
      title: 'bash',
      cwd: '/home/user',
      level: 1,
      output: [{ id: generateId(), type: 'system', text: 'New session started.' }],
      history: [],
      historyIdx: -1
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Don't close last tab
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  const renderOutputText = (text: string) => {
    // Basic syntax highlighting for output
    if (text.includes('<span')) {
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    return text;
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black text-zinc-300 transition-colors duration-300">
      {/* Header & Tabs */}
      <header className="bg-zinc-900 border-b border-zinc-800 flex items-center shrink-0">
        <div className="flex-1 flex overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 min-w-[140px] max-w-[200px] border-r border-zinc-800 cursor-pointer transition-colors group ${activeTabId === tab.id ? 'bg-zinc-950 text-emerald-400 border-t-2 border-t-emerald-500' : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800'}`}
            >
              <Terminal className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate flex-1">{tab.level === 3 ? 'root' : tab.level === 2 ? 'dev' : 'user'}@{tab.title}</span>
              {tabs.length > 1 && (
                <button onClick={(e) => closeTab(e, tab.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addNewTab} className="p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors border-l border-zinc-800">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Status Bar */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-1.5 flex justify-between items-center text-xs shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-blue-400" /> {activeTab.cwd}
          </span>
          {activeTab.level === 3 ? (
            <span className="flex items-center gap-1.5 text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
              <ShieldAlert className="w-3.5 h-3.5" /> ROOT MODE
            </span>
          ) : activeTab.level === 2 ? (
            <span className="flex items-center gap-1.5 text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded">
              <Shield className="w-3.5 h-3.5" /> DEVELOPER MODE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-zinc-500">
              <Shield className="w-3.5 h-3.5" /> Standard User
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Cpu className="w-3.5 h-3.5" /> Sandbox Active
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-1 text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {activeTab.output.map((line) => (
          <div key={line.id} className="whitespace-pre-wrap break-all">
            {line.type === 'input' && <span className="font-bold">{line.text}</span>}
            {line.type === 'output' && <span className="text-zinc-300">{renderOutputText(line.text)}</span>}
            {line.type === 'error' && <span className="text-red-400">{line.text}</span>}
            {line.type === 'system' && <span className="text-blue-400/80 italic">{line.text}</span>}
            {line.type === 'ai' && <span className="text-purple-400 font-semibold">{line.text}</span>}
          </div>
        ))}
        
        {activeTab.isRunning && (
          <div className="flex items-center gap-2 text-emerald-500/70 mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Executing process... (Press Ctrl+C to terminate)</span>
          </div>
        )}
        <div ref={outputEndRef} />
      </div>

      {/* Command Input */}
      <div className="p-4 bg-zinc-950 shrink-0">
        <form onSubmit={handleInput} className="flex items-center gap-2">
          {activeTab.awaitingInput === 'password' ? (
            <span className="text-zinc-400 font-bold">Password:</span>
          ) : (
            <span className={`font-bold ${activeTab.level === 3 ? 'text-red-500' : activeTab.level === 2 ? 'text-yellow-500' : 'text-emerald-500'}`}>
              {activeTab.level === 3 ? 'root@nullmatrix:~#' : activeTab.level === 2 ? `dev@nullmatrix:${activeTab.cwd}$` : `user@nullmatrix:${activeTab.cwd}$`}
            </span>
          )}
          <input
            ref={inputRef}
            type={activeTab.awaitingInput === 'password' ? 'password' : 'text'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-zinc-100 focus:outline-none focus:ring-0"
            disabled={activeTab.isRunning}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}
