import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { ai, MODELS } from '../lib/gemini';
import { Mic, Play, Loader2, Volume2, Square, FileAudio, AlertCircle } from 'lucide-react';
import { Modality, LiveServerMessage } from '@google/genai';

export default function Audio() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'live' | 'tts' | 'transcribe'>('live');

  // Live API State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState('Disconnected');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [ttsAudio, setTtsAudio] = useState<string | null>(null);
  const [generatingTts, setGeneratingTts] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Transcription State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  // Cleanup Live Session
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const toggleLiveSession = async () => {
    if (isLive) {
      if (sessionRef.current) sessionRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      setIsLive(false);
      setLiveStatus('Disconnected');
      return;
    }

    try {
      setLiveStatus('Connecting...');
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful AI assistant in the NullMatrix platform.",
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setLiveStatus('Connected - Listening');
            
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Simple playback for PCM16 24kHz (Gemini output)
              // In a real app, you'd need a proper resampler and queue
              try {
                const audioBuffer = audioContextRef.current.createBuffer(1, bytes.length / 2, 24000);
                const channelData = audioBuffer.getChannelData(0);
                const dataView = new DataView(bytes.buffer);
                for (let i = 0; i < bytes.length / 2; i++) {
                  channelData[i] = dataView.getInt16(i * 2, true) / 32768;
                }
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
              } catch (err) {
                console.error("Audio playback error", err);
              }
            }
          },
          onclose: () => {
            setIsLive(false);
            setLiveStatus('Disconnected');
          },
          onerror: (err) => {
            console.error('Live API Error:', err);
            setLiveStatus('Error occurred');
            setIsLive(false);
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error('Failed to start live session:', error);
      setLiveStatus('Failed to connect');
      setIsLive(false);
    }
  };

  const handleGenerateTTS = async (e: React.FormEvent) => {
    e.preventDefault();
    setTtsError(null);
    if (!ttsText.trim()) {
      setTtsError("Please enter text to synthesize.");
      return;
    }

    setGeneratingTts(true);
    setTtsAudio(null);

    try {
      const response = await ai.models.generateContent({
        model: MODELS.TTS,
        contents: [{ parts: [{ text: ttsText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setTtsAudio(`data:audio/wav;base64,${base64Audio}`);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setTtsError('Failed to generate speech.');
    } finally {
      setGeneratingTts(false);
    }
  };

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setTranscribeError(null);
    if (!audioFile) {
      setTranscribeError("Please select an audio file to transcribe.");
      return;
    }

    setTranscribing(true);
    setTranscription(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = audioFile.type;

        const response = await ai.models.generateContent({
          model: MODELS.FLASH,
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: "Please transcribe this audio accurately." }
            ]
          }
        });

        setTranscription(response.text || 'No transcription returned.');
        setTranscribing(false);
      };
      reader.readAsDataURL(audioFile);
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscribeError('Failed to transcribe audio.');
      setTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-y-auto transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Mic className="w-5 h-5 text-purple-600 text-purple-400" /> Audio Core
        </h1>
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => { setActiveTab('live'); setTtsError(null); setTranscribeError(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'live' ? 'bg-purple-100 bg-purple-500/20 text-purple-700 text-purple-400' : 'text-zinc-600 text-zinc-400 hover:text-zinc-100 hover:text-zinc-200'}`}
          >
            Live Conversation
          </button>
          <button
            onClick={() => { setActiveTab('tts'); setTtsError(null); setTranscribeError(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'tts' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 text-purple-400' : 'text-zinc-600 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            Text to Speech
          </button>
          <button
            onClick={() => { setActiveTab('transcribe'); setTtsError(null); setTranscribeError(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'transcribe' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            Transcribe
          </button>
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full">
        {activeTab === 'live' && (
          <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isLive ? 'bg-purple-100 dark:bg-purple-500/20 border-4 border-purple-200 dark:border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-pulse' : 'bg-zinc-900 bg-zinc-800 border-4 border-zinc-200 border-zinc-700'}`}>
              <Mic className={`w-12 h-12 ${isLive ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400 text-zinc-500'}`} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 text-zinc-100 mb-2">Live Voice Assistant</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">Engage in a real-time, low-latency conversation with Gemini 2.5 Flash Native Audio.</p>
            
            <button
              onClick={toggleLiveSession}
              className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${isLive ? 'bg-red-100 bg-red-500/20 text-red-600 text-red-400 hover:bg-red-200 hover:bg-red-500/30' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 hover:bg-purple-500/30'}`}
            >
              {isLive ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isLive ? 'End Session' : 'Start Conversation'}
            </button>
            <p className="mt-4 text-xs text-zinc-500 uppercase tracking-widest">{liveStatus}</p>
          </div>
        )}

        {activeTab === 'tts' && (
          <div className="space-y-8">
            <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-200 border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-zinc-900 text-zinc-100 mb-4">Generate Speech</h2>
              <form onSubmit={handleGenerateTTS} className="space-y-4">
                {ttsError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 bg-red-500/10 p-3 rounded-lg border border-red-200 border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    {ttsError}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Text</label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => { setTtsText(e.target.value); setTtsError(null); }}
                    placeholder="Enter text to synthesize..."
                    className={`w-full bg-black border ${ttsError ? 'border-red-500' : 'border-zinc-200 border-zinc-800'} rounded-xl p-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 min-h-[150px]`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={generatingTts || !ttsText.trim()}
                  className="w-full py-3 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingTts ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                  {generatingTts ? 'Synthesizing...' : 'Generate Audio'}
                </button>
              </form>
            </div>

            {ttsAudio && (
              <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 border-zinc-800 rounded-2xl p-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider w-full">Output</h3>
                <audio controls src={ttsAudio} className="w-full" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcribe' && (
          <div className="space-y-8">
            <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Transcribe Audio</h2>
              <form onSubmit={handleTranscribe} className="space-y-4">
                {transcribeError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 bg-red-500/10 p-3 rounded-lg border border-red-200 border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    {transcribeError}
                  </div>
                )}
                <div className={`border-2 border-dashed ${transcribeError && !audioFile ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800'} rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors relative bg-black`}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => { setAudioFile(e.target.files?.[0] || null); setTranscribeError(null); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {audioFile ? (
                      <FileAudio className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Mic className="w-8 h-8 text-zinc-400 text-zinc-500" />
                    )}
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {audioFile ? audioFile.name : 'Drop audio file here, or click to select'}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={transcribing || !audioFile}
                  className="w-full py-3 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {transcribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileAudio className="w-5 h-5" />}
                  {transcribing ? 'Transcribing...' : 'Transcribe Audio'}
                </button>
              </form>
            </div>

            {transcription && (
              <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Transcription</h3>
                <div className="p-4 bg-zinc-50 bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-300 leading-relaxed">
                  {transcription}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
