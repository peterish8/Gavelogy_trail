import { useState, useEffect, useRef, useCallback } from 'react';

export interface TTSState {
    isPlaying: boolean;
    isPaused: boolean;
    currentSentenceIndex: number;
    progress: number; // 0-100
    isSupported: boolean;
    rate: number;
}

export function useTTS(sentences: string[]) {
    const [state, setState] = useState<TTSState>({
        isPlaying: false,
        isPaused: false,
        currentSentenceIndex: 0,
        progress: 0,
        isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
        rate: 1.0
    });

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const sentencesRef = useRef(sentences);
    const rateRef = useRef(1.0);
    const isPlayingRef = useRef(false); // Ref for synchronous state checking loop

    // Keep ref in sync for callbacks
    useEffect(() => {
        sentencesRef.current = sentences;
    }, [sentences]);

    const stop = useCallback(() => {
        if (!state.isSupported) return;
        window.speechSynthesis.cancel();
        isPlayingRef.current = false;
        setState(prev => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            progress: 0,
            currentSentenceIndex: 0
        }));
    }, [state.isSupported]);

    const speakSentence = useCallback((index: number) => {
        if (!state.isSupported || index >= sentencesRef.current.length) {
            if (index >= sentencesRef.current.length && index > 0) {
                // End of document
                setState(prev => ({ ...prev, isPlaying: false, currentSentenceIndex: 0, progress: 100 }));
            }
            return;
        }

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const text = sentencesRef.current[index];
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice - prefer a clear English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                             voices.find(v => v.lang.startsWith('en')) ||
                             voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = rateRef.current; // Use current rate from ref

        utterance.onend = () => {
             // Prevent stale callbacks if we've already moved on
            if (utteranceRef.current !== utterance) return;

            // Verify we are still playing before advancing
            if (!isPlayingRef.current) return;

            // Auto-advance to next sentence
            const nextIndex = index + 1;
            if (nextIndex < sentencesRef.current.length) {
                // If we are still "playing" (not stopped manually)
                setState(prev => {
                    if (!prev.isPlaying) return prev; // Don't advance if stopped
                    return {
                        ...prev,
                        currentSentenceIndex: nextIndex,
                        progress: (nextIndex / sentencesRef.current.length) * 100
                    };
                });
                speakSentence(nextIndex);
            } else {
                // Done
                setState(prev => ({ ...prev, isPlaying: false, currentSentenceIndex: 0, progress: 100 }));
            }
        };

        utterance.onerror = (e) => {
            // Prevent stale callbacks
            if (utteranceRef.current !== utterance) return;

            // Ignore interruption errors (happens when scrubbing/cancelling)
            if (e.error === 'interrupted' || e.error === 'canceled') {
                return;
            }
            console.error("TTS Error:", e);
            isPlayingRef.current = false;
            setState(prev => ({ ...prev, isPlaying: false }));
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);

        isPlayingRef.current = true;
        setState(prev => ({
            ...prev,
            currentSentenceIndex: index,
            isPlaying: true,
            isPaused: false,
            progress: (index / sentencesRef.current.length) * 100
        }));

    }, [state.isSupported]);

    const play = useCallback(() => {
        if (!state.isSupported) return;

        if (state.isPaused) {
            window.speechSynthesis.resume();
            isPlayingRef.current = true;
            setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
        } else {
            speakSentence(state.currentSentenceIndex);
        }
    }, [state.isSupported, state.isPaused, state.currentSentenceIndex, speakSentence]);

    const pause = useCallback(() => {
        if (!state.isSupported) return;
        window.speechSynthesis.pause();
        isPlayingRef.current = false;
        setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    }, [state.isSupported]);

    const jumpToSentence = useCallback((index: number) => {
        if (!state.isSupported) return;
        // Clamp index
        const safeIndex = Math.max(0, Math.min(index, sentencesRef.current.length - 1));
        speakSentence(safeIndex);
    }, [state.isSupported, speakSentence]);

    const scrub = useCallback((percentage: number) => {
        if (!state.isSupported || sentencesRef.current.length === 0) return;
        const index = Math.floor((percentage / 100) * sentencesRef.current.length);
        jumpToSentence(index);
    }, [state.isSupported, jumpToSentence]);
    
    const setRate = useCallback((newRate: number) => {
        rateRef.current = newRate;
        setState(prev => ({ ...prev, rate: newRate }));
        
        // Instant apply: if currently playing, restart the sentence with new rate
        if (state.isPlaying && !state.isPaused) {
            speakSentence(state.currentSentenceIndex);
        }
    }, [state.isPlaying, state.isPaused, state.currentSentenceIndex, speakSentence]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Ensure voices are loaded (Chrome quirk)
    useEffect(() => {
         if (typeof window !== 'undefined' && window.speechSynthesis) {
             window.speechSynthesis.getVoices();
         }
    }, []);

    return {
        ...state,
        play,
        pause,
        stop,
        jumpToSentence,
        scrub,
        setRate
    };
}
