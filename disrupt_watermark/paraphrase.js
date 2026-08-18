const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const statusLine = document.getElementById('statusLine');
const paraphraseBtn = document.getElementById('paraphraseBtn');
const disruptBtn = document.getElementById('disruptBtn');
const clearBtn = document.getElementById('clearBtn');
const modelProgress = document.getElementById('modelProgress');
const modelProgressBar = document.getElementById('modelProgressBar');

function showStatus(message) {
  statusLine.textContent = message;
  statusLine.classList.remove('d-none');
}

function setBusy(busy) {
  paraphraseBtn.disabled = busy;
  disruptBtn.disabled = busy;
  clearBtn.disabled = busy;
}

// The model runs in a Web Worker rather than on the main thread. ONNX
// Runtime's WASM backend executes synchronously and would otherwise block
// all JS on the page — including our own status updates — for the entire
// duration of model init and each generation call, making a slow device
// look frozen instead of busy.
const worker = new Worker(new URL('./paraphrase.worker.js', import.meta.url), { type: 'module' });
let nextRequestId = 0;
const pendingRequests = new Map();

worker.onmessage = (event) => {
  const { type, id, data, result, message } = event.data;
  if (type === 'progress') {
    onProgress(data);
    return;
  }
  const pending = pendingRequests.get(id);
  if (!pending) return;
  pendingRequests.delete(id);
  if (type === 'error') pending.reject(new Error(message));
  else pending.resolve(result);
};

function callWorker(type, payload) {
  return new Promise((resolve, reject) => {
    const id = nextRequestId++;
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ type, id, payload });
  });
}

const fileProgress = new Map();
const initiatedWeightFiles = new Set();
const doneWeightFiles = new Set();
let downloadStartTime = null;
let stopInitHeartbeat = null;

function setIndeterminate(indeterminate) {
  modelProgressBar.classList.toggle('progress-bar-striped', indeterminate);
  modelProgressBar.classList.toggle('progress-bar-animated', indeterminate);
  if (indeterminate) modelProgressBar.style.width = '100%';
}

function formatMB(bytes) {
  return (bytes / 1_000_000).toFixed(0);
}

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

// Ticks a status message once per second so a long, otherwise-silent wait
// (WASM model init, a slow sentence generation) still visibly updates
// instead of looking frozen between the last real event and the next one.
function startHeartbeat(getMessage) {
  const start = performance.now();
  showStatus(getMessage(0));
  const id = setInterval(() => {
    showStatus(getMessage(Math.round((performance.now() - start) / 1000)));
  }, 1000);
  return () => clearInterval(id);
}

function onProgress(data) {
  if (!data.file) return;
  modelProgress.classList.remove('d-none');

  // Only the .onnx weight files report a real, stable Content-Length and
  // are big enough to matter. Small metadata files (tokenizer.json,
  // config.json, ...) are streamed without a known total, so the library
  // reports loaded===total on every chunk as a running counter — tracking
  // those would look like "100%" from the first byte.
  if (!data.file.endsWith('.onnx')) return;

  if (data.status === 'initiate') {
    initiatedWeightFiles.add(data.file);
    return;
  }

  if (data.status === 'progress') {
    fileProgress.set(data.file, { loaded: data.loaded, total: data.total });
  } else if (data.status === 'done') {
    doneWeightFiles.add(data.file);
    const existing = fileProgress.get(data.file);
    if (existing) fileProgress.set(data.file, { loaded: existing.total, total: existing.total });
  } else {
    return;
  }

  // All weight files have finished downloading: the remaining wait is the
  // model compiling in WASM, not a byte-progress-trackable download. This
  // can take anywhere from a few seconds to over a minute depending on the
  // device, so tick the status every second rather than leaving it static.
  if (initiatedWeightFiles.size > 0 && doneWeightFiles.size === initiatedWeightFiles.size) {
    setIndeterminate(true);
    if (!stopInitHeartbeat) {
      stopInitHeartbeat = startHeartbeat((s) => `Initializing model... (${s}s)`);
    }
    return;
  }

  // Wait until every weight file has reported real byte progress before
  // showing a percentage — otherwise a fast-finishing file (e.g. the
  // encoder) briefly looks like 100% while a bigger file hasn't started.
  for (const f of initiatedWeightFiles) {
    if (!fileProgress.has(f)) return;
  }

  const totals = [...fileProgress.values()];
  const loaded = totals.reduce((sum, f) => sum + f.loaded, 0);
  const total = totals.reduce((sum, f) => sum + f.total, 0);
  if (!total) return;

  if (downloadStartTime === null) downloadStartTime = performance.now();
  const elapsedSeconds = (performance.now() - downloadStartTime) / 1000;
  const speedBytesPerSec = elapsedSeconds > 1 ? loaded / elapsedSeconds : 0;
  const etaStr = speedBytesPerSec > 0 ? `, ~${formatDuration((total - loaded) / speedBytesPerSec)} left` : '';
  const speedStr = speedBytesPerSec > 0 ? ` at ${formatMB(speedBytesPerSec)} MB/s` : '';

  const pct = Math.round((loaded / total) * 100);
  setIndeterminate(false);
  modelProgressBar.style.width = `${pct}%`;
  showStatus(
    `Downloading paraphrasing model: ${pct}% ` +
      `(${formatMB(loaded)}/${formatMB(total)} MB${speedStr}${etaStr})`
  );
}

let modelLoaded = false;
let loadingPromise = null;

