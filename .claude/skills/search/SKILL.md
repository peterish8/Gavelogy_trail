---
name: Search
description: Load when implementing full-text search across notes, questions, or cases using Supabase text search or a search service
---

# Purpose
Implement fast, relevant search across Gavelogy's content — cases, questions, and notes — using Supabase's built-in full-text search capabilities.

# When to Use
- Adding search to the cases page
- Implementing question search for quiz prep
- Building a global search (Cmd+K) modal
- Optimizing search performance
- Adding search filters and facets

# Core Concepts

## Supabase Full-Text Search Setup

```sql
-- Add tsvector column to cases table
ALTER TABLE cases ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED;

-- Create GIN index for fast search
CREATE INDEX cases_search_idx ON cases USING GIN (search_vector);

-- Add search to questions
ALTER TABLE questions ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(question_text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(explanation, '')), 'B')
  ) STORED;

CREATE INDEX questions_search_idx ON questions USING GIN (search_vector);
```

## Search Query from Client

```ts
// src/lib/search.ts

export async function searchCases(query: string, limit = 20) {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('cases')
    .select('id, title, description, category')
    .textSearch('search_vector', query, {
      type: 'websearch', // supports "quoted phrases" and -exclusions
      config: 'english',
    })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function searchQuestions(query: string, limit = 20) {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, case_id, difficulty')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

## Global Search (Cmd+K) Component

```tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { searchCases, searchQuestions } from '@/lib/search';
import { useDebounce } from '@/hooks/use-debounce';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ cases: any[]; questions: any[] }>({
    cases: [], questions: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Search on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ cases: [], questions: [] });
      return;
    }

    setIsSearching(true);
    Promise.all([
      searchCases(debouncedQuery, 5),
      searchQuestions(debouncedQuery, 5),
    ]).then(([cases, questions]) => {
      setResults({ cases, questions });
    }).finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-[var(--color-bg-elevated)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search className="h-5 w-5 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, questions..."
            className="flex-1 bg-transparent outline-none text-[var(--color-text)]"
          />
          <kbd className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isSearching && <p className="text-center py-4 text-sm text-[var(--color-text-muted)]">Searching...</p>}
          {!isSearching && results.cases.length === 0 && results.questions.length === 0 && query && (
            <p className="text-center py-4 text-sm text-[var(--color-text-muted)]">No results found</p>
          )}
          {/* Render results grouped by type */}
        </div>
      </motion.div>
    </div>
  );
}
```

## Debounce Hook

```ts
// src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

# Best Practices

1. **Debounce search input** — 300ms minimum to avoid excessive queries
2. **Use `websearch` type** — supports natural language queries
3. **Weight fields** — title (A) > description (B) > category (C)
4. **Limit results** — 10-20 max per category
5. **GIN index is required** — without it, search is O(n) full table scan
6. **Sanitize search input** — prevent SQL injection in raw queries

# Common Pitfalls

1. **No GIN index** → search is extremely slow on large tables
2. **Not debouncing** → fires a query on every keystroke
3. **Missing `tsvector` column** → can't use full-text search syntax
4. **English config on non-English text** → stemming doesn't work for Hindi/regional terms

# Related Skills
- `supabase-integration` — Database query patterns
- `input-validation` — Sanitizing search queries
- `framer-motion` — Search modal animations
