/**
 * TTS Processor
 * 
 * Handles the logic for converting raw HTML content into a TTS-friendly format.
 * 1. Parses HTML
 * 2. Identifies text nodes
 * 3. Splits text into sentences using Intl.Segmenter
 * 4. Wraps sentences in interactive spans
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
    let sentenceIndex = 0;

    // Use Intl.Segmenter if available, otherwise simple regex
    let segmenter: Intl.Segmenter | null = null;
    try {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
        }
    } catch (e) {
        console.warn("Intl.Segmenter not supported", e);
    }

    function processNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            // Skip empty/whitespace nodes
            if (!text.trim()) return node; 
            
            // Skip metadata/keywords lines if they stand alone (e.g., "Keywords: ...")
            if (/^(Keywords|Abstract|References|Bibliography):/i.test(text.trim())) {
                return node;
            }

            let segments: { segment: string }[] = [];
            
            if (segmenter) {
                segments = Array.from(segmenter.segment(text));
            } else {
                // Fallback: simple split
                const rawSegments = text.match(/[^.!?]+[.!?]*|[\s]+[.!?]*/g) || [text];
                segments = rawSegments.map(s => ({ segment: s }));
            }

            const fragment = document.createDocumentFragment();

            segments.forEach(segment => {
                const sentenceText = segment.segment;
                // Only wrap if it contains actual words (not just punctuation/space)
                if (/[a-zA-Z0-9]/.test(sentenceText)) {
                    const span = document.createElement('span');
                    span.textContent = sentenceText;
                    span.className = 'tts-sentence';
                    span.dataset.sentenceIndex = sentenceIndex.toString();
                    fragment.appendChild(span);
                    sentences.push(sentenceText.trim());
                    sentenceIndex++;
                } else {
                    // Append non-sentence text (whitespace, isolated punctuation) as is
                    fragment.appendChild(document.createTextNode(sentenceText));
                }
            });

            return fragment;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Don't process script/style tags
            const tagName = (node as Element).tagName.toLowerCase();
            if (tagName === 'script' || tagName === 'style') return node;

            // Recursively process children
            const childNodes = Array.from(node.childNodes);
            childNodes.forEach(child => {
                const processedChild = processNode(child);
                if (processedChild !== child) {
                    node.replaceChild(processedChild, child);
                }
            });
            return node;
        }
        return node;
    }

    processNode(doc.body);

    return {
        processedHtml: doc.body.innerHTML,
        sentences
    };
}
