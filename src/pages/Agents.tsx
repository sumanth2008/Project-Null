import { useState, useEffect, useRef } from 'react';
import { 
  Bot, Shield, Code, Search, Palette, Activity, Zap, Power, 
  Settings, MessageSquare, ListTodo, CheckCircle2, XCircle, 
  Clock, Loader2, Send, Trash2, ChevronRight,
  Eye, Server, Radar, TrendingUp, Network
} from 'lucide-react';

type AgentStatus = 'offline' | 'online' | 'busy';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  status: TaskStatus;
  progress: number;
}

interface Agent {
  id: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  desc: string;
  status: AgentStatus;
  capabilities: string[];
  settings: Record<string, any>;
  settingsSchema: { key: string; label: string; type: 'text' | 'select' | 'boolean' | 'number'; options?: string[] }[];
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'coder', name: 'Coding Agent', icon: Code, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Writes, reviews, and optimizes code.', status: 'offline',
    capabilities: ['React', 'TypeScript', 'Python', 'Node.js'],
    settings: { language: 'TypeScript', strictMode: true },
    settingsSchema: [
      { key: 'language', label: 'Preferred Language', type: 'select', options: ['TypeScript', 'Python', 'Rust', 'Go'] },
      { key: 'strictMode', label: 'Strict Mode', type: 'boolean' }
    ]
  },
  {
    id: 'security', name: 'Security Agent', icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Monitors vulnerabilities and enforces secure practices.', status: 'offline',
    capabilities: ['Static Analysis', 'Dependency Check', 'Network Scan'],
    settings: { intensity: 'High', autoFix: false },
    settingsSchema: [
      { key: 'intensity', label: 'Scan Intensity', type: 'select', options: ['Low', 'Medium', 'High', 'Paranoid'] },
      { key: 'autoFix', label: 'Auto-Fix Vulnerabilities', type: 'boolean' }
    ]
  },
  {
    id: 'automation', name: 'Automation Agent', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', desc: 'Handles repetitive tasks and internet workflows.', status: 'offline',
    capabilities: ['Web Scraping', 'API Integration', 'Cron Jobs'],
    settings: { trigger: 'Manual', maxRetries: 3 },
    settingsSchema: [
      { key: 'trigger', label: 'Default Trigger', type: 'select', options: ['Manual', 'On Commit', 'Scheduled'] },
      { key: 'maxRetries', label: 'Max Retries', type: 'number' }
    ]
  },
  {
    id: 'research', name: 'Research Agent', icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Gathers data and synthesizes information from the web.', status: 'offline',
    capabilities: ['Data Mining', 'Summarization', 'Fact Checking'],
    settings: { sources: 'Academic', depth: 'Comprehensive' },
    settingsSchema: [
      { key: 'sources', label: 'Preferred Sources', type: 'select', options: ['General Web', 'Academic', 'News', 'Social Media'] },
      { key: 'depth', label: 'Research Depth', type: 'select', options: ['Quick Summary', 'Standard', 'Comprehensive'] }
    ]
  },
  {
    id: 'design', name: 'UI Design Agent', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Generates layouts and styling recommendations.', status: 'offline',
    capabilities: ['Wireframing', 'Color Theory', 'Accessibility'],
    settings: { theme: 'Dark', framework: 'Tailwind CSS' },
    settingsSchema: [
      { key: 'theme', label: 'Default Theme', type: 'select', options: ['Light', 'Dark', 'System'] },
      { key: 'framework', label: 'CSS Framework', type: 'select', options: ['Tailwind CSS', 'CSS Modules', 'Styled Components'] }
    ]
  },
  {
    id: 'osint', name: 'OSINT Gatherer', icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-500/10', desc: 'Collects open-source intelligence from public records and social media.', status: 'offline',
    capabilities: ['Social Media', 'Public Records', 'Dark Web'],
    settings: { scope: 'Global', stealthMode: true },
    settingsSchema: [
      { key: 'scope', label: 'Search Scope', type: 'select', options: ['Local', 'National', 'Global'] },
      { key: 'stealthMode', label: 'Stealth Mode', type: 'boolean' }
    ]
  },
  {
    id: 'devops', name: 'DevOps Automator', icon: Server, color: 'text-cyan-500', bg: 'bg-cyan-500/10', desc: 'Manages infrastructure, deployments, and CI/CD pipelines.', status: 'offline',
    capabilities: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
    settings: { environment: 'Production', autoDeploy: false },
    settingsSchema: [
      { key: 'environment', label: 'Target Environment', type: 'select', options: ['Development', 'Staging', 'Production'] },
      { key: 'autoDeploy', label: 'Auto-Deploy on Success', type: 'boolean' }
    ]
  },
  {
    id: 'threat_intel', name: 'Threat Intel Analyst', icon: Radar, color: 'text-rose-500', bg: 'bg-rose-500/10', desc: 'Analyzes emerging threats, malware signatures, and zero-days.', status: 'offline',
    capabilities: ['Malware Analysis', 'CVE Tracking', 'Log Parsing'],
    settings: { alertLevel: 'Critical', feedSource: 'Multiple' },
    settingsSchema: [
      { key: 'alertLevel', label: 'Minimum Alert Level', type: 'select', options: ['Info', 'Warning', 'Critical'] },
      { key: 'feedSource', label: 'Intelligence Feed', type: 'select', options: ['Open Source', 'Commercial', 'Multiple'] }
    ]
  },
  {
    id: 'crypto', name: 'Crypto Tracker', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Monitors blockchain transactions, wallets, and market anomalies.', status: 'offline',
    capabilities: ['Wallet Tracking', 'Smart Contract Audit', 'Market Analysis'],
    settings: { network: 'Ethereum', threshold: 10000 },
    settingsSchema: [
      { key: 'network', label: 'Blockchain Network', type: 'select', options: ['Ethereum', 'Bitcoin', 'Solana', 'Polygon'] },
      { key: 'threshold', label: 'Alert Threshold (USD)', type: 'number' }
    ]
  },
  {
    id: 'network_mapper', name: 'Network Mapper', icon: Network, color: 'text-sky-500', bg: 'bg-sky-500/10', desc: 'Discovers devices, maps topologies, and identifies open ports.', status: 'offline',
    capabilities: ['Topology Mapping', 'Port Scanning', 'Device Fingerprinting'],
    settings: { scanSpeed: 'Normal', aggressive: false },
    settingsSchema: [
      { key: 'scanSpeed', label: 'Scan Speed', type: 'select', options: ['Sneaky', 'Normal', 'Aggressive', 'Insane'] },
      { key: 'aggressive', label: 'Aggressive OS Detection', type: 'boolean' }
    ]
  }
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'interact' | 'tasks' | 'settings'>('interact');
  const [interactions, setInteractions] = useState<Record<string, {role: string, text: string}[]>>({});
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll interactions
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions, selectedAgentId, activeTab]);

  // Task processing simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        let changed = false;
        const newTasks = prevTasks.map(task => {
          if (task.status === 'in_progress') {
            changed = true;
            const newProgress = Math.min(task.progress + Math.floor(Math.random() * 10) + 5, 100);
            if (newProgress === 100) {
              return { ...task, progress: 100, status: 'completed' as TaskStatus };
            }
            return { ...task, progress: newProgress };
          }
          if (task.status === 'pending') {
            const agent = agents.find(a => a.id === task.agentId);
            const activeTasks = prevTasks.filter(t => t.agentId === task.agentId && t.status === 'in_progress');
            if (agent && agent.status !== 'offline' && activeTasks.length === 0) {
               changed = true;
               return { ...task, status: 'in_progress' as TaskStatus };
            }
          }
          return task;
        });
        return changed ? newTasks : prevTasks;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [agents]);

  // Sync agent status based on tasks
  useEffect(() => {
    setAgents(prevAgents => {
      let changed = false;
      const newAgents = prevAgents.map(agent => {
        if (agent.status === 'offline') return agent;
        const activeTasks = tasks.filter(t => t.agentId === agent.id && t.status === 'in_progress');
        const newStatus: AgentStatus = activeTasks.length > 0 ? 'busy' : 'online';
        if (agent.status !== newStatus) {
          changed = true;
          return { ...agent, status: newStatus };
        }
        return agent;
      });
      return changed ? newAgents : prevAgents;
    });
  }, [tasks]);

  const toggleAgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        const newStatus: AgentStatus = a.status === 'offline' ? 'online' : 'offline';
        // If turning offline, fail active tasks
        if (newStatus === 'offline') {
          setTasks(pt => pt.map(t => t.agentId === id && (t.status === 'in_progress' || t.status === 'pending') ? { ...t, status: 'failed' as TaskStatus } : t));
        }
        return { ...a, status: newStatus };
      }
      return a;
    }));
  };

  const updateSetting = (agentId: string, key: string, value: any) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return { ...a, settings: { ...a.settings, [key]: value } };
      }
      return a;
    }));
  };

  const handleInteract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgentId) return;
    
    const agent = agents.find(a => a.id === selectedAgentId);
    if (agent?.status === 'offline') return;

    const newMsg = { role: 'user', text: input };
    setInteractions(prev => ({
      ...prev,
      [selectedAgentId]: [...(prev[selectedAgentId] || []), newMsg]
    }));
    
    const currentInput = input;
    setInput('');

    // Simulate response or task creation
    setTimeout(() => {
      if (currentInput.toLowerCase().startsWith('/task ')) {
         const taskDesc = currentInput.slice(6);
         const newTask: AgentTask = { id: generateId(), agentId: selectedAgentId, description: taskDesc, status: 'pending', progress: 0 };
         setTasks(prev => [...prev, newTask]);
         setInteractions(prev => ({
           ...prev,
           [selectedAgentId]: [...(prev[selectedAgentId] || []), { role: 'agent', text: `Task accepted: "${taskDesc}". Queued for execution.` }]
         }));
      } else {
         setInteractions(prev => ({
           ...prev,
           [selectedAgentId]: [...(prev[selectedAgentId] || []), { role: 'agent', text: `Acknowledged. Processing your request based on current settings (${JSON.stringify(agent?.settings)}).` }]
         }));
      }
    }, 600);
  };

  const cancelTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed' as TaskStatus } : t));
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const agentTasks = tasks.filter(t => t.agentId === selectedAgentId);
  const onlineCount = agents.filter(a => a.status !== 'offline').length;

  const StatusIndicator = ({ status }: { status: AgentStatus }) => {
    if (status === 'online') return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />;
    if (status === 'busy') return <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />;
    return <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 bg-zinc-600" />;
  };

  const TaskStatusBadge = ({ status }: { status: TaskStatus }) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded"><Clock className="w-3 h-3"/> Pending</span>;
      case 'in_progress': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-600 bg-orange-100 text-orange-400 bg-orange-500/20 px-2 py-1 rounded"><Activity className="w-3 h-3 animate-pulse"/> In Progress</span>;
      case 'completed': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> Completed</span>;
      case 'failed': return <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-100 text-red-400 bg-red-500/20 px-2 py-1 rounded"><XCircle className="w-3 h-3"/> Failed</span>;
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-hidden transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center z-10 shrink-0">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Bot className="w-5 h-5 text-teal-600 text-teal-400" /> Agent Swarm Dashboard
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-100 bg-teal-500/20 text-teal-700 text-teal-400 border border-teal-200 border-teal-500/30">
          <Activity className="w-3 h-3 animate-pulse" /> {onlineCount} / {agents.length} Online
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Agent List */}
        <div className="w-full lg:w-1/3 border-r border-zinc-800 bg-zinc-900/30 overflow-y-auto p-4 space-y-3">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedAgentId === agent.id ? 'border-teal-500 bg-teal-50 bg-teal-500/10 shadow-sm' : 'border-zinc-200 border-zinc-800 hover:border-zinc-300 hover:border-zinc-700 bg-zinc-900/50 bg-zinc-900/50'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${agent.status !== 'offline' ? agent.bg : 'bg-zinc-200 bg-zinc-800'}`}>
                    <agent.icon className={`w-5 h-5 ${agent.status !== 'offline' ? agent.color : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIndicator status={agent.status} />
                      <span className="text-xs text-zinc-500 capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleAgent(agent.id, e)} 
                  className={`p-2 rounded-full transition-colors ${agent.status !== 'offline' ? 'bg-emerald-100 text-emerald-600 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-200 hover:bg-emerald-500/30' : 'bg-zinc-200 text-zinc-500 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:bg-zinc-700'}`}
                  title={agent.status !== 'offline' ? 'Power Off' : 'Power On'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.capabilities.map(cap => (
                  <span key={cap} className={`text-[10px] px-2 py-0.5 rounded-full ${agent.status !== 'offline' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 text-zinc-300' : 'bg-zinc-900 text-zinc-400 text-zinc-600'}`}>
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel: Agent Details */}
        <div className="w-full lg:w-2/3 bg-black flex flex-col overflow-hidden">
          {!selectedAgent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-zinc-600 p-8 text-center">
              <Bot className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-bold mb-2 text-zinc-500">No Agent Selected</h2>
              <p className="max-w-md">Select an agent from the swarm on the left to view its status, configure settings, assign tasks, or interact directly.</p>
            </div>
          ) : (
            <>
              {/* Agent Header */}
              <div className="p-6 border-b border-zinc-200 border-zinc-800 bg-zinc-900/50 bg-zinc-900/50 shrink-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${selectedAgent.status !== 'offline' ? selectedAgent.bg : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                    <selectedAgent.icon className={`w-8 h-8 ${selectedAgent.status !== 'offline' ? selectedAgent.color : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 text-zinc-100">{selectedAgent.name}</h2>
                    <p className="text-sm text-zinc-500 text-zinc-400">{selectedAgent.desc}</p>
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 border-b border-zinc-200 border-zinc-800">
                  {[
                    { id: 'interact', icon: MessageSquare, label: 'Interact' },
                    { id: 'tasks', icon: ListTodo, label: `Tasks (${agentTasks.length})` },
                    { id: 'settings', icon: Settings, label: 'Settings' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-teal-500 text-teal-600 text-teal-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:text-zinc-300'}`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {selectedAgent.status === 'offline' && activeTab !== 'settings' && (
                  <div className="absolute inset-0 z-10 bg-zinc-50/80 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Power className="w-12 h-12 text-zinc-400 mb-4" />
                    <p className="text-zinc-500 font-semibold">Agent is currently offline.</p>
                    <button onClick={(e) => toggleAgent(selectedAgent.id, e)} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors">
                      Power On Agent
                    </button>
                  </div>
                )}

                {activeTab === 'interact' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {(interactions[selectedAgent.id] || []).length === 0 ? (
                        <div className="text-center text-zinc-400 dark:text-zinc-600 mt-10">
                          <p>Connection established. Ready for input.</p>
                          <p className="text-xs mt-2">Tip: Start a message with "/task " to assign a tracked task.</p>
                        </div>
                      ) : (
                        (interactions[selectedAgent.id] || []).map((msg, i) => (
                          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'agent' && (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedAgent.bg}`}>
                                <selectedAgent.icon className={`w-4 h-4 ${selectedAgent.color}`} />
                              </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-300 text-zinc-200'}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleInteract} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 shrink-0">
                      <div className="relative">
                        <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          placeholder={`Command ${selectedAgent.name} or type /task [description]...`}
                          className="w-full bg-zinc-100 bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-12 text-zinc-900 text-zinc-100 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50"
                        />
                        <button type="submit" disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-100 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-200 hover:bg-teal-500/30 disabled:opacity-50 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {agentTasks.length === 0 ? (
                      <div className="text-center text-zinc-400 dark:text-zinc-600 mt-10">
                        <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No tasks assigned to this agent.</p>
                      </div>
                    ) : (
                      agentTasks.map(task => (
                        <div key={task.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{task.description}</h4>
                            <TaskStatusBadge status={task.status} />
                          </div>
                          
                          <div className="relative h-2 bg-zinc-100 bg-zinc-950 rounded-full overflow-hidden mb-3 border border-zinc-200 dark:border-zinc-800">
                            <div 
                              className={`absolute top-0 left-0 h-full transition-all duration-500 ${task.status === 'failed' ? 'bg-red-500' : task.status === 'completed' ? 'bg-emerald-500' : 'bg-teal-500'}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-500 font-bold">{task.progress}% Complete</span>
                            {(task.status === 'pending' || task.status === 'in_progress') ? (
                              <button onClick={() => cancelTask(task.id)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-semibold">
                                <XCircle className="w-3 h-3" /> Cancel Task
                              </button>
                            ) : (
                              <button onClick={() => removeTask(task.id)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 font-semibold">
                                <Trash2 className="w-3 h-3" /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-zinc-500" /> Configuration Parameters
                      </h3>
                      
                      {selectedAgent.settingsSchema.map(schema => (
                        <div key={schema.key} className="space-y-2">
                          <label className="block text-sm font-semibold text-zinc-700 text-zinc-300">
                            {schema.label}
                          </label>
                          
                          {schema.type === 'select' && (
                            <select 
                              value={selectedAgent.settings[schema.key]} 
                              onChange={e => updateSetting(selectedAgent.id, schema.key, e.target.value)}
                              className="w-full bg-zinc-50 bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-500/50"
                            >
                              {schema.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          
                          {schema.type === 'boolean' && (
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input 
                                  type="checkbox" 
                                  className="sr-only"
                                  checked={selectedAgent.settings[schema.key]}
                                  onChange={e => updateSetting(selectedAgent.id, schema.key, e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${selectedAgent.settings[schema.key] ? 'bg-teal-500' : 'bg-zinc-300 bg-zinc-700'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${selectedAgent.settings[schema.key] ? 'translate-x-4' : ''}`}></div>
                              </div>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {selectedAgent.settings[schema.key] ? 'Enabled' : 'Disabled'}
                              </span>
                            </label>
                          )}
                          
                          {schema.type === 'number' && (
                            <input 
                              type="number" 
                              value={selectedAgent.settings[schema.key]} 
                              onChange={e => updateSetting(selectedAgent.id, schema.key, parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-500/50"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
