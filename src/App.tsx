/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import CommandCenter from './pages/CommandCenter';
import Vision from './pages/Vision';
import Audio from './pages/Audio';
import Video from './pages/Video';
import CyberLab from './pages/CyberLab';
import Builder from './pages/Builder';
import Agents from './pages/Agents';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import Intelligence from './pages/Intelligence';
import Network from './pages/Network';
import Login from './pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-black text-zinc-500 text-zinc-400 font-mono">Initializing NullMatrix...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

import PentestLab from './pages/PentestLab';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
                <Route path="command" element={<CommandCenter />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="vision" element={<Vision />} />
                <Route path="audio" element={<Audio />} />
                <Route path="video" element={<Video />} />
                <Route path="cyber" element={<CyberLab />} />
                <Route path="pentest" element={<PentestLab />} />
                <Route path="builder" element={<Builder />} />
                <Route path="agents" element={<Agents />} />
                <Route path="intelligence" element={<Intelligence />} />
                <Route path="network" element={<Network />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
