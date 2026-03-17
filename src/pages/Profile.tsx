import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Mail, Camera, Save, Loader2, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500kb limit for base64
        setMessage({ type: 'error', text: 'Image must be less than 500KB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update Auth Profile
      await updateProfile(user, {
        displayName,
        photoURL
      });

      // Update Firestore Document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          displayName,
          photoURL
        });
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName,
          photoURL,
          createdAt: new Date()
        });
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-y-auto transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600 text-emerald-400" /> User Profile
        </h1>
      </header>

      <div className="p-8 max-w-2xl mx-auto w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-sm">
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-100 border-zinc-800 bg-zinc-800 flex items-center justify-center">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-zinc-400" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <h2 className="mt-4 text-xl font-bold text-zinc-100">{displayName || 'Agent'}</h2>
            <p className="text-sm text-zinc-500 text-zinc-400 flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3" /> Clearance Level: Alpha
            </p>
          </div>

          {message.text && (
            <div className={`p-3 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700 bg-red-500/10 text-red-400' : 'bg-emerald-100 text-emerald-700 bg-emerald-500/10 text-emerald-400'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 text-zinc-300 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black border border-zinc-200 border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-900 text-zinc-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Enter display name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 text-zinc-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-zinc-900 bg-zinc-900/50 border border-zinc-200 border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Email cannot be changed.</p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
