import { useState, useRef } from 'react';
import { Shield, Lock, Wifi, Activity, AlertTriangle, CheckCircle2, FileCode, Upload, Loader2, SplitSquareHorizontal, FileText, Settings } from 'lucide-react';
import { ai, MODELS } from '../lib/gemini';
import { Type } from '@google/genai';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useTheme } from '../components/ThemeContext';

export default function CyberLab() {
  const [password, setPassword] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);

  const [codeFile, setCodeFile] = useState<File | null>(null);
  const [originalCode, setOriginalCode] = useState<string | null>(null);
  const [analyzingCode, setAnalyzingCode] = useState(false);
  const [codeAnalysisSummary, setCodeAnalysisSummary] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'diff'>('summary');
  const [customRules, setCustomRules] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600 text-red-400" /> Cyber Lab
        </h1>
      </header>

      <div className="p-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Password Tester */}
        <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-blue-600 text-blue-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Password Strength Analyzer</h2>
          </div>
          
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to test..."
              className="w-full bg-black border border-zinc-200 border-zinc-800 rounded-xl p-3 text-zinc-900 text-zinc-100 focus:outline-none focus:border-blue-500/50"
            />
            
            {password && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500 text-zinc-400">Strength:</span>
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
                <ul className="text-xs text-zinc-500 text-zinc-400 space-y-1 mt-4">
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
        </div>

        {/* Network Scanner */}
        <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-200 border-zinc-800 rounded-2xl p-6 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-emerald-600 text-emerald-400" />
              <h2 className="text-lg font-semibold text-zinc-900 text-zinc-100">Network Scanner (Simulated)</h2>
            </div>
            <button
              onClick={runNetworkScan}
              disabled={scanning}
              className="px-4 py-2 bg-emerald-100 bg-emerald-500/20 text-emerald-700 text-emerald-400 text-sm font-bold rounded-lg hover:bg-emerald-200 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
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

        {/* AI Code Analyzer */}
        <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 border-zinc-800 rounded-2xl p-6 flex flex-col lg:col-span-2 min-h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-purple-600 text-purple-400" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">AI Code Analyzer</h2>
            </div>
            <div className="flex items-center gap-4">
              {suggestedCode && (
                <div className="flex bg-zinc-200 bg-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'summary' ? 'bg-white bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 hover:text-zinc-300'}`}
                  >
                    <FileText className="w-4 h-4" /> Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('diff')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'diff' ? 'bg-white bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <SplitSquareHorizontal className="w-4 h-4" /> Diff View
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-zinc-200 bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-200 hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
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
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 text-zinc-300 text-sm font-bold rounded-lg hover:bg-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {codeFile ? codeFile.name : 'Select File'}
              </button>
              <button
                onClick={analyzeCode}
                disabled={!codeFile || analyzingCode}
                className="px-4 py-2 bg-purple-100 bg-purple-500/20 text-purple-700 text-purple-400 text-sm font-bold rounded-lg hover:bg-purple-200 hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {analyzingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {analyzingCode ? 'Analyzing...' : 'Analyze Code'}
              </button>
            </div>
          </div>
          
          {showSettings && (
            <div className="mb-6 bg-zinc-50 bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 transition-all">
              <label className="block text-sm font-medium text-zinc-700 text-zinc-300 mb-2">
                Custom Rules & Priorities
              </label>
              <textarea
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                placeholder="e.g., Focus on OWASP Top 10, prefer functional programming style, optimize for memory usage..."
                className="w-full h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>
          )}

          <div className="flex-1 bg-zinc-50 bg-zinc-950 rounded-xl p-6 overflow-y-auto border border-zinc-200 dark:border-zinc-800 font-sans text-sm">
            {!codeFile && !codeAnalysisSummary && !analyzingCode && (
              <div className="text-zinc-500 dark:text-zinc-400 h-full flex flex-col items-center justify-center gap-4">
                <FileCode className="w-12 h-12 text-zinc-700" />
                <p>Upload a source code file to analyze for vulnerabilities, style issues, and performance.</p>
              </div>
            )}
            
            {analyzingCode && (
              <div className="text-zinc-500 dark:text-zinc-400 h-full flex flex-col items-center justify-center gap-4">
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
              <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <ReactDiffViewer
                  oldValue={originalCode || ''}
                  newValue={suggestedCode}
                  splitView={true}
                  useDarkTheme={theme === 'dark'}
                  leftTitle="Original Code"
                  rightTitle="Suggested Fixes"
                  styles={{
                    variables: {
                      dark: {
                        diffViewerBackground: '#09090b', // zinc-950
                        diffViewerColor: '#e4e4e7', // zinc-200
                        addedBackground: '#064e3b', // emerald-900
                        addedColor: '#a7f3d0', // emerald-200
                        removedBackground: '#7f1d1d', // red-900
                        removedColor: '#fecaca', // red-200
                        wordAddedBackground: '#047857', // emerald-700
                        wordRemovedBackground: '#b91c1c', // red-700
                        addedGutterBackground: '#064e3b',
                        removedGutterBackground: '#7f1d1d',
                        gutterBackground: '#18181b', // zinc-900
                        gutterBackgroundDark: '#18181b',
                        highlightBackground: '#27272a', // zinc-800
                        highlightGutterBackground: '#27272a',
                        codeFoldGutterBackground: '#18181b',
                        codeFoldBackground: '#18181b',
                        emptyLineBackground: '#09090b',
                        gutterColor: '#71717a', // zinc-500
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

      </div>
    </div>
  );
}
