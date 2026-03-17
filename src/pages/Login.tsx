import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import { Terminal } from 'lucide-react';

export default function Login() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-zinc-100 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1)_0%,_transparent_50%)]" />
      
      <div className="z-10 w-full max-w-md p-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 bg-emerald-500/10 border border-emerald-200 border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Terminal className="w-8 h-8 text-emerald-600 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-100 text-white mb-2">NULLMATRIX OS</h1>
          <p className="text-zinc-500 text-zinc-400 text-sm text-center">Self-Evolving Intelligent Platform</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-3 px-4 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
          Authenticate with Google
        </button>
        
        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-500 text-zinc-600 uppercase tracking-widest">Secure Connection Required</p>
        </div>
      </div>
    </div>
  );
}
