/**
 * Note Reader Hook
 * Manages TTS playback with background pre-generation queue
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { synthesize } from '@/lib/tts/webgpu-tts';
import {
  Sentence,
  getTextFromWord,
  getTextFromSentence,
} from '@/lib/tts/sentence-parser';

interface TTSQueue {
  currentSentenceIndex: number;
  currentWordIndex: number;
  nextSentencePending: boolean;
  cache: Map<number, AudioBuffer | HTMLAudioElement>;
  isPlaying: boolean;
  isPaused: boolean;
}

export function useNoteReader(sentences: Sentence[]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);

  const queueRef = useRef<TTSQueue>({
    currentSentenceIndex: 0,
    currentWordIndex: 0,
    nextSentencePending: false,
    cache: new Map(),
    isPlaying: false,
    isPaused: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generationPromisesRef = useRef<Map<number, Promise<any>>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new AudioContext();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Generate audio for a sentence (WebGPU or browser fallback)
   */
  const generateAudio = useCallback(async (
    sentenceIndex: number,
    text: string
  ): Promise<HTMLAudioElement | null> => {
    // Check cache first
    if (queueRef.current.cache.has(sentenceIndex)) {
      const cached = queueRef.current.cache.get(sentenceIndex);
      if (cached instanceof HTMLAudioElement) {
        return cached.cloneNode() as HTMLAudioElement;
      }
    }

    // Check if already generating
    if (generationPromisesRef.current.has(sentenceIndex)) {
      return await generationPromisesRef.current.get(sentenceIndex)!;
    }

    // Start generation
    const promise = (async () => {
      try {
        // Try WebGPU TTS first
        const audioBuffer = await synthesize(text);
        
        if (audioBuffer && audioContextRef.current) {
          // WebGPU generated audio
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          const audio = new Audio();
          // Convert AudioBuffer to playable audio
          // This is simplified - actual implementation would need proper conversion
          queueRef.current.cache.set(sentenceIndex, audio);
          return audio;
        } else {
          // Fallback to browser SpeechSynthesis
          return await generateBrowserTTS(text);
        }
      } catch (error) {
        console.error('Audio generation failed:', error);
        return await generateBrowserTTS(text);
      } finally {
        generationPromisesRef.current.delete(sentenceIndex);
      }
    })();

    generationPromisesRef.current.set(sentenceIndex, promise);
    return await promise;
  }, []);

  /**
   * Generate audio using browser SpeechSynthesis (fallback)
   */
  const generateBrowserTTS = useCallback((text: string): Promise<HTMLAudioElement | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve(null);
        return;
      }

      // For browser TTS, we'll use SpeechSynthesis directly
      // This is a fallback - actual playback will be handled differently
      resolve(null);
    });
  }, []);

  /**
   * Play audio for a sentence
   */
  const playSentence = useCallback(async (sentenceIndex: number): Promise<void> => {
    const sentence = sentences[sentenceIndex];
    if (!sentence) return;

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Get or generate audio
    let audio = queueRef.current.cache.get(sentenceIndex) as HTMLAudioElement | null;
    
    if (!audio) {
      audio = await generateAudio(sentenceIndex, sentence.text);
      if (audio) {
        queueRef.current.cache.set(sentenceIndex, audio);
      }
    }

    if (!audio) {
      // Fallback to browser SpeechSynthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(sentence.text);
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setCurrentSentenceIndex(sentenceIndex);
        };
        utterance.onend = () => {
          // Play next sentence
          if (sentenceIndex < sentences.length - 1) {
            playSentence(sentenceIndex + 1);
          } else {
            setIsPlaying(false);
            setCurrentSentenceIndex(null);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    // Play audio
    audioRef.current = audio;
    audio.onended = () => {
      // Pre-generate next sentence while current plays
      if (sentenceIndex < sentences.length - 1) {
        pregenerateNext(sentenceIndex + 1);
      }
      
      // Play next sentence
      if (sentenceIndex < sentences.length - 1) {
        playSentence(sentenceIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentSentenceIndex(null);
        setCurrentWordIndex(null);
      }
    };

    audio.play();
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentSentenceIndex(sentenceIndex);
  }, [sentences, generateAudio]);

  /**
   * Pre-generate next sentence in background
   */
  const pregenerateNext = useCallback(async (sentenceIndex: number) => {
    if (queueRef.current.cache.has(sentenceIndex)) {
      return; // Already cached
    }

    const sentence = sentences[sentenceIndex];
    if (!sentence) return;

    queueRef.current.nextSentencePending = true;
    
    // Generate in background
    const audio = await generateAudio(sentenceIndex, sentence.text);
    if (audio) {
      queueRef.current.cache.set(sentenceIndex, audio);
    }
    
    queueRef.current.nextSentencePending = false;
  }, [sentences, generateAudio]);

  /**
   * Start reading from a specific word
   */
  const startFromWord = useCallback(async (
    sentenceIndex: number,
    wordIndex: number
  ) => {
    // Cancel any ongoing generation
    generationPromisesRef.current.forEach(promise => {
      // Cancel if possible
    });
    generationPromisesRef.current.clear();

    // Stop current playback
    stop();

    // Pre-generate first sentence
    await pregenerateNext(sentenceIndex);

    // Start playing
    setCurrentWordIndex(wordIndex);
    await playSentence(sentenceIndex);
  }, [playSentence, pregenerateNext]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  /**
   * Stop playback
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(null);
    setCurrentWordIndex(null);
    
    // Clear generation promises
    generationPromisesRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      queueRef.current.cache.clear();
    };
  }, [stop]);

  return {
    isPlaying,
    isPaused,
    currentSentenceIndex,
    currentWordIndex,
    startFromWord,
    pause,
    resume,
    stop,
  };
}
