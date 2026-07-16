let remaining = [];
let selected = [];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const lines = evt.target.result.split(/\r?\n/);
    remaining = [];
    selected = [];
    for (let i = 1; i < lines.length; i++) { // skip header
      const line = lines[i].trim();
      if (!line) continue;
      const [no, ...nameParts] = line.split(',');
      const name = nameParts.join(',').trim();
      if (no && name) {
        remaining.push({ no: no.trim(), name });
      }
    }
    if (remaining.length > 0) {
      renderLists();
      document.getElementById('attendeeSection').classList.remove('d-none');
      document.getElementById('chosen').classList.add('d-none');
      document.getElementById('listsWrapper').classList.add('d-none');
      document.getElementById('toggleListsBtn').textContent = 'Show List';
    } else {
      alert('No valid attendees found in the CSV.');
      document.getElementById('attendeeSection').classList.add('d-none');
    }
  };
  reader.readAsText(file);
});

document.getElementById('toggleListsBtn').addEventListener('click', function() {
  const wrapper = document.getElementById('listsWrapper');
  const hidden = wrapper.classList.toggle('d-none');
  this.textContent = hidden ? 'Show List' : 'Hide List';
});

function renderLists() {
  const remainingList = document.getElementById('remainingList');
  const selectedList = document.getElementById('selectedList');
  remainingList.innerHTML = remaining.map(att => `<li>${att.no}. ${escapeHtml(att.name)}</li>`).join('');
  selectedList.innerHTML = selected.map(att => `<li>${att.no}. ${escapeHtml(att.name)}</li>`).join('');
  document.getElementById('remainingCount').textContent = remaining.length;
  document.getElementById('selectedCount').textContent = selected.length;
}

document.getElementById('pickBtn').addEventListener('click', function() {
  if (remaining.length === 0) {
    document.getElementById('chosen').classList.remove('alert-secondary');
    document.getElementById('chosen').classList.add('alert-warning');
    document.getElementById('chosen').textContent = 'Please upload a CSV with attendees first!';
    document.getElementById('chosen').classList.remove('d-none');
    return;
  }
  const idx = Math.floor(Math.random() * remaining.length);
  const chosen = remaining.splice(idx, 1)[0]; // Remove the chosen attendee from the list
  selected.push(chosen);
  const chosenDiv = document.getElementById('chosen');
  renderLists(); // Update the lists to reflect the remaining/selected attendees
  chosenDiv.innerHTML = `<span>🎉 <strong>${chosen.no}. ${escapeHtml(chosen.name)}</strong> 🎉</span>`;
  chosenDiv.classList.remove('d-none', 'alert-warning');
  chosenDiv.classList.add('alert-secondary');
});
