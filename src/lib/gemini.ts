import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

// Initialize the Gemini API client
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODELS = {
  FLASH: 'gemini-3-flash-preview',
  PRO: 'gemini-3.1-pro-preview',
  FLASH_LITE: 'gemini-3.1-flash-lite-preview',
  IMAGE_PRO: 'gemini-3-pro-image-preview',
  IMAGE_FLASH: 'gemini-3.1-flash-image-preview',
  VIDEO_FAST: 'veo-3.1-fast-generate-preview',
  TTS: 'gemini-2.5-flash-preview-tts',
  LIVE: 'gemini-2.5-flash-native-audio-preview-09-2025'
};
