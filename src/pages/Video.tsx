import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { ai, MODELS } from '../lib/gemini';
import { Video as VideoIcon, Loader2, Play, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function Video() {
  const { user } = useAuth();
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (!prompt.trim() && !referenceImage) {
      setError('Please provide a prompt or a reference image.');
      return;
    }

    setGenerating(true);
    setVideoUrl(null);
    setStatus('Initializing Veo 3 Engine...');

    try {
      let imagePayload = undefined;
      
      if (referenceImage) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(referenceImage);
        });
        
        imagePayload = {
          imageBytes: base64Data,
          mimeType: referenceImage.type
        };
      }

      setStatus('Submitting job to Veo 3...');
      let operation = await ai.models.generateVideos({
        model: MODELS.VIDEO_FAST,
        prompt: prompt || undefined,
        image: imagePayload,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      while (!operation.done) {
        setStatus('Synthesizing frames... (This may take a few minutes)');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatus('Fetching generated video...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY || '',
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          setVideoUrl(URL.createObjectURL(blob));
          setStatus('Generation complete.');
        } else {
          throw new Error('Failed to fetch video blob');
        }
      } else {
        throw new Error('No video URI returned');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      setStatus('Generation failed.');
      setError('Failed to generate video. Ensure API key is configured and has access to Veo models.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-y-auto transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-orange-600 text-orange-400" /> Video Forge
        </h1>
      </header>

      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="space-y-8">
          <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Veo 3.1 Fast Generator</h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 bg-red-500/10 p-3 rounded-lg border border-red-200 border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-500 text-zinc-400 mb-2 uppercase tracking-wider">Text Prompt</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => { setPrompt(e.target.value); setError(null); }}
                      placeholder="Describe the video you want to generate..."
                      className={`w-full bg-black border ${error && !prompt.trim() && !referenceImage ? 'border-red-500' : 'border-zinc-200 border-zinc-800'} rounded-xl p-4 text-zinc-900 text-zinc-100 placeholder-zinc-400 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 min-h-[120px]`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-zinc-500 text-zinc-400 mb-2 uppercase tracking-wider">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="w-full bg-black border border-zinc-200 border-zinc-800 rounded-xl p-3 text-zinc-900 text-zinc-100 focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Reference Image (Optional)</label>
                  <div className={`border-2 border-dashed ${error && !prompt.trim() && !referenceImage ? 'border-red-500' : 'border-zinc-300 border-zinc-800'} rounded-xl p-8 h-[208px] flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-colors relative bg-zinc-50 bg-zinc-950`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => { setReferenceImage(e.target.files?.[0] || null); setError(null); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      {referenceImage ? (
                        <ImageIcon className="w-8 h-8 text-orange-600 text-orange-400" />
                      ) : (
                        <Upload className="w-8 h-8 text-zinc-400 text-zinc-500" />
                      )}
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {referenceImage ? referenceImage.name : 'Drop starting image here, or click to select'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || (!prompt.trim() && !referenceImage)}
                className="w-full py-4 bg-orange-100 bg-orange-500/20 text-orange-700 dark:text-orange-400 font-bold rounded-xl hover:bg-orange-200 hover:bg-orange-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {generating ? 'Processing...' : 'Generate Video'}
              </button>
              
              {generating && (
                <div className="text-center mt-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">{status}</p>
                </div>
              )}
            </form>
          </div>

          {videoUrl && (
            <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 overflow-hidden">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Output</h3>
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-auto rounded-xl shadow-2xl bg-black" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
