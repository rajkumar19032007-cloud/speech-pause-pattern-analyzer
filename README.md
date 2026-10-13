# 04 - Speech Pause Pattern Analyzer

A real-time speech analytics tool built for the **Text and Speech Analysis** laboratory course. It captures spoken audio using the browser's Web Speech Recognition API, calculates speaking pace (Words Per Minute), tracks observable acoustic silence pauses using timing deltas, and measures disfluency patterns such as customizable filler words and consecutive word repetitions.

> [!IMPORTANT]
> **Educational & Ethical Disclaimer:** This software is strictly an educational tool for public speaking practice, acoustic metrics measurement, and linguistic study. It does **not** diagnose stuttering, speech pathography, or clinical speech-language disorders. Hesitations, pauses, and filler words are natural, healthy features of spontaneous human communication.

---

## 1. Project Title
**Speech Pause Pattern Analyzer** (Project 04 of 10)

## 2. Project Description
Spoken communication differs markedly from written text: spontaneous speech is characterized by dynamic pacing, natural acoustic pauses, conversational hesitation tokens (*"um"*, *"uh"*, *"like"*), and cognitive processing delays. This application quantifies these observable properties in real time, enabling students to practice public speaking pacing and observe how speech rate and pauses correlate with lexical choices.

## 3. Objectives
- Utilize the Web Speech API with real-time speech hypothesis tracking.
- Measure inter-speech event time intervals to detect and log observable acoustic pauses without fabricating timestamps.
- Implement customizable filler word detection using whole-word regular expression boundaries.
- Detect consecutive duplicate words (*"is is"*, *"the the"*).
- Calculate real-time speaking pace in Words Per Minute (WPM).
- Provide a robust manual text fallback for environments without microphone support.

## 4. Features
- **Live Audio Transcription:** Continuous speech-to-text recording with real-time text streaming.
- **Microphone Status Indicator:** Visual pulse dot displaying idle, active recording, and error states.
- **Observable Acoustic Pause Log:** Tracks real-time elapsed time between speech results; flags silence deltas $\ge 1.3\text{s}$ as observable pauses.
- **Pacing Metrics (WPM):** Computes words per minute based on actual elapsed stopwatch time.
- **Customizable Filler Word Tag Manager:** Add or delete custom filler words or phrases (*"um"*, *"uh"*, *"like"*, *"you know"*, etc.) directly in the interface.
- **Accurate Whole-Word Matching:** Matches complete words only, preventing false positives inside legitimate words.
- **Consecutive Word Repetition Detection:** Flags immediately repeated words.
- **Detailed Pattern Summary:** Displays total filler count, filler-to-word percentage ratio, repeated words, and pause durations.
- **Sample Speech Loader:** Preloads authentic spoken sample text with simulated pause timestamps for immediate testing.
- **Full Offline Capabilities:** Client-side processing with zero third-party tracking.

## 5. Technologies Used
- **HTML5:** Semantic accessible controls, ARIA live region status badges.
- **CSS3:** Muted purple theme, status indicator animations, and responsive dual-column grid.
- **Web Speech API (`SpeechRecognition`):** Browser-native speech recognition pipeline.
- **Vanilla JavaScript (ES6+):** Timestamp delta tracking, whole-word regex matching, and DOM manipulation.
- **Node.js (Optional):** Zero-dependency static server for `http://localhost` testing.

## 6. How It Works
1. **Audio Recording:** The user clicks **Start Recording**. The system initiates `SpeechRecognition` and starts a high-resolution session stopwatch.
2. **Pause Tracking:** As the user speaks, speech recognition `onresult` events fire. The timestamp difference between consecutive speech hypotheses is measured:
   $$\Delta t = t_{\text{current}} - t_{\text{previous}}$$
   If $\Delta t \ge 1.3\text{ seconds}$, an observable acoustic pause is logged with its duration and time offset.
