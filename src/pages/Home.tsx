import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { Terminal, Image as ImageIcon, Mic, Video as VideoIcon, Sparkles, Activity, ShieldCheck, Loader2, Shield, Wrench, Bot, Globe, Brain, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';
import { callSecureApi } from '../lib/api';

export default function Home() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  const handleTestApi = async () => {
    setTestingApi(true);
    setApiStatus(null);
    try {
      const result = await callSecureApi('system_check', { timestamp: Date.now() });
      setApiStatus(`Success: ${result.message}`);
    } catch (error: any) {
      setApiStatus(`Error: ${error.message}`);
    } finally {
      setTestingApi(false);
    }
  };

  const modules = [
    { title: 'Command Center', icon: Terminal, to: '/command', desc: 'Universal AI terminal and execution engine', color: 'text-emerald-600 text-emerald-400', bg: 'bg-emerald-50 bg-emerald-500/10 border-emerald-200 border-emerald-500/20' },
    { title: 'Intelligence Core', icon: Brain, to: '/intelligence', desc: 'Advanced reasoning and real-time search', color: 'text-purple-600 text-purple-400', bg: 'bg-purple-50 bg-purple-500/10 border-purple-200 border-purple-500/20' },
    { title: 'Network', icon: Globe, to: '/network', desc: 'VPN, Secure DNS, and Routing', color: 'text-blue-600 text-blue-400', bg: 'bg-blue-50 bg-blue-500/10 border-blue-200 border-blue-500/20' },
    { title: 'The Forge', icon: Wrench, to: '/builder', desc: 'AI App Builder and Plugin Generator', color: 'text-indigo-600 text-indigo-400', bg: 'bg-indigo-50 bg-indigo-500/10 border-indigo-200 border-indigo-500/20' },
    { title: 'Cyber Lab', icon: Shield, to: '/cyber', desc: 'Cybersecurity learning and testing environment', color: 'text-red-600 text-red-400', bg: 'bg-red-50 bg-red-500/10 border-red-200 border-red-500/20' },
    { title: 'Pentest Lab', icon: Crosshair, to: '/pentest', desc: '30+ integrated security tools and IDEs', color: 'text-rose-600 text-rose-400', bg: 'bg-rose-50 bg-rose-500/10 border-rose-200 border-rose-500/20' },
    { title: 'Agent Swarm', icon: Bot, to: '/agents', desc: 'Multi-agent system for complex tasks', color: 'text-teal-600 text-teal-400', bg: 'bg-teal-50 bg-teal-500/10 border-teal-200 border-teal-500/20' },
    { title: 'Vision Matrix', icon: ImageIcon, to: '/vision', desc: 'Generate, edit, and analyze images', color: 'text-blue-600 text-blue-400', bg: 'bg-blue-50 bg-blue-500/10 border-blue-200 border-blue-500/20' },
    { title: 'Audio Core', icon: Mic, to: '/audio', desc: 'Real-time voice interaction and transcription', color: 'text-purple-600 text-purple-400', bg: 'bg-purple-50 bg-purple-500/10 border-purple-200 border-purple-500/20' },
    { title: 'Video Forge', icon: VideoIcon, to: '/video', desc: 'Prompt-based video generation', color: 'text-orange-600 text-orange-400', bg: 'bg-orange-50 bg-orange-500/10 border-orange-200 border-orange-500/20' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 font-mono bg-black text-zinc-100">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tighter text-zinc-100 mb-2">NullMatrix OS v2.4.1</h1>
        <p className="text-zinc-600 text-zinc-400">Welcome back, {user?.displayName?.split(' ')[0] || 'Agent'}. All systems are online and ready.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {modules.map((mod) => (
          <Link
            key={mod.to}
            to={mod.to}
            className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${mod.bg} backdrop-blur-sm`}
          >
            <mod.icon className={`w-8 h-8 mb-4 ${mod.color}`} />
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">{mod.title}</h2>
            <p className="text-sm text-zinc-600 text-zinc-400 leading-relaxed">{mod.desc}</p>
          </Link>
        ))}
      </div>

      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-emerald-600 text-emerald-400" />
          <h2 className="text-xl font-semibold text-zinc-900 text-zinc-100">System Status</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-black rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-zinc-700 text-zinc-300">Gemini 3.1 Pro</span>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 bg-emerald-400/10 px-2 py-1 rounded-md">ONLINE</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-black rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-4 h-4 text-blue-600 text-blue-400" />
              <span className="text-sm text-zinc-700 text-zinc-300">Nano Banana Pro</span>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 bg-emerald-400/10 px-2 py-1 rounded-md">ONLINE</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-black rounded-xl border border-zinc-200 border-zinc-800">
            <div className="flex items-center gap-3">
              <VideoIcon className="w-4 h-4 text-orange-600 text-orange-400" />
              <span className="text-sm text-zinc-700 text-zinc-300">Veo 3.1 Fast</span>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded-md">ONLINE</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200 border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-zinc-900 text-zinc-100">Secure API Gateway</h3>
            </div>
            <button
              onClick={handleTestApi}
              disabled={testingApi}
              className="px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {testingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {testingApi ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          {apiStatus && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${apiStatus.startsWith('Success') ? 'bg-emerald-50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 border-emerald-500/20' : 'bg-red-50 bg-red-500/10 text-red-700 text-red-400 border border-red-200 border-red-500/20'}`}>
              {apiStatus}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
