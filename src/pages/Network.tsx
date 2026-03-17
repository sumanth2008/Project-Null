import React, { useState, useEffect } from 'react';
import { Shield, Globe, Server, Activity, Lock, Wifi, MapPin, Zap, RefreshCw, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ServerLocation {
  id: string;
  name: string;
  country: string;
  ping: number;
  load: number;
  status: 'online' | 'offline';
  isFavorite: boolean;
  lat?: number;
  lng?: number;
}

const MOCK_SERVERS: ServerLocation[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', country: 'USA', ping: 45, load: 32, status: 'online', isFavorite: true, lat: 39.0438, lng: -77.4874 },
  { id: 'us-west-1', name: 'US West (N. California)', country: 'USA', ping: 85, load: 68, status: 'online', isFavorite: false, lat: 37.3382, lng: -121.8863 },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)', country: 'Germany', ping: 120, load: 45, status: 'online', isFavorite: true, lat: 50.1109, lng: 8.6821 },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', country: 'Japan', ping: 180, load: 89, status: 'online', isFavorite: false, lat: 35.6895, lng: 139.6917 },
  { id: 'sa-east-1', name: 'South America (São Paulo)', country: 'Brazil', ping: 150, load: 25, status: 'online', isFavorite: false, lat: -23.5505, lng: -46.6333 },
];

const DNS_PROVIDERS = [
  { id: 'cloudflare', name: 'Cloudflare (1.1.1.1)', desc: 'Privacy-first, fast DNS', ip: '1.1.1.1' },
  { id: 'google', name: 'Google Public DNS', desc: 'Reliable, global DNS', ip: '8.8.8.8' },
  { id: 'quad9', name: 'Quad9 (9.9.9.9)', desc: 'Security-focused DNS', ip: '9.9.9.9' },
  { id: 'custom', name: 'Custom DNS', desc: 'Enter your own DNS server', ip: '' },
];