3. **Lexical Analysis:**
   - The user clicks **Analyze Speech Patterns** (or recording stops).
   - The transcript is parsed using regex word boundaries for each configured filler word.
   - Consecutive duplicated tokens are identified using back-references (`\b(\w+)\s+\1\b`).
4. **Summary Compilation:** Total word count, Words Per Minute, filler percentage ratio, and pause log metrics are computed and displayed.

## 7. Algorithm Explanation

### A. Non-Fabricated Acoustic Pause Detection
Unlike systems that guess pause positions from commas or periods, this tool measures true chronological timestamps:
$$\text{Pause}(\Delta t) = \begin{cases} \text{LogPause}(\Delta t), & \text{if } \Delta t \ge 1.3\text{s} \\ \text{Ignore}, & \text{otherwise} \end{cases}$$
If a user pastes text manually, the tool honestly reports that acoustic pause timing is unavailable for static text, rather than inventing false timestamps.

### B. Whole-Word Filler Matching
To prevent substring contamination (such as matching *"well"* inside *"welcome"* or *"like"* inside *"likelihood"*), whole-word boundaries `\b` are strictly applied:
```javascript
const regex = new RegExp(`\\b${escapeRegExp(fillerWord)}\\b`, "gi");
```

### C. Speaking Pace (Words Per Minute)
$$\text{WPM} = \text{Round}\left(\frac{\text{Word Count}}{\text{Duration in Seconds} / 60}\right)$$
Division by zero is guarded; if duration is zero, an informative fallback is displayed.

### D. Filler Ratio
$$\text{Filler Ratio (\%)} = \left(\frac{\text{Total Detected Fillers}}{\text{Total Spoken Words}}\right) \times 100$$

## 8. Installation Instructions
No external dependencies required.

```bash
cd 04-speech-pause-pattern-analyzer
```

## 9. How to Run Locally

### Secure Context Note
Live speech recognition requires a Secure Context (`http://localhost` or HTTPS).

### Option A: Run Built-In Dev Server (Recommended)
```bash
npm run dev
```
Open your browser at `http://localhost:3004`.

### Option B: Direct Browser Opening (Manual Mode)
Double-click `index.html` to open in any browser. Manual text entry and sample speech testing operate with full functionality.

### Option C: Run Automated Tests
```bash
npm test
```

## 10. Example Input and Expected Output

### Input Speech:
```text
Um, good afternoon everyone. Today I am, uh, actually going to speak about, like, artificial intelligence.
Basically, AI is is transforming how we communicate.
```

### Expected Output:
- **Duration:** 15 seconds
- **Word Count:** 21 words
- **Speaking Pace:** ~84 WPM
- **Filler Word Count:** 5 (um: 1, uh: 1, actually: 1, like: 1, basically: 1)
- **Filler Ratio:** 23.8%
- **Consecutive Repeats:** 1 (`is is`)
- **Pause Log:** Pause #1: 1.6s at offset 6s

## 11. Project Structure
```text
04-speech-pause-pattern-analyzer/
├── index.html         # Application layout and control dashboard
├── style.css          # Muted purple theme, tag styling, pause cards
├── script.js          # Speech recognition events, pause deltas, regex counters
├── package.json       # Dev server and test runner scripts
├── .gitignore         # Git ignore exclusions
└── README.md          # Comprehensive documentation and viva prep
```

## 12. Browser Compatibility Notes
- **Google Chrome / Microsoft Edge:** Full Web Speech API support for live speech recognition and pause delta logging.
- **Safari:** Partial Web Speech API support.
- **Firefox:** Web Speech API disabled by default; manual input and sample speech testing remain fully functional.

## 13. Limitations
- **Streaming Cloud Latency:** In some browsers, Web Speech API results are streamed to platform servers. Variable network latency may introduce minor variance ($\pm 200\text{ms}$) into measured pause intervals.
- **Lexical Ambiguity of "Like" and "Well":** The words *"like"* and *"well"* function both as filler words (*"I was, like, thinking"*) and legitimate grammatical parts of speech (*"I like apples"*, *"He speaks well"*). Pure rule-based lexical matching flags all instances based on the configured list.

