let attendees = [];

document.getElementById('csvFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
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
            document.getElementById('attendeeSection').style.display = '';
            document.getElementById('chosen').style.display = 'none';
        } else {
            alert('No valid attendees found in the CSV.');
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

document.getElementById('pickBtn').addEventListener('click', function () {
    if (attendees.length === 0) return;
    const idx = Math.floor(Math.random() * attendees.length);
    const chosen = attendees[idx];
    const chosenDiv = document.getElementById('chosen');
    chosenDiv.innerHTML = `<h3>🎉 Chosen Attendee 🎉</h3>
        <p style="font-size:1.25rem;font-weight:bold;">${chosen.no}. ${chosen.name}</p>`;
    chosenDiv.style.display = '';
});