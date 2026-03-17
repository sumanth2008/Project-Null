import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { logOut } from '../lib/firebase';
import { Terminal, Image as ImageIcon, Mic, Video as VideoIcon, LogOut, LayoutDashboard, Sun, Moon, Shield, Wrench, Bot, User, ListTodo, Globe, Brain, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/command', icon: Terminal, label: 'Command Center' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    { to: '/intelligence', icon: Brain, label: 'Intelligence Core' },
    { to: '/vision', icon: ImageIcon, label: 'Vision Matrix' },
    { to: '/audio', icon: Mic, label: 'Audio Core' },
    { to: '/video', icon: VideoIcon, label: 'Video Forge' },
    { to: '/cyber', icon: Shield, label: 'Cyber Lab' },
    { to: '/pentest', icon: Crosshair, label: 'Pentest Lab' },
    { to: '/network', icon: Globe, label: 'Network' },
    { to: '/builder', icon: Wrench, label: 'The Forge' },
    { to: '/agents', icon: Bot, label: 'Agent Swarm' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-mono transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-black flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tighter text-emerald-400 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            NULLMATRIX OS
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-emerald-100 bg-emerald-500/10 text-emerald-700 text-emerald-400 border border-emerald-200 border-emerald-500/20' 
                    : 'text-zinc-600 text-zinc-400 hover:text-zinc-100 hover:text-zinc-100 hover:bg-zinc-900 hover:bg-zinc-800'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                {user?.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium truncate">{user?.displayName || 'Agent'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logOut}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none" />
        <Outlet />
      </main>
    </div>
  );
}
