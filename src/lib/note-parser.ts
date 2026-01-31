/**
 * note-parser.ts
 * 
 * Handles parsing of custom note content tags into HTML.
 * Legacy content (starting with HTML tags) is returned as-is.
 */
import { customToHtml } from "./content-converter";

export function parseNoteContent(content: string): string {
    if (!content) return "";

    const trimmed = content.trim();
    
    // Check for Custom Tags presence (Inclusive Regex)
    // Matches specific known tags OR generic [key:value] pattern
    if (
        /\[box:|\[size:|\[hl:|\[b\]|\[i\]|\[u\]|\[h\d\]|\[p\]|\[ul\]|\[ol\]|\[li\]|\[hr\]|\[table:|\[quiz:|\[[a-zA-Z]+:[^\]]+\]/.test(content)
    ) {
        return customToHtml(content);
    }
    
    // Otherwise, if it starts with HTML, treat as legacy/raw
    if (trimmed.startsWith("<") || trimmed.startsWith("&lt;")) {
        return content;
    }

    // Default: try parsing anyway
    return customToHtml(content);
}
