# Speech Technology Audit
**Date:** 2026-10-24  
**Verdict:** The entire speech stack is built on browser APIs that are unreliable, unrecorded, and incompatible with the product's core value proposition.

---

## What Is Currently Used

The product uses **two browser-native Web APIs** for all speech functionality:

| Feature | API Used | Where |
|---|---|---|
| Candidate speech → text | `window.SpeechRecognition` / `window.webkitSpeechRecognition` | `interview-session.tsx`, `practice-session.tsx`, `hooks/use-speech-to-text.ts` |
| AI reads question aloud | `window.speechSynthesis` / `SpeechSynthesisUtterance` | `interview-session.tsx`, `hooks/use-text-to-speech.ts` |
| Audio level visualization | `AudioContext` + `AnalyserNode` | `audio-visualizer.tsx` |

No third-party speech service is used anywhere. No audio is sent to a server. No audio is stored.

---

## Problem 1 — The Candidate's Voice Is Never Recorded

This is the most fundamental gap in the product.

The interview flow works like this:
1. Candidate clicks "Start Answering"
2. `window.SpeechRecognition` runs locally in the browser
3. The browser converts speech to text in real-time
4. That text is sent to Gemini for scoring
5. The audio is **discarded entirely**

The `Answer` model in the schema has `audioUrl String?` and `videoUrl String?` fields — both are always `null`. The interview session requests camera access (`getUserMedia`) and shows a live video feed, but **never records or uploads it**.

**What this means:**
- Employers cannot replay a candidate's interview
- There is no audio evidence if a candidate claims their answer was mistranscribed
- The AI can only score the text transcript, not tone, pace, or confidence
- A key differentiator of AI interview platforms — recorded playback — is completely absent

---

## Problem 2 — Web Speech API Is Unreliable and Fragmented

`window.SpeechRecognition` is a browser API with significant limitations:

| Limitation | Impact |
|---|---|
| **Chrome-only in practice** | Firefox has no `SpeechRecognition` support. Safari support is inconsistent. The entire product silently breaks on ~30% of browsers. |
| **Stops after 60 seconds of silence** | The `onend` event fires and the interview session attempts to restart it — this restart can fail silently, meaning a candidate speaks and nothing is transcribed |
| **No offline support** | Chrome's Web Speech API sends audio to Google's servers. Users on restricted networks (corporate firewalls, VPNs) may find it blocked |
| **Quality degrades with accents** | Particularly relevant for the Indian market — Hindi-accented English, regional accents, and code-switching between Hindi and English produce poor transcripts |
| **No confidence scores** | The API provides one transcript with no quality metric. There is no way to know if a word was 90% confident or 40% confident |
| **Cannot be tested** | Since it runs in the browser, server-side tests and integration tests cannot cover the transcription path |

The current code handles the `onend` restart with:
```ts
recognition.onend = () => {
    if (isRecordingRef.current) {
        try { recognition.start(); } catch (e) { console.error(e); }
    }
};
```
This is a best-effort workaround, not a reliable solution.

---

## Problem 3 — Text-to-Speech Uses the Browser's Default Voice

`window.speechSynthesis` reads questions aloud using whatever voice the user's OS has installed. On Windows this is typically "Microsoft David" or "Microsoft Zira". On macOS it is "Alex" or a Siri voice. On Android it varies by manufacturer.

The voice quality and accent is completely outside the product's control. For an interview platform targeting Indian candidates, a robotic system voice reading questions in an American accent is a jarring experience.

---

## Problem 4 — The Two Speech Hooks Are Redundant

There are two parallel implementations of the same speech functionality:

- `hooks/use-speech-to-text.ts` — a clean, reusable hook
- `hooks/use-text-to-speech.ts` — a clean, reusable hook

**Neither is used in the interview session.**

`interview-session.tsx` reimplements both from scratch inline — its own `recognitionRef`, its own `speakQuestion()` function, its own language handling, its own restart-on-end logic. The hooks exist only in `practice-session.tsx`.

The result is two divergent implementations of the same thing, with the production interview session using the ad-hoc one that has more edge cases and no language support in the hook version.

---

## What Needs to Change

### Short term — document the browser compatibility gap

Add a browser check on the interview start page. If `window.SpeechRecognition` is not available, show a clear message: "This interview requires Google Chrome or Microsoft Edge." Do not silently fail.

### Medium term — replace Web Speech API with a real STT service

Options ranked by fit for this product:

| Service | Quality | Accent Support | Price | Notes |
|---|---|---|---|---|
| **Deepgram** | Excellent | Strong (Nova-2 model) | ~$0.0043/min | Returns word-level timestamps, confidence scores, language detection |
| **AssemblyAI** | Excellent | Good | ~$0.0062/min | Strong diarization, sentiment analysis — useful for interview scoring |
| **Google Cloud Speech-to-Text** | Very good | Excellent for Indian English | ~$0.004/min | Best for Hindi/English code-switching |
| **Whisper (OpenAI)** | Very good | Good | ~$0.006/min | Can self-host; no streaming |
| **Azure Cognitive Services** | Good | Good | ~$0.004/min | Strong enterprise trust signal |

**Recommendation: Deepgram** — real-time streaming WebSocket API, best latency for live transcription, strong Indian English support, returns word-level confidence so low-confidence segments can be flagged.

### Medium term — record the audio

Once on a real STT service, the audio stream should be:
1. Uploaded to R2/S3 during the interview (chunked upload)
2. URL stored in `Answer.audioUrl`
3. Made available for employer playback in the results dashboard

The `getUserMedia` stream is already captured in `interview-session.tsx` — recording it with `MediaRecorder` is a small addition to the existing setup.

### Medium term — replace speechSynthesis with ElevenLabs or similar

For question readback, replace `window.speechSynthesis` with a consistent, high-quality voice:

| Service | Voice Quality | Latency | Notes |
|---|---|---|---|
| **ElevenLabs** | Best in class | ~300ms | Most natural; Indian English voice available |
| **Cartesia** | Excellent | ~80ms | Fastest; purpose-built for real-time |
| **Google Text-to-Speech (Neural2)** | Very good | ~200ms | Consistent; good Indian English voices |
| **OpenAI TTS** | Very good | ~400ms | Simple API; `tts-1` model |

**Recommendation: Google TTS Neural2** — already in the Google ecosystem (Gemini), consistent Indian English voice, low cost (~$0.000016/character).

---

## Cost Estimate for a Real Speech Stack

For 1,000 interviews per month, each averaging 20 minutes:

| Component | Service | Monthly Cost |
|---|---|---|
| Speech-to-text (20 min × 1,000) | Deepgram Nova-2 | ~$86 |
| Text-to-speech (8 questions × ~20 words × 1,000) | Google Neural2 | ~$3 |
| Audio storage (avg 5MB/interview × 1,000) | Cloudflare R2 | ~$0.75 |
| **Total** | | **~$90/month** |

At ₹499/month per Pro subscriber, 20 Pro users covers this cost entirely.

---

## Summary

The product is using the speech equivalent of `<input type="file">` where it needs a database. The Web Speech API was an acceptable shortcut to get the product working, but it is now the ceiling on quality, reliability, and the employer-facing feature set. No paid speech service is needed today, but the migration path should be documented and budgeted.
