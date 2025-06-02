let csvNames = [];

document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
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

document.getElementById('checkBtn').addEventListener('click', function() {
  const textContent = document.getElementById('namesBox').value.toLowerCase();
  const missing = csvNames.filter(nameObj => {
    // For each alias, check if present in text
    return !nameObj.aliases.some(alias => {
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
      return regex.test(textContent);
    });
  }).map(nameObj => nameObj.original);
  showResult(missing);
});

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  if (header.length < 2 || header[1].trim().toUpperCase() !== 'NAME') {
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

function showResult(missing) {
  const resultDiv = document.getElementById('result');
  if (missing.length === 0 && csvNames.length > 0) {
    resultDiv.innerHTML = '<div class="alert alert-success">All students are present!</div>';
  } else if (missing.length > 0) {
    resultDiv.innerHTML = '<div class="alert alert-warning"><b>Missing Students:</b><ul class="mb-0">' +
      missing.map(name => `<li>${escapeHtml(name)}</li>`).join('') +
      '</ul></div>';
  } else {
    resultDiv.innerHTML = '';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
