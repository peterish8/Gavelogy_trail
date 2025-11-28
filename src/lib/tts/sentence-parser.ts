/**
 * Sentence and Word Parser
 * Splits text into sentences and words for TTS processing
 */

export interface Sentence {
  index: number;
  text: string;
  words: Word[];
  startCharIndex: number;
  endCharIndex: number;
}

export interface Word {
  index: number;
  text: string;
  startCharIndex: number;
  endCharIndex: number;
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): Sentence[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const sentences: Sentence[] = [];
  
  // Regex to split on sentence endings (., !, ?) followed by space or newline
  const sentenceRegex = /([.!?]+)\s+/g;
  const parts = text.split(sentenceRegex);
  
  let currentSentence = '';
  let charIndex = 0;
  let sentenceIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.match(/^[.!?]+$/)) {
      // This is a sentence ending punctuation
      currentSentence += part;
      const startIndex = charIndex - currentSentence.length;
      
      // Split sentence into words
      const words = splitIntoWords(currentSentence.trim(), startIndex);
      
      sentences.push({
        index: sentenceIndex++,
        text: currentSentence.trim(),
        words,
        startCharIndex: startIndex,
        endCharIndex: charIndex + part.length,
      });
      
      currentSentence = '';
      charIndex += part.length;
    } else {
      currentSentence += part;
      charIndex += part.length;
    }
  }

  // Handle remaining text (if no sentence ending)
  if (currentSentence.trim().length > 0) {
    const startIndex = charIndex - currentSentence.length;
    const words = splitIntoWords(currentSentence.trim(), startIndex);
    
    sentences.push({
      index: sentenceIndex,
      text: currentSentence.trim(),
      words,
      startCharIndex: startIndex,
      endCharIndex: charIndex,
    });
  }

  return sentences;
}

/**
 * Split sentence into words
 */
function splitIntoWords(sentence: string, startCharIndex: number): Word[] {
  const words: Word[] = [];
  
  // Split by whitespace, preserving punctuation
  const wordRegex = /\S+/g;
  let match;
  let wordIndex = 0;

  while ((match = wordRegex.exec(sentence)) !== null) {
    words.push({
      index: wordIndex++,
      text: match[0],
      startCharIndex: startCharIndex + match.index,
      endCharIndex: startCharIndex + match.index + match[0].length,
    });
  }

  return words;
}

/**
 * Find sentence and word index from character position
 */
export function findWordAtPosition(
  sentences: Sentence[],
  charIndex: number
): { sentenceIndex: number; wordIndex: number } | null {
  for (const sentence of sentences) {
    if (charIndex >= sentence.startCharIndex && charIndex <= sentence.endCharIndex) {
      for (const word of sentence.words) {
        if (charIndex >= word.startCharIndex && charIndex <= word.endCharIndex) {
          return {
            sentenceIndex: sentence.index,
            wordIndex: word.index,
          };
        }
      }
    }
  }
  return null;
}

/**
 * Get text from word to end of sentence
 */
export function getTextFromWord(
  sentences: Sentence[],
  sentenceIndex: number,
  wordIndex: number
): string {
  const sentence = sentences[sentenceIndex];
  if (!sentence) return '';

  const words = sentence.words.slice(wordIndex);
  return words.map(w => w.text).join(' ');
}

/**
 * Get text from sentence to end
 */
export function getTextFromSentence(
  sentences: Sentence[],
  sentenceIndex: number
): string {
  const remainingSentences = sentences.slice(sentenceIndex);
  return remainingSentences.map(s => s.text).join(' ');
}
