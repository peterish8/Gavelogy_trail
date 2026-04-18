// Extracts Indian legal case citations from HTML content.
// Matches patterns like "X v. Y (YEAR)" or "X v Y" with optional citation.
const CASE_PATTERN =
  /([A-Z][A-Za-z.\s&'()-]{2,60})\s+v\.\s+([A-Z][A-Za-z.\s&'()-]{2,60})(?:\s*\((\d{4})\))?/g;

// Broader fallback: any text containing " v. " with surrounding caps
const BROAD_PATTERN =
  /\b([A-Z][A-Za-z.\s&'-]{1,50})\s+v\.\s+([A-Z][A-Za-z.\s&'-]{1,50})/g;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanCaseName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/["""]/g, "")
    .trim()
    .replace(/\s*\(.*$/, "") // strip trailing bracket junk
    .trim();
}

export interface ExtractedCase {
  name: string; // "Maneka Gandhi v. Union of India (1978)"
  shortName: string; // "Maneka Gandhi v. UoI"
}

export function extractKeyCases(html: string): ExtractedCase[] {
  if (!html) return [];

  const text = stripHtml(html);
  const seen = new Set<string>();
  const results: ExtractedCase[] = [];

  const addCase = (petitioner: string, respondent: string, year?: string) => {
    const p = cleanCaseName(petitioner);
    const r = cleanCaseName(respondent);
    if (p.length < 3 || r.length < 3) return;
    // Skip generic phrases
    if (/^(the|a|an|this|that|it|he|she|they|court|state|union|india)$/i.test(p)) return;

    const name = year ? `${p} v. ${r} (${year})` : `${p} v. ${r}`;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    // Shorten respondent to first meaningful word(s) if > 3 words
    const rWords = r.split(" ");
    const shortR = rWords.length > 3 ? rWords.slice(0, 2).join(" ") : r;
    results.push({ name, shortName: `${p} v. ${shortR}` });
  };

  // Try specific pattern first
  let match: RegExpExecArray | null;
  CASE_PATTERN.lastIndex = 0;
  while ((match = CASE_PATTERN.exec(text)) !== null) {
    addCase(match[1], match[2], match[3]);
  }

  // If we found nothing, try broad pattern
  if (results.length === 0) {
    BROAD_PATTERN.lastIndex = 0;
    while ((match = BROAD_PATTERN.exec(text)) !== null) {
      addCase(match[1], match[2]);
    }
  }

  return results.slice(0, 6); // cap at 6 so the panel doesn't overflow
}