## 14. Future Enhancements
- Integrate a local Web Audio API `AudioContext` and `ScriptProcessorNode`/`AudioWorklet` to measure true root-mean-square (RMS) decibel audio volume for offline silence detection.
- Add part-of-speech context tagging to distinguish discourse markers from verbs.

## 15. Screenshot Placeholder
```text
+--------------------------------------------------------------------+
|  [PROJECT 04] Speech Pause Pattern Analyzer                        |
+--------------------------------------------------------------------+
|  [🎤 Start Recording]  [⏹ Stop]  [📊 Analyze]  [📄 Load Sample]    |
|  Duration: 00:38 | Words: 64 | Pace: 101 WPM | Pauses: 3           |
+---------------------------------+----------------------------------+
|  SPEECH TRANSCRIPT              | SPEECH PATTERN SUMMARY           |
|  "Um, good afternoon everyone.  | • Filler Count: 13 (Ratio: 20%)  |
|  Today I am, uh, actually..."   | • Repeated Words: 1 ("is is")    |
|                                 | • Pause 1: 1.6s at 9s            |
|                                 | • Pause 2: 2.1s at 21s           |
+---------------------------------+----------------------------------+
```

## 16. Viva Preparation: Questions & Answers

### Q1: How does the application detect acoustic pauses during a live recording?
**Answer:** The application captures timestamps upon each successful `onresult` event from the `SpeechRecognition` instance. By computing the delta $\Delta t = t_i - t_{i-1}$, any interval exceeding the threshold ($1.3$ seconds) is logged as an observable acoustic pause with its duration and time offset.

### Q2: Why must we never fabricate pause timestamps when analyzing pasted or manual text?
**Answer:** In scientific software, integrity of measurement is paramount. Written text contains no acoustic timing information. Inventing fake timestamps undermines scientific validity and misleads users. The application honestly discloses that acoustic pause logs require live microphone sessions.

### Q3: Why is whole-word matching critical when counting filler words?
**Answer:** If whole-word boundaries `\b` are omitted, substring collisions occur. For instance, looking for the filler *"er"* inside words like *"person"*, *"teacher"*, or *"water"* would produce massive false positives. Word boundary anchors guarantee that only standalone tokens are counted.

### Q4: Why is it ethically necessary to include a medical disclaimer for speech analysis tools?
**Answer:** Linguistic hesitations, filler words, and pauses are normal features of human speech planning. Diagnosing speech pathologies like stuttering or apraxia requires specialized clinical training and diagnostic equipment. Educational tools must clearly state they do not provide medical diagnoses to avoid creating unnecessary anxiety.

### Q5: How is Words Per Minute (WPM) calculated, and how is division by zero prevented?
**Answer:** Speaking rate is calculated as:
$$\text{WPM} = \frac{\text{Word Count}}{\text{Duration in Minutes}}$$
If the user stops immediately or analyzes text with an elapsed time of zero seconds, dividing by zero would yield `Infinity` or `NaN`. The code guards against this condition by verifying that $\text{Duration} > 0$ before computing the rate.

---

## 17. Git Upload Instructions
To publish this project to an independent GitHub repository:

```bash
# 1. Initialize git
git init

# 2. Stage all project files
git add .

# 3. Commit files
git commit -m "Initial commit: Project 04 Speech Pause Pattern Analyzer"

# 4. Set default branch to main
git branch -M main

# 5. Link your independent GitHub repository
git remote add origin YOUR_GITHUB_REPOSITORY_URL

# 6. Push to GitHub
git push -u origin main
```
*(Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual remote URL).*

---

## 18. License
This project is licensed under the **MIT License**.
