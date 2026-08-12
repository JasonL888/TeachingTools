const ZERO_WIDTH_NON_JOINER = '‌';
const INSERT_PROBABILITY = 0.35;
const MIN_WORD_LENGTH = 3;

function disruptWatermark(text) {
  let count = 0;
  const disrupted = text.replace(/\S+/g, (word) => {
    if (word.length < MIN_WORD_LENGTH) return word;
    if (Math.random() > INSERT_PROBABILITY) return word;
    const pos = 1 + Math.floor(Math.random() * (word.length - 1));
    count++;
    return word.slice(0, pos) + ZERO_WIDTH_NON_JOINER + word.slice(pos);
  });
  return { disrupted, count };
}

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const statusLine = document.getElementById('statusLine');
const disruptBtn = document.getElementById('disruptBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');

function showStatus(message) {
  statusLine.textContent = message;
  statusLine.classList.remove('d-none');
}

disruptBtn.addEventListener('click', () => {
  const { disrupted, count } = disruptWatermark(inputText.value);
  outputText.value = disrupted;
  showStatus(`Inserted ${count} invisible character${count === 1 ? '' : 's'}.`);
});

clearBtn.addEventListener('click', () => {
  inputText.value = '';
  outputText.value = '';
  statusLine.classList.add('d-none');
});

copyBtn.addEventListener('click', async () => {
  if (!outputText.value) return;
  await navigator.clipboard.writeText(outputText.value);
  const originalLabel = copyBtn.textContent;
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = originalLabel;
  }, 1500);
});
