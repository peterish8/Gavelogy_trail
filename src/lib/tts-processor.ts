/**
 * TTS Processor
 * 
 * Handles the logic for converting raw HTML content into a TTS-friendly format.
 * 1. Parses HTML
 * 2. Identifies text nodes
 * 3. Accumulates text across inline elements (merging bolds/italics)
 * 4. Breaks sentences ONLY on specific punctuation (., !, ?, :, ,) or Block Elements
 * 5. Returns processed HTML + linear list of sentences
 */

export interface ProcessedContent {
    processedHtml: string;
    sentences: string[];
}

export function processContentForTTS(htmlString: string): ProcessedContent {
    if (typeof window === 'undefined') {
        return { processedHtml: htmlString, sentences: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const sentences: string[] = [];
    
    // State for traversal
    let sentenceIndex = 0;
    let bufferText = "";
    let bufferNodes: (Node | Element)[] = []; // Nodes that belong to the current sentence buffer

    // Elements that force a sentence break (Pause)
    // User Request: Only "Big Title" (Headers) or Punctuation should pause.
    const FLUSH_ELEMENTS = new Set([
        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'HEADER', 'FOOTER', 'SECTION', 'ARTICLE', 'MAIN', 'NAV', 'ASIDE'
    ]);

    // Elements that should just add Space (Continuous flow)
    const SPACE_ELEMENTS = new Set([
        'P', 'DIV', 'LI', 'BR', 'BLOCKQUOTE', 'DD', 'DT', 'FIGCAPTION', 'TD', 'TH', 'TR', 'PRE', 'ADDRESS'
    ]);

    // Flushes the current buffer into a "sentence"
    const flush = () => {
        if (!bufferText.trim()) {
            // If buffer is just whitespace, just clear it, don't make a sentence
            // But we still need to put the nodes back?
            // Actually, if we consumed nodes and didn't make a sentence, we just leave them?
            // "bufferNodes" are actually newly created spans or references.
            // Wait, we need to wrap the processed visual nodes with the sentence index.
            // If it's empty/whitespace, we don't index it.
            bufferText = "";
            bufferNodes = [];
            return;
        }

        // 1. Add to sentences array (clean emojis for TTS)
        // Comprehensive regex for emojis, symbols, and pictographs
        const cleanText = bufferText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
        
        if (cleanText) {
            sentences.push(cleanText);
            
            // 2. Mark the visual nodes with the index
            bufferNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    (node as Element).setAttribute('data-sentence-index', sentenceIndex.toString());
                    (node as Element).classList.add('tts-sentence');
                } else {
                    // If it's a raw text node that we tracked (shouldn't happen with our logic below), wrap it?
                    // Our logic below ensures we create spans.
                }
            });
            
            sentenceIndex++;
        }

        // Reset
        bufferText = "";
        bufferNodes = [];
    };

    function traverse(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (!text) return;

            // Skip metadata/keywords lines
            if (/^(Keywords|Abstract|References|Bibliography):/i.test(text.trim())) {
                return;
            }

            // Split by Punctuation: . ! ? : ,
            // We want to keep the delimiter attached to the end of the sentence.
            // Regex to split but keep delimiter: /([.?!:,]+)/
            const parts = text.split(/([.?!:,]+)/);
            
            // Process parts
            // "Hello. World" -> ["Hello", ".", " World"]
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!part) continue;

                // If it's punctuation, append to buffer and potentially flush
                if (/^[.?!:,]+$/.test(part)) {
                    bufferText += part;
                    // If we have just appended punctuation, we should flush!
                    // BUT, wait - "Mr."? No complex logic requested, just break on dot.
                    // The user said "cut u give is at comma or colon or full stop only".
                    
                    // We need to create a visual node for this part?
                    // Actually, we are walking the DOM. We can't easily "split" the text node in place inside this loop
                    // without disrupting the traversal if we modify the DOM tree immediately.
                    // Instead, we will collect replacements.
                } else {
                    // It's text. If we just flushed, this starts new buffer.
                    bufferText += part;
                }
                
                // Logic check: When to flush?
                // If this `part` was the punctuation, we flush.
                // If the NEXT part is punctuation, we continue.
                const isPunctuation = /^[.?!:,]+$/.test(part);

                if (isPunctuation) {
                    // We found punctuation, so the buffer (which includes this punct) is done.
                    // Create a span for the text we've accumulated SO FAR in this node?
                    // No, that's tricky.
                }
            }
            
            // SIMPLIFIED APPROACH for Text Nodes to avoid complex in-place splitting issues:
            // 1. Tokenize entire text node string.
            // 2. Map tokens to Span elements.
            // 3. Replace original text node with Fragment of Spans.
            // 4. For each Span:
            //    - Append its text to `bufferText`
            //    - Add Span to `bufferNodes`
            //    - If Span text implies end-of-sentence (ends with . ? ! : ,), FLUSH.
            
            const fragment = document.createDocumentFragment();
            // Split: keep punctuation with the word if possible, or just split strict
            // "Hello. World" -> ["Hello.", " World"]
            // Regex: match any seq of chars that ends with punctuation OR end of string
            const tokens = text.match(/[^.?!:,]+[.?!:,]*|[\s]+[.?!:,]*/g) || [text];

            tokens.forEach(token => {
                const span = document.createElement('span');
                span.textContent = token;
                fragment.appendChild(span);

                bufferText += token;
                bufferNodes.push(span);

                if (/[:.!?,]\s*$/.test(token)) {
                    flush();
                }
            });

            node.parentNode?.replaceChild(fragment, node);
            return; // Done with this node
        } 
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName;

            // Script/Style skip
            if (tagName === 'SCRIPT' || tagName === 'STYLE') return;

            // Check Flush Elements -> Flush BEFORE
            if (FLUSH_ELEMENTS.has(tagName)) {
                flush();
            }
            
            // Check Space Elements -> Add Space BEFORE (if needed)
            if (SPACE_ELEMENTS.has(tagName)) {
                 if (bufferText && !bufferText.endsWith(" ")) {
                     bufferText += " ";
                 }
            }

            // Recurse
            Array.from(node.childNodes).forEach(child => traverse(child));

            // Check Flush Elements -> Flush AFTER
            if (FLUSH_ELEMENTS.has(tagName)) {
                flush();
            }
            
            // Check Space Elements -> Add Space AFTER
            // (Only if next node isn't going to add space? Simple approach: Just add space, trim later handled by flush logic?)
            // Actually, adding space to bufferText is displayed in the "Sentence".
            // If we have "End </p><p> Start", we want "End Start".
            // So adding space AFTER is good.
            if (SPACE_ELEMENTS.has(tagName)) {
                 if (bufferText && !bufferText.endsWith(" ")) {
                     bufferText += " ";
                 }
            }
        }
    }

    traverse(doc.body);
    // Final flush
    flush();

    return {
        processedHtml: doc.body.innerHTML,
        sentences
    };
}
