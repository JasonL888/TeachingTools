let attendees = [];

document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const lines = evt.target.result.split(/\r?\n/);
    attendees = [];
    for (let i = 1; i < lines.length; i++) { // skip header
      const line = lines[i].trim();
      if (!line) continue;
      const [no, ...nameParts] = line.split(',');
      const name = nameParts.join(',').trim();
      if (no && name) {
        attendees.push({ no: no.trim(), name });
      }
    }
    if (attendees.length > 0) {
      renderTable();
      document.getElementById('attendeeSection').classList.remove('d-none');
      document.getElementById('chosen').classList.add('d-none');
    } else {
      alert('No valid attendees found in the CSV.');
      document.getElementById('attendeeSection').classList.add('d-none');
    }
  };
  reader.readAsText(file);
});

function renderTable() {
  const tbody = document.querySelector('#attendeeTable tbody');
  tbody.innerHTML = '';
  attendees.forEach(att => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${att.no}</td><td>${att.name}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById('pickBtn').addEventListener('click', function() {
  if (attendees.length === 0) {
    document.getElementById('chosen').classList.remove('alert-info');
    document.getElementById('chosen').classList.add('alert-warning');
    document.getElementById('chosen').textContent = 'Please upload a CSV with attendees first!';
    document.getElementById('chosen').classList.remove('d-none');
    return;
  }
  const idx = Math.floor(Math.random() * attendees.length);
  //const chosen = attendees[idx];
  const chosen = attendees.splice(idx, 1)[0]; // Remove the chosen attendee from the list
  const chosenDiv = document.getElementById('chosen');
  renderTable(); // Update the table to reflect the remaining attendees
  chosenDiv.innerHTML = `<span>🎉 <strong>${chosen.no}. ${chosen.name}</strong> 🎉</span>`;
  chosenDiv.classList.remove('d-none', 'alert-warning');
  chosenDiv.classList.add('alert-info');
});