export default function Network() {
  const [vpnActive, setVpnActive] = useState(false);
  const [killSwitch, setKillSwitch] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [selectedServer, setSelectedServer] = useState<ServerLocation>(MOCK_SERVERS[0]);
  const [servers, setServers] = useState<ServerLocation[]>(MOCK_SERVERS);
  const [activeDns, setActiveDns] = useState(DNS_PROVIDERS[0].id);
  const [customDnsIp, setCustomDnsIp] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [mapData, setMapData] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // Use Gemini with Google Maps grounding to fetch real-world server context
  const fetchMapContext = async () => {
    setLoadingMap(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Find major data center locations in Europe and North America.',
        config: {
          tools: [{ googleMaps: {} }],
        },
      });
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setMapData(chunks);
      }
    } catch (error) {
      console.error('Error fetching map context:', error);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    fetchMapContext();
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setVpnActive(!vpnActive);
      setIsConnecting(false);
    }, 1500);
  };

  const toggleFavorite = (id: string) => {
    setServers(servers.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 font-mono bg-black text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tighter mb-2 flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600 text-blue-400" />
          Network Routing & Security
        </h1>
        <p className="text-zinc-600 text-zinc-400">Manage VPN, secure DNS, and network privacy settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: VPN Controls & DNS */}
        <div className="lg:col-span-1 space-y-8">
          {/* VPN Connection Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 text-emerald-400" />
                VPN Status
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${vpnActive ? 'bg-emerald-100 text-emerald-700 bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600 bg-zinc-800 text-zinc-400'}`}>
                {vpnActive ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-8">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isConnecting ? 'bg-zinc-800 animate-pulse' :
                  vpnActive ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                <Lock className={`w-12 h-12 ${vpnActive ? 'text-white' : 'text-white'}`} />
              </button>
              <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                {isConnecting ? 'Establishing secure tunnel...' : vpnActive ? `Connected to ${selectedServer.name}` : 'Click to connect'}
              </p>
            </div>

            <div className="space-y-4 mt-4 pt-6 border-t border-zinc-100 border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">Kill Switch</span>
                </div>
                <button 
                  onClick={() => setKillSwitch(!killSwitch)}
                  className={`w-10 h-5 rounded-full transition-colors ${killSwitch ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-zinc-900 rounded-full transform transition-transform ${killSwitch ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">Auto-connect on unsafe Wi-Fi</span>
                </div>
                <button 
                  onClick={() => setAutoConnect(!autoConnect)}
                  className={`w-10 h-5 rounded-full transition-colors ${autoConnect ? 'bg-emerald-500' : 'bg-zinc-300 bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${autoConnect ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Secure DNS Management */}
          <div className="bg-white bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-blue-600 text-blue-400" />
              Secure DNS
            </h2>
            <div className="space-y-3">
              {DNS_PROVIDERS.map(provider => (
                <div 
                  key={provider.id}
                  onClick={() => setActiveDns(provider.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${activeDns === provider.id ? 'border-blue-500 bg-blue-50 bg-blue-500/10' : 'border-zinc-200 border-zinc-800 hover:border-blue-300 hover:border-blue-700'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{provider.name}</span>
                    {activeDns === provider.id && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{provider.desc}</p>
                  
                  {provider.id === 'custom' && activeDns === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g., 1.1.1.1"
                      value={customDnsIp}
                      onChange={(e) => setCustomDnsIp(e.target.value)}
                      className="mt-3 w-full bg-white bg-black border border-zinc-300 border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Smart Server Selection & Map */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 border-zinc-800 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Smart Server Selection
              </h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search regions..." 
                  className="pl-9 pr-4 py-2 bg-zinc-100 bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            {/* Simulated Map Area */}
            <div className="relative w-full h-64 bg-zinc-100 bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 overflow-hidden flex items-center justify-center">
              {/* This is a placeholder for a real map. We use a stylized representation. */}
              <div className="absolute inset-0 opacity-20 opacity-10" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {servers.map((server) => (
                <div 
                  key={server.id}
                  className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 ${selectedServer.id === server.id ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10' : 'bg-zinc-400 bg-zinc-600'}`}
                  style={{ 
                    left: `${((server.lng || 0) + 180) * (100 / 360)}%`, 
                    top: `${((server.lat || 0) * -1 + 90) * (100 / 180)}%` 
                  }}
                  onClick={() => setSelectedServer(server)}
                  title={server.name}
                >
                  {selectedServer.id === server.id && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                      {server.name}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="absolute bottom-4 left-4 bg-zinc-900/80 backdrop-blur-sm p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Auto-select fastest server</span>
              </div>
            </div>

            {/* Server List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {servers.map(server => (
                <div 
                  key={server.id}
                  onClick={() => setSelectedServer(server)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedServer.id === server.id ? 'border-blue-500 bg-blue-50 bg-blue-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700'}`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(server.id); }}
                      className="text-zinc-400 hover:text-yellow-500 transition-colors"
                    >
                      <svg className={`w-5 h-5 ${server.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <div>
                      <div className="font-semibold text-sm">{server.name}</div>
                      <div className="text-xs text-zinc-500">{server.country}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-zinc-500">Ping</span>
                      <span className={`text-sm font-semibold ${server.ping < 100 ? 'text-emerald-500' : server.ping < 150 ? 'text-yellow-500' : 'text-red-500'}`}>{server.ping} ms</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-zinc-500">Load</span>
                      <div className="w-16 h-2 bg-zinc-200 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${server.load < 50 ? 'bg-emerald-500' : server.load < 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${server.load}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grounding Data Display (Optional, to show Gemini Maps integration) */}
            {mapData && mapData.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 bg-blue-900/20 border border-blue-200 border-blue-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-800 text-blue-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Real-World Data Centers (via Gemini Maps Grounding)
                </h3>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  {mapData.slice(0, 3).map((chunk: any, i: number) => (
                    <li key={i} className="truncate">
                      <a href={chunk.maps?.uri} target="_blank" rel="noreferrer" className="hover:underline">
                        {chunk.maps?.title || 'Data Center Location'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
