let csvNames = [];

document.getElementById('csvFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      csvNames = parseCSV(evt.target.result);
      document.getElementById('error').textContent = '';
      document.getElementById('checkBtn').disabled = false;
    } catch (err) {
      document.getElementById('error').textContent = err.message;
      csvNames = [];
      document.getElementById('checkBtn').disabled = true;
    }
    document.getElementById('result').innerHTML = '';
  };
  reader.readAsText(file);
});

document.getElementById('checkBtn').addEventListener('click', function () {
  let textContent = document.getElementById('namesBox').value;

  // Normalize text: add space before numbered lists if missing
  textContent = textContent.replace(/(\D)(\d+\.)/g, '$1 $2');

  textContent = textContent.toLowerCase();
  const isPresent = nameObj => nameObj.aliases.some(alias => {
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
    return regex.test(textContent);
  });
  const missing = csvNames.filter(nameObj => !isPresent(nameObj)).map(nameObj => nameObj.original);
  const present = csvNames.filter(nameObj => isPresent(nameObj)).map(nameObj => nameObj.original);
  showResult(missing, present);
});

document.getElementById('clearBtn').addEventListener('click', function () {
  document.getElementById('namesBox').value = '';
  document.getElementById('error').textContent = '';
  document.getElementById('result').innerHTML = '';
});

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  if (header.length < 2 || header[1].trim().toUpperCase() !== 'LEARNER NAME') {
    throw new Error("CSV must have header 'ID,NAME'");
  }
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    const name = parts.slice(1).join(',').trim(); // Handles names with commas
    // Split by comma and by parentheses, remove empty, trim
    const aliases = name
      .split(/,|\(|\)/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return { original: name, aliases };
  });
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showResult(missing, present) {
  const resultDiv = document.getElementById('result');
  if (csvNames.length === 0) {
    resultDiv.innerHTML = '';
    return;
  }

  let html = '';
  if (missing.length === 0) {
    html += '<div class="alert alert-success">All students are present!</div>';
  } else {
    html += `<div class="alert alert-warning"><b>Missing Students (${missing.length}):</b><ul class="mb-0">` +
      missing.map(name => `<li>${escapeHtml(name)}</li>`).join('') +
      '</ul></div>';
  }
  html += `<div class="alert alert-secondary"><b>Present Students (${present.length}):</b><ul class="mb-0">` +
    present.map(name => `<li>${escapeHtml(name)}</li>`).join('') +
    '</ul></div>';
  resultDiv.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
