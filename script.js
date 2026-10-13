/**
 * Speech Pause Pattern Analyzer
 * Project 04 - Text & Speech Analysis
 *
 * Implements observable acoustic pause tracking, customizable filler word analysis,
 * consecutive word repetition detection, and speaking pace metrics.
 *
 * NOTE: Educational tool only. Does not diagnose clinical speech disorders.
 */

// Default configurable filler words
let configuredFillers = [
  "um", "uh", "er", "like", "actually", "basically", "you know", "sort of", "i mean", "well", "right"
];

// Sample speech text
const SAMPLE_SPEECH = `Um, good afternoon everyone. Today I am, uh, actually going to speak about, like, artificial intelligence.
Basically, AI is is transforming how we communicate every day.
Er, you know, we often speak rapidly without realizing how often we repeat words or, like, pause to gather thoughts.
Sort of like when someone is nervous during an interview, they might say, well, right, um, fascinating things.`;

// DOM and Browser Integration
if (typeof document !== "undefined") {
  const compatBanner = document.getElementById("compatBanner");
  const compatMessage = document.getElementById("compatMessage");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const durationDisplay = document.getElementById("durationDisplay");
  const wordCountDisplay = document.getElementById("wordCountDisplay");
  const wpmDisplay = document.getElementById("wpmDisplay");
  const pauseCountDisplay = document.getElementById("pauseCountDisplay");
  const startRecBtn = document.getElementById("startRecBtn");
  const stopRecBtn = document.getElementById("stopRecBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const sampleSpeechBtn = document.getElementById("sampleSpeechBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusMessage = document.getElementById("statusMessage");
  const newFillerInput = document.getElementById("newFillerInput");
  const addFillerBtn = document.getElementById("addFillerBtn");
  const fillerTagsContainer = document.getElementById("fillerTagsContainer");
  const transcriptInput = document.getElementById("transcriptInput");
  const copyTranscriptBtn = document.getElementById("copyTranscriptBtn");
  const emptySummaryMsg = document.getElementById("emptySummaryMsg");
  const resultsContent = document.getElementById("resultsContent");

  // Summary Metrics Elements
  const totalFillerCount = document.getElementById("totalFillerCount");
  const fillerRatioVal = document.getElementById("fillerRatioVal");
  const repeatedWordCount = document.getElementById("repeatedWordCount");
  const pauseTimeVal = document.getElementById("pauseTimeVal");
  const fillerBreakdownList = document.getElementById("fillerBreakdownList");
  const repeatedWordsList = document.getElementById("repeatedWordsList");
  const pauseLog = document.getElementById("pauseLog");

  let recognition = null;
  let isRecording = false;
  let timerInterval = null;
  let elapsedSeconds = 0;
  let lastSpeechTimestamp = null;
  let recordedPauses = []; // Array of { duration: seconds, timestamp: Date }
  let finalTranscript = "";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    compatBanner.classList.remove("hidden");
    compatMessage.innerHTML = "<strong>Notice:</strong> Native Web Speech API is not supported in this browser. Live recording is disabled, but you can paste or type transcripts manually to analyze filler words and repetitions.";
    startRecBtn.disabled = true;
  } else {
    initSpeechRecognition();
  }

  // Initialize Filler Tags
  renderFillerTags();

  // Event Listeners
  if (startRecBtn) startRecBtn.addEventListener("click", startRecording);
  if (stopRecBtn) stopRecBtn.addEventListener("click", stopRecording);
  if (analyzeBtn) analyzeBtn.addEventListener("click", handleAnalyze);
  if (sampleSpeechBtn) sampleSpeechBtn.addEventListener("click", loadSampleSpeech);
  if (clearBtn) clearBtn.addEventListener("click", handleClear);
  if (addFillerBtn) addFillerBtn.addEventListener("click", addFillerWord);
  if (newFillerInput) {
    newFillerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addFillerWord();
    });
  }
  if (transcriptInput) transcriptInput.addEventListener("input", updateLiveWordMetrics);
  if (copyTranscriptBtn) copyTranscriptBtn.addEventListener("click", copyTranscript);

  function initSpeechRecognition() {
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        isRecording = true;
        setStatus("recording", "Recording live speech...");
        startRecBtn.disabled = true;
        stopRecBtn.disabled = false;
        recordedPauses = [];
        lastSpeechTimestamp = Date.now();
        startTimer();
      };

      recognition.onresult = (event) => {
        const now = Date.now();
        if (lastSpeechTimestamp !== null) {
          const deltaSec = (now - lastSpeechTimestamp) / 1000;
          // Threshold of 1.3 seconds indicates an observable acoustic pause
          if (deltaSec >= 1.3) {
            recordedPauses.push({
              duration: parseFloat(deltaSec.toFixed(1)),
              timeOffset: elapsedSeconds
            });
            pauseCountDisplay.textContent = recordedPauses.length;
          }
        }
        lastSpeechTimestamp = now;

        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + event.results[i][0].transcript.trim();
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        transcriptInput.value = (finalTranscript + (interim ? " " + interim : "")).trim();
        updateLiveWordMetrics();
      };

      recognition.onerror = (event) => {
        let msg = `Speech error: ${event.error}`;
        if (event.error === "not-allowed") {
          msg = "Microphone access denied. Please grant permission in browser settings.";
        }
        showStatus(msg, "error");
        setStatus("error", "Error: " + event.error);
      };

      recognition.onend = () => {
        if (isRecording) {
          stopRecording();
        }
      };
    } catch (err) {
      console.warn("Speech init failed:", err);
    }
  }

  function startRecording() {
    if (!recognition) return;
    clearStatus();
    finalTranscript = transcriptInput.value.trim();
    elapsedSeconds = 0;
    recordedPauses = [];
    try {
      recognition.start();
    } catch (err) {
      showStatus("Could not start recording: " + err.message, "error");
    }
  }

  function stopRecording() {
    isRecording = false;
    stopTimer();
    setStatus("idle", "Status: Ready / Stopped");
    startRecBtn.disabled = false;
    stopRecBtn.disabled = true;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    updateLiveWordMetrics();
    // Auto analyze on recording stop
    handleAnalyze();
  }

  function setStatus(state, label) {
    statusDot.className = `status-dot status-${state}`;
    statusText.textContent = label;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
      const secs = String(elapsedSeconds % 60).padStart(2, "0");
      durationDisplay.textContent = `${mins}:${secs}`;
      updateLiveWordMetrics();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    durationDisplay.textContent = "00:00";
    wpmDisplay.textContent = "0 WPM";
    pauseCountDisplay.textContent = "0";
  }

  function updateLiveWordMetrics() {
    const text = transcriptInput.value.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    wordCountDisplay.textContent = words;

    if (elapsedSeconds > 0) {
      const minutes = elapsedSeconds / 60;
      const wpm = Math.round(words / minutes);
      wpmDisplay.textContent = `${wpm} WPM`;
    }
  }

  function showStatus(msg, type = "error") {
    statusMessage.textContent = msg;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove("hidden");
  }

  function clearStatus() {
    statusMessage.textContent = "";
    statusMessage.className = "status-message hidden";
  }

  function renderFillerTags() {
    fillerTagsContainer.innerHTML = configuredFillers.map((word, idx) => `
      <span class="filler-chip">
        ${escapeHtml(word)}
        <span class="filler-chip-remove" data-index="${idx}" title="Remove word">&times;</span>
      </span>
    `).join("");

    const removeBtns = fillerTagsContainer.querySelectorAll(".filler-chip-remove");
    removeBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"), 10);
        configuredFillers.splice(idx, 1);
        renderFillerTags();
      });
    });
  }

  function addFillerWord() {
    const word = newFillerInput.value.trim().toLowerCase();
    if (!word) return;
    if (configuredFillers.includes(word)) {
      showStatus(`'${word}' is already in the list.`, "error");
      return;
    }
    configuredFillers.push(word);
    newFillerInput.value = "";
    clearStatus();
    renderFillerTags();
  }

  function loadSampleSpeech() {
    if (isRecording) stopRecording();
    clearStatus();
    transcriptInput.value = SAMPLE_SPEECH;
    finalTranscript = SAMPLE_SPEECH;
    elapsedSeconds = 38; // Realistic recorded duration for ~60 words
    durationDisplay.textContent = "00:38";
    // Simulated realistic pause data for sample speech
    recordedPauses = [
      { duration: 1.6, timeOffset: 9 },
      { duration: 2.1, timeOffset: 21 },
      { duration: 1.4, timeOffset: 30 }
    ];
    pauseCountDisplay.textContent = recordedPauses.length;
    updateLiveWordMetrics();
    handleAnalyze();
    showStatus("Sample speech loaded with timing simulation!", "success");
    setTimeout(clearStatus, 3500);
  }

  function handleClear() {
    if (isRecording) stopRecording();
    transcriptInput.value = "";
    finalTranscript = "";
    recordedPauses = [];
    resetTimer();
    clearStatus();
    wordCountDisplay.textContent = "0";
    emptySummaryMsg.classList.remove("hidden");
    resultsContent.classList.add("hidden");
  }

  function handleAnalyze() {
    clearStatus();
    const text = transcriptInput.value.trim();

    if (!text) {
      showStatus("Transcript is empty. Please record audio or paste speech text.", "error");
      emptySummaryMsg.classList.remove("hidden");
      resultsContent.classList.add("hidden");
      return;
    }

    const analysis = analyzeSpeechPatterns(text, configuredFillers, recordedPauses, elapsedSeconds);

    // Update Overview Cards
    totalFillerCount.textContent = analysis.totalFillers;
    fillerRatioVal.textContent = `${analysis.fillerRatio}%`;
    repeatedWordCount.textContent = analysis.repeatedWords.length;
    pauseTimeVal.textContent = `${analysis.totalPauseDuration}s`;
    wpmDisplay.textContent = `${analysis.wpm} WPM`;

    // Render Filler Breakdown
    renderFillerBreakdown(analysis.fillerBreakdown);

    // Render Repeated Words
    renderRepeatedWords(analysis.repeatedWords);

    // Render Pause Log
    renderPauseLog(analysis.pauses);

    emptySummaryMsg.classList.add("hidden");
    resultsContent.classList.remove("hidden");
  }

  function renderFillerBreakdown(breakdown) {
    if (breakdown.length === 0) {
      fillerBreakdownList.innerHTML = `<div style="color:var(--text-muted);font-style:italic;">No configured filler words found. Great fluency!</div>`;
      return;
    }
    fillerBreakdownList.innerHTML = breakdown.map(item => `
      <div class="breakdown-row">
        <span class="breakdown-word">"${escapeHtml(item.word)}"</span>
        <span class="breakdown-count">${item.count} instance${item.count > 1 ? "s" : ""}</span>
      </div>
    `).join("");
  }

  function renderRepeatedWords(repeats) {
    if (repeats.length === 0) {
      repeatedWordsList.innerHTML = `<div style="color:var(--text-muted);font-style:italic;">No consecutive repeated words detected.</div>`;
      return;
    }
    repeatedWordsList.innerHTML = repeats.map(item => `
      <div class="breakdown-row">
        <span class="breakdown-word">"${escapeHtml(item.phrase)}"</span>
        <span class="breakdown-count">Consecutive repetition</span>
      </div>
    `).join("");
  }

  function renderPauseLog(pauses) {
    if (!pauses || pauses.length === 0) {
      pauseLog.innerHTML = `
        <div style="font-style:italic;padding:8px 0;">
          No live acoustic pauses recorded. (Pause timing requires an active microphone session; manual transcripts measure lexical patterns).
        </div>
      `;
      return;
    }
    pauseLog.innerHTML = pauses.map((p, idx) => `
      <div class="pause-item">
        <strong>Pause #${idx + 1}:</strong> Duration <strong>${p.duration}s</strong> (at elapsed offset ~${p.timeOffset}s)
      </div>
    `).join("");
  }

  function copyTranscript() {
    const text = transcriptInput.value.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showStatus("Transcript copied to clipboard!", "success");
      setTimeout(clearStatus, 3000);
    });
  }
}

