"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Play, Pause, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteReaderProps {
  text: string;
  className?: string;
  onWordClick?: (wordIndex: number) => void;
  currentWordIndex?: number | null;
  allWords?: Array<{ word: string; index: number }>;
  onShowReaderChange?: (show: boolean) => void;
}

type ReadingState = "idle" | "playing" | "paused";

interface WordData {
  word: string;
  index: number;
  isWhitespace: boolean;
}

/**
 * Custom hook for managing SpeechSynthesis
 */
function useSpeechSynthesis() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const cancel = useCallback(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, onBoundary?: (index: number) => void, onEnd?: () => void) => {
      if (!isSupported || !window.speechSynthesis) return null;

      cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      if (onBoundary) {
        utterance.onboundary = (event) => {
          if (event.name === "word") {
            // Calculate word index from character position more accurately
            const charIndex = event.charIndex;
            if (charIndex >= 0 && charIndex < text.length) {
              // Get text up to the boundary
              const textBefore = text.substring(0, charIndex);
              // Split by whitespace and count words (more accurate)
              const wordsBefore = textBefore.trim().split(/\s+/).filter(w => w.length > 0).length;
              // Subtract 1 to get 0-based index, but ensure it's at least 0
              const wordIndex = Math.max(0, wordsBefore > 0 ? wordsBefore - 1 : 0);
              onBoundary(wordIndex);
            }
          }
        };
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
      return utterance;
    },
    [isSupported, cancel]
  );

  const pause = useCallback(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    isSupported,
    speak,
    pause,
    resume,
    cancel,
    utteranceRef,
  };
}

/**
 * Splits text into words while preserving whitespace structure
 */
