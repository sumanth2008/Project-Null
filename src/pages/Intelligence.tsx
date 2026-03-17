import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Search, Brain, Sparkles, RefreshCw } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
  groundingUrls?: any[];
}

export default function Intelligence() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello. I am the NullMatrix Intelligence Core. I am equipped with advanced reasoning and real-time search capabilities. How can I assist you today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [useThinking, setUseThinking] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', isThinking: true }]);

    try {
      // Build config based on toggles
      const config: any = {
        systemInstruction: "You are the NullMatrix Intelligence Core, a highly advanced AI assistant. Provide concise, accurate, and helpful responses.",
      };

      if (useThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      // We use generateContent instead of chat because we want to easily toggle features per request
      // and we can pass the conversation history as contents.
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: userMessage.content }] });

      const response = await ai.models.generateContent({
        model: useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.1-flash-lite-preview',
        contents: contents,
        config: config,
      });

      const text = response.text || 'No response generated.';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: text, isThinking: false, groundingUrls: groundingChunks } 
          : msg
      ));
    } catch (error: any) {
      console.error('Intelligence Core Error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `Error: ${error.message || 'Failed to generate response.'}`, isThinking: false } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black font-mono">
      <header className="p-6 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-3 text-zinc-100">
            <Brain className="w-6 h-6 text-purple-600 text-purple-400" />
            Intelligence Core
          </h1>
          <p className="text-sm text-zinc-500 text-zinc-400 mt-1">Advanced Reasoning & Real-time Search</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggles */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${useSearch ? 'bg-blue-500' : 'bg-zinc-700'}`}>
              <div className={`w-4 h-4 bg-zinc-900 rounded-full absolute top-0.5 left-0.5 transform transition-transform ${useSearch ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-zinc-600 text-zinc-300 flex items-center gap-1">
              <Search className="w-3 h-3" /> Web Search
            </span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${useThinking ? 'bg-purple-500' : 'bg-zinc-300 bg-zinc-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transform transition-transform ${useThinking ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-zinc-600 text-zinc-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Deep Thinking
            </span>
          </label>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' 
                ? 'bg-blue-100 text-blue-600 bg-blue-900/30 text-blue-400' 
                : 'bg-purple-100 text-purple-600 bg-purple-900/30 text-purple-400'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white bg-zinc-900 border border-zinc-800 text-zinc-300 text-zinc-200 rounded-tl-sm shadow-sm'
              }`}>
                {msg.isThinking ? (
                  <div className="flex items-center gap-3 text-purple-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Analyzing request...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              
              {/* Grounding Sources */}
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.groundingUrls.map((chunk: any, idx: number) => {
                    if (chunk.web?.uri) {
                      return (
                        <a 
                          key={idx} 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-zinc-900 bg-zinc-800 text-zinc-600 text-zinc-400 rounded-md hover:bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          {chunk.web.title || new URL(chunk.web.uri).hostname}
                        </a>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 border-zinc-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query the Intelligence Core..."
            disabled={isLoading}
            className="w-full bg-zinc-100 bg-black border border-zinc-300 border-zinc-700 rounded-xl pl-4 pr-12 py-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
