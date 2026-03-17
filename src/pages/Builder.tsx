import { useState, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { ai, MODELS } from '../lib/gemini';
import { Wrench, Loader2, Play, Code, LayoutTemplate } from 'lucide-react';

export default function Builder() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !prompt.trim()) return;

    setGenerating(true);
    setError(null);
    setCode(null);

    try {
      const response = await ai.models.generateContent({
        model: MODELS.PRO,
        contents: `You are an expert web developer. The user wants to build a mini web application.
        Generate a COMPLETE, SINGLE HTML file containing all necessary HTML, CSS (use Tailwind via CDN), and JavaScript.
        Do not use markdown formatting like \`\`\`html. Just return the raw HTML string.
        Ensure the app is responsive, looks modern (dark mode preferred), and functions correctly.
        
        User Request: ${prompt}`,
      });

      let generatedHtml = response.text || '';
      // Clean up markdown if the model ignored the instruction
      if (generatedHtml.startsWith('```html')) {
        generatedHtml = generatedHtml.replace(/^```html\n/, '').replace(/\n```$/, '');
      } else if (generatedHtml.startsWith('```')) {
        generatedHtml = generatedHtml.replace(/^```.*\n/, '').replace(/\n```$/, '');
      }

      setCode(generatedHtml);
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate application. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-600 text-indigo-400" /> The Forge (App Builder)
        </h1>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Prompt & Controls */}
        <div className="w-full lg:w-1/3 border-r border-zinc-800 p-6 flex flex-col bg-zinc-900/30 overflow-y-auto">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> Define Application
          </h2>
          <p className="text-sm text-zinc-500 text-zinc-400 mb-6">
            Describe the tool or application you want to build. The AI will generate a complete, functional module instantly.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4 flex-1 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Build a QR code generator with a dark theme..."
              className="w-full flex-1 bg-black border border-zinc-200 border-zinc-800 rounded-xl p-4 text-zinc-900 text-zinc-100 placeholder-zinc-400 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 min-h-[200px] resize-none"
            />
            
            {error && (
              <div className="text-red-500 text-sm bg-red-50 bg-red-500/10 p-3 rounded-lg border border-red-200 border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="w-full py-4 bg-indigo-100 bg-indigo-500/20 text-indigo-700 text-indigo-400 font-bold rounded-xl hover:bg-indigo-200 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {generating ? 'Forging Application...' : 'Generate Module'}
            </button>
          </form>
        </div>

        {/* Right Panel: Preview */}
        <div className="w-full lg:w-2/3 bg-zinc-900 bg-black flex flex-col relative">
          <div className="p-2 border-b border-zinc-200 border-zinc-800 bg-zinc-900/50 bg-zinc-900/50 flex items-center gap-2 text-xs text-zinc-500 text-zinc-400">
            <Code className="w-4 h-4" /> Live Preview
          </div>
          <div className="flex-1 relative">
            {code ? (
              <iframe
                ref={iframeRef}
                srcDoc={code}
                title="Generated App"
                className="absolute inset-0 w-full h-full border-none bg-zinc-900"
                sandbox="allow-scripts allow-forms allow-same-origin"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-zinc-600">
                {generating ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p>Compiling logic and rendering UI...</p>
                  </div>
                ) : (
                  <p>Generated application will appear here.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