function splitTextIntoWords(text: string): WordData[] {
  if (!text || text.trim().length === 0) return [];

  const words: WordData[] = [];
  const regex = /\S+/g;
  let match;
  let lastIndex = 0;
  let wordIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add whitespace before word if any
    if (match.index > lastIndex) {
      const whitespace = text.substring(lastIndex, match.index);
      words.push({
        word: whitespace,
        index: -1, // Special index for whitespace
        isWhitespace: true,
      });
    }

    // Add the word
    words.push({
      word: match[0],
      index: wordIndex++,
      isWhitespace: false,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add trailing whitespace if any
  if (lastIndex < text.length) {
    words.push({
      word: text.substring(lastIndex),
      index: -1,
      isWhitespace: true,
    });
  }

  return words;
}

/**
 * Reconstructs text from a word index to the end
 */
function getTextFromIndex(words: WordData[], startIndex: number): string {
  const relevantWords = words.filter(
    (w) => !w.isWhitespace && w.index >= startIndex && w.index !== -1
  );
  return relevantWords.map((w) => w.word).join(" ");
}

export function NoteReader({ text, onWordClick, currentWordIndex }: NoteReaderProps) {
  // All hooks must be called unconditionally and in the same order every render
  const [showReader, setShowReader] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [readingState, setReadingState] = useState<ReadingState>("idle");
  const [internalWordIndex, setInternalWordIndex] = useState<number | null>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const currentStartIndexRef = useRef<number | null>(null);
  const highlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wordProgressionRef = useRef<number[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  
  // Use external word index if provided, otherwise use internal
  const activeWordIndex = currentWordIndex !== undefined ? currentWordIndex : internalWordIndex;

  // Custom hook - must be called unconditionally
  const { isSupported, speak, pause, resume, cancel } = useSpeechSynthesis();

  // Split text into words (memoized for performance)
  const words = useMemo(() => splitTextIntoWords(text), [text]);

  // Get actual word indices (excluding whitespace)
  const wordIndices = useMemo(
    () => words.filter((w) => !w.isWhitespace && w.index !== -1).map((w) => w.index),
    [words]
  );

  const hasText = text && text.trim().length > 0;

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      // Clear interval
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
      cancel();
    };
  }, [cancel]);

  // Handle word click - start reading from that word
  const handleWordClick = useCallback(
    (wordIndex: number) => {
      if (!isSupported || wordIndex < 0) return;

      cancel();
      setInternalWordIndex(wordIndex);
      currentStartIndexRef.current = wordIndex;
      
      // Call external onWordClick if provided
      if (onWordClick) {
        onWordClick(wordIndex);
      }

      const textToRead = getTextFromIndex(words, wordIndex);
      if (!textToRead.trim()) return;

      setReadingState("playing");
      isPlayingRef.current = true;

      // Scroll to clicked word
      const wordElement = wordRefs.current.get(wordIndex);
      if (wordElement) {
        wordElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      // Get word indices from start index
      const relevantWordIndices = words
        .filter((w) => !w.isWhitespace && w.index >= wordIndex && w.index !== -1)
        .map((w) => w.index);

      // Store for interval-based highlighting
      wordProgressionRef.current = relevantWordIndices;
      
      // Clear any existing interval
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }

      let wordCounter = 0;
      
      // Start interval-based word progression (more reliable than onboundary)
      highlightIntervalRef.current = setInterval(() => {
        if (wordCounter < relevantWordIndices.length && isPlayingRef.current) {
          const actualIndex = relevantWordIndices[wordCounter];
          setInternalWordIndex(actualIndex);
          
          // Call external onWordClick if provided
          if (onWordClick) {
            onWordClick(actualIndex);
          }
          
          // Scroll to current word (every 3 words to avoid janky scrolling)
          if (wordCounter % 3 === 0) {
            const currentElement = wordRefs.current.get(actualIndex);
            if (currentElement) {
              currentElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
          
          wordCounter++;
        } else {
          // Reached end or stopped
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
        }
      }, 300); // Update every 300ms (adjust based on reading speed)

      speak(
        textToRead,
        (relativeWordIndex) => {
          // Fallback: also update from onboundary events if they fire
          if (relativeWordIndex >= 0 && relativeWordIndex < relevantWordIndices.length) {
            const actualIndex = relevantWordIndices[relativeWordIndex];
            setInternalWordIndex(actualIndex);
            
            // Call external onWordClick if provided
            if (onWordClick) {
              onWordClick(actualIndex);
            }
            
            wordCounter = relativeWordIndex + 1; // Sync interval counter
          }
        },
        () => {
          // Clear interval on end
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
          isPlayingRef.current = false;
          setReadingState("idle");
          setInternalWordIndex(null);
          currentStartIndexRef.current = null;
          wordProgressionRef.current = [];
          
          // Clear external word index if callback provided
          if (onWordClick) {
            onWordClick(-1); // Signal end
          }
        }
      );
    },
    [isSupported, words, wordIndices, speak, cancel]
  );

  // Play button handler
  const handlePlay = useCallback(() => {
    if (readingState === "paused") {
      resume();
      isPlayingRef.current = true;
      setReadingState("playing");
    } else if (currentStartIndexRef.current !== null) {
      // Resume from current position
      handleWordClick(currentStartIndexRef.current);
    } else if (wordIndices.length > 0) {
      // Start from beginning
      handleWordClick(wordIndices[0]);
    }
  }, [readingState, wordIndices, handleWordClick, resume]);

  // Pause button handler
  const handlePause = useCallback(() => {
    pause();
    isPlayingRef.current = false;
    setReadingState("paused");
  }, [pause]);

  // Stop button handler
  const handleStop = useCallback(() => {
    // Clear highlight interval
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
    isPlayingRef.current = false;
    cancel();
    setReadingState("idle");
    setInternalWordIndex(null);
    currentStartIndexRef.current = null;
    wordProgressionRef.current = [];
    
    // Clear external word index if callback provided
    if (onWordClick) {
      onWordClick(-1); // Signal stop
    }
    setIsVisible(false);
  }, [cancel]);

  return (
    <>
      {/* Voice Button */}
      <Button
              onClick={() => {
                if (!hasText) {
                  alert("Please wait for the notes to load.");
                  return;
                }
                if (!isSupported) {
                  alert("Text-to-Speech is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.");
                  return;
                }
                const newShowReader = !showReader;
                setShowReader(newShowReader);
                if (onShowReaderChange) {
                  onShowReaderChange(newShowReader);
                }
                if (!showReader) {
                  setIsVisible(true);
                }
              }}
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-8 h-8 p-0"
        aria-label={showReader ? "Hide reader mode" : "Show reader mode"}
      >
        <Volume2 className="h-4 w-4" />
      </Button>

      {/* Audio Control Bar - Fixed position */}
      {isVisible && isSupported && (
        <div className="fixed bottom-4 right-4 z-[9998] bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[280px] animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-700">Voice Reader</h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePlay}
                disabled={readingState === "playing"}
                size="sm"
                variant="outline"
                className="flex-1"
                aria-label="Play"
              >
                <Play className="h-4 w-4 mr-1" />
                Play
              </Button>

              <Button
                onClick={handlePause}
                disabled={readingState !== "playing"}
                size="sm"
                variant="outline"
                className="flex-1"
                aria-label="Pause"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>

              <Button
                onClick={handleStop}
                disabled={readingState === "idle"}
                size="sm"
                variant="outline"
                className="flex-1"
                aria-label="Stop"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-1">
              Click any word to start reading from there
            </p>
          </div>
        </div>
      )}

      {/* Word-wrapped text content - Overlay on formatted text when reader mode is enabled */}
      {showReader && isSupported && hasText && (
        <div className="word-reader-overlay absolute top-0 left-0 right-0 pointer-events-none z-10">
          <div className="relative pointer-events-auto text-sm lg:text-lg leading-relaxed" style={{ wordBreak: "break-word" }}>
            {words.map((wordData, idx) => {
              const { word, index, isWhitespace } = wordData;
              // Only highlight the exact word being read (not all words from start)
              const isActive = !isWhitespace && index !== -1 && currentWordIndex === index && currentWordIndex !== null;

              if (isWhitespace) {
                return (
                  <span key={`whitespace-${idx}`} className="whitespace-pre pointer-events-none inline opacity-0">
                    {word}
                  </span>
                );
              }

              return (
                <span
                  key={`word-${index}`}
                  ref={(el) => {
                    if (el && index !== -1) {
                      wordRefs.current.set(index, el);
                    } else if (index !== -1) {
                      wordRefs.current.delete(index);
                    }
                  }}
                  data-index={index}
                  onClick={() => index !== -1 && handleWordClick(index)}
                  className={cn(
                    "cursor-pointer transition-all duration-200 rounded px-0.5 inline-block mx-0.5",
                    "hover:bg-yellow-100 hover:shadow-sm",
                    isActive && "bg-yellow-300 font-semibold shadow-md"
                  )}
                  style={{
                    backgroundColor: isActive ? '#FDE047' : 'transparent',
                    color: 'transparent', // Text is always transparent - only background shows
                    minWidth: isActive ? 'auto' : 'fit-content',
                    display: 'inline-block',
                    position: 'relative',
                    zIndex: isActive ? 20 : 10,
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (index !== -1) handleWordClick(index);
                    }
                  }}
                  aria-label={`Read from: ${word}`}
                  title={word} // Show word on hover for accessibility
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .word-reader-overlay {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .word-reader-overlay span {
          display: inline;
        }
      `}</style>
    </>
  );
}