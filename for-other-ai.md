# Gavelogy — Tasks for External AI

> This is a Next.js 15 + TypeScript 5 + Supabase + Tailwind CSS 4 app for CLAT PG exam prep.
> Dev server: `npm run dev` → runs on port 3001.
> All source code is in `src/`. Use `cn()` from `src/lib/utils.ts` for className merging.
> Supabase client (browser): `src/lib/supabase-client.ts`. Server/API routes: `src/lib/supabase.ts`.

---

## Task A — Razorpay Payment Integration

### Context
`src/lib/payment.ts` has a fake payment flow:
- Line 125: `await new Promise(resolve => setTimeout(resolve, 5000))` — fake delay
- Line 128: `const orderId = \`ORDER_\${Date.now()}_\${Math.random()...}\`` — fake order ID
- Line 221: `isContentFree()` always returns `false` — free tier not implemented
- Lines 25-27: Placeholder course IDs: `{ id: "legacy-static" }`, `{ id: "legacy-contemporary" }`

Replace all of this with real Razorpay integration.

### Steps

**1. Install dependency**
```bash
npm install razorpay
```

**2. Add environment variables** (tell user to add these to `.env.local` and Vercel dashboard):
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

**3. Create `src/app/api/payment/create-order/route.ts`**
- POST endpoint
- Validate user is authenticated via Supabase auth header
- Accept `{ courseId: string }` in body
- Look up course price from `courses` table in Supabase
- Create Razorpay order: `{ amount: price * 100, currency: 'INR', receipt: \`rcpt_\${Date.now()}\` }`
- Return `{ orderId, amount, currency, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID }`

**4. Create `src/app/api/payment/verify/route.ts`**
- POST endpoint
- Accept `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, userId }`
- Verify HMAC-SHA256: `hmac = HMAC(razorpay_key_secret, \`\${order_id}|\${payment_id}\`)` — must match `razorpay_signature`
- If valid: insert into `course_purchases` table `{ user_id, course_id, order_id: razorpay_order_id, payment_id: razorpay_payment_id, purchased_at: now() }`
- Return `{ success: true }` or `{ error: 'Invalid signature' }`

**5. Update `src/lib/payment.ts`**

Replace `purchaseCourse()` function body:
```typescript
// 1. Call /api/payment/create-order to get Razorpay order details
// 2. Load Razorpay checkout script dynamically (if not loaded)
// 3. Open Razorpay modal with: key, amount, currency, order_id, name: 'Gavelogy', prefill: { email: user.email }
// 4. On payment success handler: call /api/payment/verify
// 5. On verify success: update local payment store (usePaymentStore)
// 6. On failure/dismiss: return error to caller
```

Fix `isContentFree(courseId)`:
- Query `courses` table for `is_free` column
- Return `true` if `is_free === true`

Remove placeholder course IDs (lines 25-27) — courses should come from DB query, not hardcoded constants.

---

## Task B — TTS State Persistence

### Context
`src/app/course-viewer/page.tsx` already has TTS implemented (lines ~191, 1219-1315).
- `useTTS` hook is imported (line 21)
- TTS controls (play/pause/speed/scrubbing) are in the UI
- **Problem**: TTS position resets when user navigates away and comes back

### Steps

In `src/app/course-viewer/page.tsx`:

1. Find where `useTTS` is initialized (around line 191)
2. After TTS initializes, restore position from localStorage:
```typescript
const TTS_STORAGE_KEY = `tts-position-${noteItemId}`;
// On mount: read localStorage.getItem(TTS_STORAGE_KEY) → parse { sentenceIndex, speed }
// Apply restored sentenceIndex and speed to TTS state
```
3. On page unmount (useEffect cleanup) or when sentenceIndex changes:
```typescript
// Save: localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify({ sentenceIndex: currentIndex, speed: currentSpeed }))
```
4. Clear the stored position when user finishes (reaches last sentence)

---

## Task C — TranslateWidget Completion

### Context
`src/app/course-viewer/page.tsx` line ~1162 renders `<TranslateWidget>`.
Find the component at `src/components/TranslateWidget.tsx` (may be a stub or near-empty).

### Steps

Build/complete `src/components/TranslateWidget.tsx`:

1. Simple language toggle: English ↔ Hindi (EN / हि)
2. Use [MyMemory free translation API](https://api.mymemory.translated.net/get?q=TEXT&langpair=en|hi) — no API key needed for small usage
3. Widget UI: a small floating button/pill showing current language, click to toggle
4. On toggle to Hindi:
   - Find all readable text content on the page (target the main content area, not navigation)
   - Call translation API for each paragraph (batch if possible)
   - Replace DOM content with translated text
5. On toggle back to English: restore original content (keep copy in state)
6. Persist language preference: `localStorage.setItem('gavelogy-lang', 'hi'|'en')`
7. On mount: read preference and apply automatically

**Note**: Use `'use client'` directive. Keep it lightweight — no heavy i18n libraries needed.

---

## Task D — Auth Localhost Bypass Cleanup

### Context
The auth system has a dev-only localhost bypass that was accidentally left in production code.

**Files to fix**:
- `src/lib/auth-context.tsx` — lines ~27-45, 64-74, 139-141
- `src/lib/stores/auth.ts` — lines ~558-606

Both files check `window.location.hostname === 'localhost'` to skip real Supabase auth and use a mock user from localStorage (`gavelogy-localhost-auth`).

### Steps

In **both** files, wrap every `isLocalhost` check with a `NODE_ENV` guard:

```typescript
// BEFORE:
const isLocalhost = window.location.hostname === 'localhost';

// AFTER:
const isLocalhost = process.env.NODE_ENV === 'development' && 
                    window.location.hostname === 'localhost';
```

This single change ensures:
- Dev mode (local): bypass still works for quick testing
- Vercel production: real Supabase OAuth always used, no bypass possible

Search for ALL occurrences of `isLocalhost` in both files and make sure they all use the updated variable. Also check for any direct `hostname === 'localhost'` comparisons not using the variable.

---

## Task E — PDF Downloads in Desktop Split-View

### Context
`src/app/course-viewer/page.tsx`:
- Lines ~1194, 1204: Download button `onClick` handlers are commented out:
  ```tsx
  onClick={() => { setShowDownloadMenu(false); /* handleDownload() */ }}
  onClick={() => { setShowDownloadMenu(false); /* handlePageByPageDownload() */ }}
  ```
- Mobile/fullscreen versions (lines ~1514, 1524) work fine with the same handlers

### Steps
1. Find the desktop split-view download buttons (around lines 1194, 1204)
2. Uncomment `handleDownload()` and `handlePageByPageDownload()` — these functions are already implemented elsewhere in the file
3. Verify the handlers are the same ones used in mobile view
4. Add a try/catch around the call with a toast error message if PDF generation fails:
   ```typescript
   try {
     await handleDownload();
   } catch (e) {
     toast.error('PDF generation failed. Please try again.');
   }
   ```

---

## Verification Checklist for Other AI's Tasks

- [ ] **Razorpay**: Click "Buy Course" → Razorpay modal opens with correct amount → complete payment → course appears in user's dashboard
- [ ] **Razorpay verify**: Tampered signature returns 400 error, not success
- [ ] **TTS**: Navigate to a case, start TTS at sentence 10 → navigate away → come back → TTS resumes at sentence 10
- [ ] **Translate**: Toggle to Hindi → page content translates → toggle back → English restored → refresh page → persists last language
- [ ] **Auth**: Deploy to Vercel → inspect network tab → no `gavelogy-localhost-auth` reads in production
- [ ] **PDF Desktop**: Open course in split-view → click download → PDF generates and downloads