async function ensureModelLoaded() {
  if (modelLoaded) return;
  if (!loadingPromise) loadingPromise = callWorker('load');
  await loadingPromise;
  modelLoaded = true;
  if (stopInitHeartbeat) {
    stopInitHeartbeat();
    stopInitHeartbeat = null;
  }
  modelProgress.classList.add('d-none');
  setIndeterminate(false);
}

const FENCE_RE = /^\s*(```|~~~)/;
const HR_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const HEADING_RE = /^\s{0,3}#{1,6}\s/;
const LIST_MARKER_RE = /^(\s*(?:[-*+]|\d+[.)])\s+)/;
// A bold/italic span leading a line (e.g. "**TL;DR:** ..." or "**Full bold
// sentence.** More text.") — small models tend to just drop the masked
// placeholder when it stands in for a whole leading clause, so these are
// kept verbatim as a prefix instead of being paraphrased.
const LEADING_EMPHASIS_RE = /^(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)([ \t]*)/;

function splitIntoSentences(line) {
  return line
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

// Mask inline markdown spans (`code`, **bold**, __bold__, *italic*,
// _italic_) before sending a sentence to the model. Backtick spans in
// particular tend to make the small instruction-tuned model refuse
// ("I'm sorry, but I cannot paraphrase...") instead of returning prose;
// emphasis markers just get silently dropped from the output otherwise.
// Order matters: code spans first, then bold (wider match) before italic,
// so a *_-based italic marker inside already-masked text is never touched.
const MARKDOWN_SPAN_PATTERNS = [/`[^`]*`/g, /\*\*[^*]+\*\*/g, /__[^_]+__/g, /\*[^*]+\*/g, /_[^_]+_/g];

function maskMarkdownSpans(sentence) {
  const spans = [];
  let masked = sentence;
  for (const pattern of MARKDOWN_SPAN_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      spans.push(match);
      return `MDSPAN${spans.length - 1}`;
    });
  }
  return { masked, spans };
}

function unmaskMarkdownSpans(text, spans) {
  return text.replace(/MDSPAN(\d+)/g, (full, i) => spans[Number(i)] ?? full);
}

async function paraphraseSentence(sentence) {
  const { masked, spans } = maskMarkdownSpans(sentence);
  const result = await callWorker('generate', {
    prompt: `Paraphrase this sentence: ${masked}`,
    options: { max_new_tokens: 128, do_sample: false },
  });
  return unmaskMarkdownSpans(result.trim(), spans);
}

// Classifies a line so structural markdown (code fences, horizontal rules,
// headings) passes through untouched, list markers survive paraphrasing,
// and blank lines keep paragraph breaks intact.
function classifyLines(lines) {
  let inFence = false;
  return lines.map((line) => {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      return { type: 'literal', line };
    }
    if (inFence) return { type: 'literal', line };
    if (!line.trim()) return { type: 'literal', line: '' };
    if (HR_RE.test(line) || HEADING_RE.test(line)) return { type: 'literal', line };

    const listMatch = line.match(LIST_MARKER_RE);
    const listPrefix = listMatch ? listMatch[1] : '';
    const rest = listMatch ? line.slice(listPrefix.length) : line;

    const emphasisMatch = rest.match(LEADING_EMPHASIS_RE);
    if (emphasisMatch) {
      return { type: 'prose', prefix: listPrefix + emphasisMatch[0], line: rest.slice(emphasisMatch[0].length) };
    }
    return { type: 'prose', prefix: listPrefix, line: rest };
  });
}

paraphraseBtn.addEventListener('click', async () => {
  const text = inputText.value;
  if (!text.trim()) {
    showStatus('Enter some text to paraphrase first.');
    return;
  }

  setBusy(true);
  showStatus('Loading paraphrasing model...');

  try {
    await ensureModelLoaded();

    // Preserve original line breaks (and blank lines between paragraphs);
    // paraphrase sentence-by-sentence within each prose line, and leave
    // code fences, horizontal rules, headings, and list markers untouched.
    const lines = text.split('\n');
    const classified = classifyLines(lines);
    const lineSentences = classified.map((c) => (c.type === 'prose' ? splitIntoSentences(c.line) : []));
    const totalSentences = lineSentences.reduce((sum, s) => sum + s.length, 0);

    let done = 0;
    const paraphrasedLines = [];

    for (let i = 0; i < classified.length; i++) {
      const entry = classified[i];
      const sentences = lineSentences[i];

      if (entry.type === 'literal' || sentences.length === 0) {
        paraphrasedLines.push(entry.type === 'literal' ? entry.line : lines[i]);
        continue;
      }

      const paraphrasedSentences = [];
      for (const sentence of sentences) {
        done++;
        const label = `Paraphrasing sentence ${done} of ${totalSentences}`;
        const stopHeartbeat = startHeartbeat((s) => (s > 0 ? `${label}... (${s}s)` : `${label}...`));
        try {
          paraphrasedSentences.push(await paraphraseSentence(sentence));
        } finally {
          stopHeartbeat();
        }
      }
      paraphrasedLines.push(entry.prefix + paraphrasedSentences.join(' '));
    }

    outputText.value = paraphrasedLines.join('\n');
    showStatus(`Paraphrased ${totalSentences} sentence${totalSentences === 1 ? '' : 's'}.`);
  } catch (err) {
    console.error(err);
    showStatus('Paraphrasing failed. See console for details.');
  } finally {
    setBusy(false);
  }
});