/**
 * Speech Processing Logic (Pure Functions & Testing)
 */

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Detect Filler Words using strict whole-word boundaries
 */
function detectFillerWords(text, fillerList) {
  const breakdown = [];
  let totalFillers = 0;

  for (const filler of fillerList) {
    const clean = filler.trim().toLowerCase();
    if (!clean) continue;

    const regex = new RegExp(`\\b${escapeRegExp(clean)}\\b`, "gi");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      totalFillers += matches.length;
      breakdown.push({
        word: clean,
        count: matches.length
      });
    }
  }

  breakdown.sort((a, b) => b.count - a.count);
  return { breakdown, totalFillers };
}

/**
 * Detect Consecutive Duplicate Words
 */
function detectRepeatedWords(text) {
  const repeats = [];
  const regex = /\b([a-zA-Z]+)\s+\1\b/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    repeats.push({
      phrase: match[0],
      word: match[1]
    });
  }

  return repeats;
}

/**
 * Calculate Aggregate Speech Pattern Analysis
 */
function analyzeSpeechPatterns(text, fillerList, pauses = [], durationSeconds = 0) {
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const wordCount = words.length;

  const { breakdown: fillerBreakdown, totalFillers } = detectFillerWords(text, fillerList);
  const repeatedWords = detectRepeatedWords(text);

  const fillerRatio = wordCount > 0 ? ((totalFillers / wordCount) * 100).toFixed(1) : 0;

  let totalPauseDuration = 0;
  for (const p of pauses) {
    totalPauseDuration += p.duration || 0;
  }
  totalPauseDuration = parseFloat(totalPauseDuration.toFixed(1));

  let wpm = 0;
  if (durationSeconds > 0) {
    wpm = Math.round((wordCount / (durationSeconds / 60)));
  } else if (wordCount > 0) {
    // Standard conversational baseline assumption if manual text
    wpm = 130;
  }

  return {
    wordCount,
    totalFillers,
    fillerRatio,
    fillerBreakdown,
    repeatedWords,
    pauses,
    totalPauseDuration,
    wpm
  };
}

// Module export for unit test verification
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    configuredFillers,
    SAMPLE_SPEECH,
    detectFillerWords,
    detectRepeatedWords,
    analyzeSpeechPatterns
  };
}
