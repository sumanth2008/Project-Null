import { useState, useRef, useLayoutEffect } from 'react';
import { Shield, Lock, Wifi, Activity, AlertTriangle, CheckCircle2, FileCode, Upload, Loader2, SplitSquareHorizontal, FileText, Settings, Terminal, Server, Key, Play, Square } from 'lucide-react';
import { ai, MODELS } from '../lib/gemini';
import { Type } from '@google/genai';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useTheme } from '../components/ThemeContext';

function FoldMinimizeCard({ title = "Cyber Lab", children, icon: Icon, defaultOpen = true }: { title?: string, children: React.ReactNode, icon?: React.ElementType, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [minimized, setMinimized] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(defaultOpen ? "none" : "0px");

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      setMaxH(`${el.scrollHeight}px`);
      const t = setTimeout(() => setMaxH("none"), 360);
      return () => clearTimeout(t);
    } else {
      setMaxH(`${el.scrollHeight}px`);
      requestAnimationFrame(() => requestAnimationFrame(() => setMaxH("0px")));
    }
  }, [open]);

  if (minimized) {
    return (
      <button
        aria-label={`Restore ${title}`}
        className="w-12 h-12 rounded-lg shadow-lg bg-zinc-800 border border-zinc-700 text-zinc-100 flex items-center justify-center transform-gpu transition-transform duration-200 hover:scale-105 focus:outline-none"
        onClick={() => setMinimized(false)}
        title={`Restore ${title}`}
      >
        {Icon ? <Icon className="w-5 h-5 text-emerald-400" /> : <Activity className="w-5 h-5 text-emerald-400" />}
      </button>
    );
  }

  return (
    <section className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-fit transition-all duration-300">
      <header className="flex items-center justify-between p-4 bg-zinc-900/80 text-zinc-100 cursor-pointer border-b border-zinc-800 hover:bg-zinc-800/80 transition-colors"
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" ") setOpen(o=>!o) }}
        aria-expanded={open}
        >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-emerald-400" />}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e)=>{ e.stopPropagation(); setMinimized(true); }}
            aria-label="Minimize panel"
            className="px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
          >Min</button>
          <svg className={`w-4 h-4 text-zinc-400 transform transition-transform duration-300 ${open? "rotate-180":""}`} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>
        </div>
      </header>

      <div
        ref={contentRef}
        className="bg-transparent overflow-hidden transition-[max-height,padding,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: maxH,
          padding: open ? "1.5rem" : "0 1.5rem",
          opacity: open ? 1 : 0,
        }}
        aria-hidden={!open}
      >
        <div className="text-sm text-zinc-300 h-full">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function CyberLab() {
  const [password, setPassword] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);

  // SSH State
  const [sshHost, setSshHost] = useState('');
  const [sshUser, setSshUser] = useState('');
  const [sshPass, setSshPass] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [sshConnected, setSshConnected] = useState(false);
  const [sshConnecting, setSshConnecting] = useState(false);
  const [sshLogs, setSshLogs] = useState<string[]>([]);
  const [sshCommand, setSshCommand] = useState('');

  const [codeFile, setCodeFile] = useState<File | null>(null);
  const [originalCode, setOriginalCode] = useState<string | null>(null);
  const [analyzingCode, setAnalyzingCode] = useState(false);
  const [codeAnalysisSummary, setCodeAnalysisSummary] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'diff'>('summary');
  const [customRules, setCustomRules] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sshLogEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score++;
    if (pass.length > 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = checkPasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-emerald-500', 'text-emerald-400'];

  const runNetworkScan = () => {
    setScanning(true);
    setScanResults([]);
    
    const steps = [
      "Initializing Nmap 7.93 ( https://nmap.org )",
      "Starting Nmap 7.93 at 2026-03-15 14:40 PDT",
      "NSE: Loaded 155 scripts for scanning.",
      "Initiating Ping Scan at 14:40",
      "Scanning 192.168.1.0/24 [256 IPs]",
      "Completed Ping Scan at 14:40, 2.13s elapsed (4 total hosts)",
      "Initiating Parallel DNS resolution of 4 hosts. completed at 14:40",
      "Initiating SYN Stealth Scan at 14:40",
      "Scanning 4 hosts [1000 ports/host]",
      "Discovered open port 80/tcp on 192.168.1.1",
      "Discovered open port 443/tcp on 192.168.1.1",
      "Discovered open port 22/tcp on 192.168.1.105",
      "Completed SYN Stealth Scan at 14:40, 4.5s elapsed (4000 total ports)",
      "Nmap done: 256 IP addresses (4 hosts up) scanned in 6.8 seconds"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanResults(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setScanning(false);
      }
    }, 500);
  };

  const handleSshConnect = () => {
    if (!sshHost || !sshUser) return;
    setSshConnecting(true);
    setSshLogs([`Connecting to ${sshUser}@${sshHost}:${sshPort}...`]);
    
    setTimeout(() => {
      setSshLogs(prev => [...prev, "Negotiating SSH2 parameters...", "Authenticating...", "Authentication successful.", "Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-31-generic x86_64)"]);
      setSshConnected(true);
      setSshConnecting(false);
    }, 2000);
  };

  const handleSshDisconnect = () => {
    setSshLogs(prev => [...prev, "Connection closed by remote host."]);
    setSshConnected(false);
  };

  const handleSshCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sshCommand.trim() || !sshConnected) return;
    
    setSshLogs(prev => [...prev, `${sshUser}@${sshHost}:~$ ${sshCommand}`]);
    
    const cmd = sshCommand.trim().toLowerCase();
    setSshCommand('');
    
    setTimeout(() => {
      if (cmd === 'ls') {
        setSshLogs(prev => [...prev, "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var"]);
      } else if (cmd === 'whoami') {
        setSshLogs(prev => [...prev, sshUser]);
      } else if (cmd === 'pwd') {
        setSshLogs(prev => [...prev, `/home/${sshUser}`]);
      } else if (cmd === 'clear') {
        setSshLogs([]);
      } else {
        setSshLogs(prev => [...prev, `bash: ${cmd}: command not found`]);
      }
      setTimeout(() => {
        sshLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }, 400);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCodeFile(file);
      const content = await file.text();
      setOriginalCode(content);
      setCodeAnalysisSummary(null);
      setSuggestedCode(null);
    }
  };

  const analyzeCode = async () => {
    if (!codeFile || !originalCode) return;
    
    setAnalyzingCode(true);
    setCodeAnalysisSummary(null);
    setSuggestedCode(null);
    setActiveTab('summary');

    try {
      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: `Analyze the following code for potential vulnerabilities, style issues, and performance bottlenecks. Provide a concise summary of your findings, and provide the fully refactored code incorporating your suggestions.
        ${customRules.trim() ? `\nPlease prioritize and apply the following custom rules/preferences:\n${customRules}\n` : ''}
        Filename: ${codeFile.name}
        
        Code:
        ${originalCode}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "Concise summary of findings" },
              suggestedCode: { type: Type.STRING, description: "The complete refactored code" }
            },
            required: ["summary", "suggestedCode"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setCodeAnalysisSummary(result.summary || 'No analysis generated.');
      setSuggestedCode(result.suggestedCode || originalCode);
    } catch (error) {
      console.error('Error analyzing code:', error);
      setCodeAnalysisSummary('An error occurred during code analysis.');
    } finally {
      setAnalyzingCode(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-y-auto transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" /> NullSentinel Cyber Lab
        </h1>
      </header>

      <div className="p-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        
        {/* Minimized Tray Area (handled by individual components rendering their minimized state inline or fixed) */}
        <div className="fixed bottom-4 right-4 flex gap-2 z-50 flex-row-reverse">
          {/* Minimized cards will portal or render here if we extracted state, but for now they render fixed individually. 
              Since they all use fixed bottom-4 right-4, we'll let them stack or we can adjust the FoldMinimizeCard. 
              Actually, FoldMinimizeCard uses fixed bottom-4 right-4. If multiple are minimized, they overlap.
              Let's just use the FoldMinimizeCard for the sections. */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SSH Client */}
          <FoldMinimizeCard title="Terminal & SSH Client" icon={Terminal} defaultOpen={true}>
            <div className="flex flex-col h-[400px]">
              {!sshConnected && !sshConnecting ? (
                <div className="space-y-4 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-500 mb-1">Host</label>
                      <div className="relative">
                        <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input type="text" value={sshHost} onChange={e=>setSshHost(e.target.value)} placeholder="192.168.1.105" className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-zinc-100 focus:border-emerald-500/50 focus:outline-none" />
                      </div>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-zinc-500 mb-1">Port</label>
                      <input type="text" value={sshPort} onChange={e=>setSshPort(e.target.value)} placeholder="22" className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-zinc-100 focus:border-emerald-500/50 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Username</label>
                    <input type="text" value={sshUser} onChange={e=>setSshUser(e.target.value)} placeholder="root" className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-3 text-zinc-100 focus:border-emerald-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Password / Key</label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input type="password" value={sshPass} onChange={e=>setSshPass(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-zinc-100 focus:border-emerald-500/50 focus:outline-none" />
                    </div>
                  </div>
                  <button onClick={handleSshConnect} disabled={!sshHost || !sshUser} className="w-full py-2 mt-2 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Connect
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800">
                    <div className="text-xs text-emerald-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connected to {sshUser}@{sshHost}:{sshPort}
                    </div>
                    <button onClick={handleSshDisconnect} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded">
                      <Square className="w-3 h-3" /> Disconnect
                    </button>
                  </div>
                  <div className="flex-1 bg-black rounded-lg p-3 overflow-y-auto font-mono text-xs text-zinc-300 border border-zinc-800 mb-3">
                    {sshLogs.map((log, i) => (
                      <div key={i} className="mb-1">{log}</div>
                    ))}
                    {sshConnecting && <div className="animate-pulse">_</div>}
                    <div ref={sshLogEndRef} />
                  </div>
                  {sshConnected && (
                    <form onSubmit={handleSshCommand} className="flex gap-2">
                      <span className="text-emerald-500 py-2 text-sm">➜</span>
                      <input 
                        type="text" 
                        value={sshCommand} 
                        onChange={e=>setSshCommand(e.target.value)} 
                        placeholder="Enter command..." 
                        className="flex-1 bg-black border border-zinc-800 rounded-lg py-2 px-3 text-zinc-100 focus:border-emerald-500/50 focus:outline-none font-mono text-sm"
                        autoFocus
                      />
                    </form>
                  )}
                </div>
              )}
            </div>
          </FoldMinimizeCard>

          {/* Network Scanner */}
          <FoldMinimizeCard title="Network Scanner (Simulated)" icon={Wifi} defaultOpen={false}>
            <div className="flex flex-col h-[400px]">
              <div className="flex justify-end mb-4">
                <button
                  onClick={runNetworkScan}
                  disabled={scanning}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {scanning ? <Activity className="w-4 h-4 animate-pulse" /> : <Wifi className="w-4 h-4" />}
                  {scanning ? 'Scanning...' : 'Scan Local Network'}
                </button>
              </div>
              
              <div className="flex-1 bg-black rounded-xl p-4 overflow-y-auto border border-zinc-800 font-mono text-xs">
                {scanResults.length === 0 && !scanning ? (
                  <div className="text-zinc-600 h-full flex items-center justify-center">
                    Ready to initiate scan.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {scanResults.map((line, i) => (
                      <div key={i} className={(line || '').includes('Discovered') ? 'text-emerald-400' : 'text-zinc-400'}>
                        {line}
                      </div>
                    ))}
                    {scanning && (
                      <div className="text-emerald-500 animate-pulse">_</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </FoldMinimizeCard>

          {/* Password Tester */}
          <FoldMinimizeCard title="Password Strength Analyzer" icon={Lock} defaultOpen={false}>
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to test..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
              />
              
              {password && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Strength:</span>
                    <span className={`text-sm font-bold ${strengthColors[strengthScore]}`}>
                      {strengthLabels[strengthScore]}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${strengthScore > 0 ? strengthColors[strengthScore].replace('text-', 'bg-') : 'bg-transparent'}`}
                      style={{ width: `${(strengthScore / 5) * 100}%` }}
                    />
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1 mt-4">
                    <li className="flex items-center gap-2">
                      {password.length > 8 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                      More than 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      {/[A-Z]/.test(password) ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                      Contains uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      {/[0-9]/.test(password) ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                      Contains number
                    </li>
                    <li className="flex items-center gap-2">
                      {/[^A-Za-z0-9]/.test(password) ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                      Contains special character
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </FoldMinimizeCard>

        </div>

        {/* AI Code Analyzer */}
        <FoldMinimizeCard title="AI Code Analyzer" icon={FileCode} defaultOpen={true}>
          <div className="flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {suggestedCode && (
                  <div className="flex bg-zinc-800 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'summary' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <FileText className="w-4 h-4" /> Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('diff')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'diff' ? 'bg-zinc-700 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <SplitSquareHorizontal className="w-4 h-4" /> Diff View
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                  title="Custom Rules & Priorities"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.html,.css"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-bold rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {codeFile ? codeFile.name : 'Select File'}
                </button>
                <button
                  onClick={analyzeCode}
                  disabled={!codeFile || analyzingCode}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {analyzingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  {analyzingCode ? 'Analyzing...' : 'Analyze Code'}
                </button>
              </div>
            </div>
            
            {showSettings && (
              <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded-xl p-4 transition-all">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Custom Rules & Priorities
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="e.g., Focus on OWASP Top 10, prefer functional programming style, optimize for memory usage..."
                  className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
            )}

            <div className="flex-1 bg-zinc-950 rounded-xl p-6 overflow-y-auto border border-zinc-800 font-sans text-sm">
              {!codeFile && !codeAnalysisSummary && !analyzingCode && (
                <div className="text-zinc-400 h-full flex flex-col items-center justify-center gap-4">
                  <FileCode className="w-12 h-12 text-zinc-700" />
                  <p>Upload a source code file to analyze for vulnerabilities, style issues, and performance.</p>
                </div>
              )}
              
              {analyzingCode && (
                <div className="text-zinc-400 h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p>Analyzing {codeFile?.name} using Gemini AI...</p>
                </div>
              )}

              {codeAnalysisSummary && activeTab === 'summary' && (
                <div className="prose prose-zinc prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{codeAnalysisSummary}</div>
                </div>
              )}

              {suggestedCode && activeTab === 'diff' && (
                <div className="rounded-lg overflow-hidden border border-zinc-800">
                  <ReactDiffViewer
                    oldValue={originalCode || ''}
                    newValue={suggestedCode}
                    splitView={true}
                    useDarkTheme={true}
                    leftTitle="Original Code"
                    rightTitle="Suggested Fixes"
                    styles={{
                      variables: {
                        dark: {
                          diffViewerBackground: '#09090b',
                          diffViewerColor: '#e4e4e7',
                          addedBackground: '#064e3b',
                          addedColor: '#a7f3d0',
                          removedBackground: '#7f1d1d',
                          removedColor: '#fecaca',
                          wordAddedBackground: '#047857',
                          wordRemovedBackground: '#b91c1c',
                          addedGutterBackground: '#064e3b',
                          removedGutterBackground: '#7f1d1d',
                          gutterBackground: '#18181b',
                          gutterBackgroundDark: '#18181b',
                          highlightBackground: '#27272a',
                          highlightGutterBackground: '#27272a',
                          codeFoldGutterBackground: '#18181b',
                          codeFoldBackground: '#18181b',
                          emptyLineBackground: '#09090b',
                          gutterColor: '#71717a',
                          addedGutterColor: '#a7f3d0',
                          removedGutterColor: '#fecaca',
                          codeFoldContentColor: '#71717a',
                          diffViewerTitleBackground: '#18181b',
                          diffViewerTitleColor: '#e4e4e7',
                          diffViewerTitleBorderColor: '#27272a'
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </FoldMinimizeCard>

      </div>
    </div>
  );
}

