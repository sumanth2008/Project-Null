import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { ai, MODELS } from '../lib/gemini';
import { Image as ImageIcon, Upload, Loader2, Play, FileVideo, Edit3, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Vision() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');
  
  // Generation State
  const [prompt, setPrompt] = useState('');
  const [imageModel, setImageModel] = useState<'pro' | 'flash'>('pro');
  const [imageSize, setImageSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Analysis State
  const [file, setFile] = useState<File | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError(null);
    if (!prompt.trim()) {
      setGenerateError("Please enter a prompt.");
      return;
    }
    if (!user) return;

    setGenerating(true);
    setGeneratedImage(null);

    try {
      const model = imageModel === 'pro' ? MODELS.IMAGE_PRO : MODELS.IMAGE_FLASH;
      
      let parts: any[] = [{ text: prompt }];

      if (editImage && imageModel === 'flash') {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(editImage);
        });
        parts.unshift({
          inlineData: { data: base64Data, mimeType: editImage.type }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerateError('Failed to generate image. Ensure API key is configured and has access to the model.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzeError(null);
    if (!file) {
      setAnalyzeError("Please select a file to analyze.");
      return;
    }
    if (!analysisPrompt.trim()) {
      setAnalyzeError("Please enter a query.");
      return;
    }
    if (!user) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        const response = await ai.models.generateContent({
          model: MODELS.PRO,
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: analysisPrompt }
            ]
          }
        });

        setAnalysisResult(response.text || 'No analysis returned.');
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalyzeError('Failed to analyze file.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-y-auto transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-600 text-blue-400" /> Vision Matrix
        </h1>
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => { setActiveTab('generate'); setGenerateError(null); setAnalyzeError(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'generate' ? 'bg-blue-100 bg-blue-500/20 text-blue-700 text-blue-400' : 'text-zinc-600 text-zinc-400 hover:text-zinc-100 hover:text-zinc-200'}`}
          >
            Generate & Edit
          </button>
          <button
            onClick={() => { setActiveTab('analyze'); setGenerateError(null); setAnalyzeError(null); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeTab === 'analyze' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 text-blue-400' : 'text-zinc-600 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            Analyze
          </button>
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto w-full">
        {activeTab === 'generate' ? (
          <div className="space-y-8">
            <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 text-zinc-100">Image Synthesizer</h2>
                <div className="flex bg-zinc-900 bg-black rounded-lg p-1 border border-zinc-200 border-zinc-800">
                  <button
                    onClick={() => setImageModel('pro')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${imageModel === 'pro' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                  >
                    Nano Banana Pro
                  </button>
                  <button
                    onClick={() => setImageModel('flash')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${imageModel === 'flash' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                  >
                    Nano Banana 2
                  </button>
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-6">
                {generateError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 bg-red-500/10 p-3 rounded-lg border border-red-200 border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    {generateError}
                  </div>
                )}
                {imageModel === 'flash' && (
                  <div>
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Base Image (Optional for Editing)</label>
                    <div className="border-2 border-dashed border-zinc-300 border-zinc-800 rounded-xl p-6 text-center hover:border-blue-500/50 transition-colors relative bg-black">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-2">
                        {editImage ? (
                          <Edit3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Upload className="w-6 h-6 text-zinc-400 text-zinc-500" />
                        )}
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {editImage ? editImage.name : 'Drop image to edit, or click to select'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => { setPrompt(e.target.value); setGenerateError(null); }}
                    placeholder="Describe the image you want to generate or edit..."
                    className={`w-full bg-zinc-50 bg-zinc-950 border ${generateError ? 'border-red-500' : 'border-zinc-200 border-zinc-800'} rounded-xl p-4 text-zinc-900 text-zinc-100 placeholder-zinc-400 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 min-h-[100px]`}
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Size</label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-zinc-50 bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="512px">512px</option>
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full bg-zinc-50 bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3</option>
                      <option value="3:4">3:4</option>
                      <option value="3:2">3:2</option>
                      <option value="2:3">2:3</option>
                      <option value="21:9">21:9 (Ultrawide)</option>
                      <option value="1:4">1:4</option>
                      <option value="1:8">1:8</option>
                      <option value="4:1">4:1</option>
                      <option value="8:1">8:1</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={generating || !prompt.trim()}
                  className="w-full py-3 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-200 hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  {generating ? 'Synthesizing...' : 'Generate Image'}
                </button>
              </form>
            </div>

            {generatedImage && (
              <div className="bg-zinc-900/50 bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Output</h3>
                <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-xl shadow-2xl" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Gemini Pro Analysis</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                {analyzeError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 bg-red-500/10 p-3 rounded-lg border border-red-200 border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    {analyzeError}
                  </div>
                )}
                <div className={`border-2 border-dashed ${analyzeError && !file ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800'} rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors relative bg-zinc-50 dark:bg-zinc-950`}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => { setFile(e.target.files?.[0] || null); setAnalyzeError(null); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {file ? (
                      file.type.startsWith('video/') ? <FileVideo className="w-8 h-8 text-blue-600 dark:text-blue-400" /> : <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Upload className="w-8 h-8 text-zinc-400 text-zinc-500" />
                    )}
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {file ? file.name : 'Drop image or video here, or click to select'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Query</label>
                  <input
                    type="text"
                    value={analysisPrompt}
                    onChange={(e) => { setAnalysisPrompt(e.target.value); setAnalyzeError(null); }}
                    placeholder="What do you want to know about this file?"
                    className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${analyzeError && !analysisPrompt.trim() ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl p-4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={analyzing || !file || !analysisPrompt.trim()}
                  className="w-full py-3 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  {analyzing ? 'Analyzing...' : 'Analyze File'}
                </button>
              </form>
            </div>

            {analysisResult && (
              <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Analysis Result</h3>
                <div className="prose prose-invert max-w-none prose-sm text-zinc-300">
                  <ReactMarkdown>{analysisResult}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
