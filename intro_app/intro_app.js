const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 40;
canvas.height = window.innerHeight - 200;

let people = [];
let nodes = [];
let links = [];
let draggingNode = null;

// Color scheme
const colors = {
    name: '#ff6b6b',
    work: '#4ecdc4',
    interest: '#45b7d1'
};

class Node {
    constructor(id, label, type) {
        this.id = id;
        this.label = label;
        this.type = type;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.radius = getNodeRadius(label, ctx);
    }
}

function getNodeRadius(label, ctx) {
    ctx.font = "14px Arial";
    const textWidth = ctx.measureText(label).width;
    const padding = 10;
    return Math.ceil(textWidth / 2) + padding;
}

function addPerson() {
    const name = document.getElementById('name').value;
    const work = document.getElementById('work').value;
    const interest = document.getElementById('interest').value;

    if (!name || !work || !interest) return;

    // Add name node
    const nameNode = new Node(nodes.length, name, 'name');
    nodes.push(nameNode);

    // Add/move work node
    let workNode = nodes.find(n => n.type === 'work' && n.label === work);
    if (!workNode) {
        workNode = new Node(nodes.length, work, 'work');
        nodes.push(workNode);
    }

    // Add/move interest node
    let interestNode = nodes.find(n => n.type === 'interest' && n.label === interest);
    if (!interestNode) {
        interestNode = new Node(nodes.length, interest, 'interest');
        nodes.push(interestNode);
    }

    // Create links
    links.push({ source: nameNode.id, target: workNode.id });
    links.push({ source: nameNode.id, target: interestNode.id });

    // Store person data
    people.push({ name, work, interest });

    // Clear inputs
    document.getElementById('name').value = '';
    document.getElementById('work').value = '';
    document.getElementById('interest').value = '';
}

function applyPhysics() {
    const repulsion = 1500;
    const springStrength = 0.15;
    const springLength = 100;

    // Repulsion forces
    nodes.forEach(a => {
        nodes.forEach(b => {
            if (a === b) return;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsion / Math.pow(distance, 1.5);
            a.vx += (dx / distance) * force;
            a.vy += (dy / distance) * force;
        });
    });

    // Spring forces
    links.forEach(link => {
        const a = nodes[link.source];
        const b = nodes[link.target];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - springLength) * springStrength;

        a.vx += (dx / distance) * force;
        a.vy += (dy / distance) * force;
        b.vx -= (dx / distance) * force;
        b.vy -= (dy / distance) * force;
    });

    // Apply movement
    nodes.forEach(node => {
        if (node === draggingNode) return;

        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary checks
        node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
        node.y = Math.max(20, Math.min(canvas.height - 20, node.y));
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    ctx.strokeStyle = '#cccccc';
    links.forEach(link => {
        const a = nodes[link.source];
        const b = nodes[link.target];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
        ctx.fillStyle = colors[node.type];
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 5);
    });
}

function animate() {
    if (!draggingNode) applyPhysics();
    draw();
    requestAnimationFrame(animate);
}

// Drag and drop functionality
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    nodes.forEach(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            draggingNode = node;
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (draggingNode) {
        const rect = canvas.getBoundingClientRect();
        draggingNode.x = e.clientX - rect.left;
        draggingNode.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', () => {
    draggingNode = null;
});

// Replaces/implements application logic: storage, rendering, sorting, import/export.

(() => {
  const STORAGE_KEY = "students";
  const tableBody = document.querySelector("#studentsTable tbody");
  const tableHead = document.querySelectorAll("#studentsTable thead th.sortable");
  const addBtn = document.getElementById("addBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");

  let students = loadStudents();
  let sortState = { col: null, dir: 1 }; // dir: 1 = asc, -1 = desc

  // Event wiring
  addBtn.addEventListener("click", addPerson);
  exportBtn.addEventListener("click", exportData);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", handleImport);

  tableHead.forEach(th => {
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-col");
      toggleSort(col, th);
    });
  });

  // Initial render
  renderTable();

  // --- Storage helpers ---
  function loadStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load students:", e);
      return [];
    }
  }

  function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }

  // --- CRUD ---
  function addPerson() {
    const name = document.getElementById("name").value.trim();
    const work = document.getElementById("work").value.trim();
    const interest = document.getElementById("interest").value.trim();
    if (!name && !work && !interest) return;

    const item = {
      id: Date.now(),
      name,
      work,
      interest
    };

    students.push(item);
    saveStudents();
    clearInputs();
    renderTable();
  }

  function clearInputs() {
    document.getElementById("name").value = "";
    document.getElementById("work").value = "";
    document.getElementById("interest").value = "";
    document.getElementById("name").focus();
  }

  function deleteStudent(id) {
    students = students.filter(s => s.id !== id);
    saveStudents();
    renderTable();
  }

  // --- Import / Export ---
  function exportData() {
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImport(evt) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          // simple merge: replace current list (could also append)
          students = parsed.map(item => ({
            id: item.id || Date.now() + Math.floor(Math.random() * 10000),
            name: item.name || "",
            work: item.work || "",
            interest: item.interest || ""
          }));
          saveStudents();
          renderTable();
        } else {
          alert("Imported JSON must be an array of student objects.");
        }
      } catch (err) {
        alert("Failed to parse JSON: " + err);
      } finally {
        importFile.value = "";
      }
    };
    reader.readAsText(file);
  }

  // --- Rendering & Sorting ---
  function renderTable() {
    // sort copy for display
    let rows = students.slice();
    if (sortState.col) {
      rows.sort((a, b) => {
        const va = String(a[sortState.col] || "").toLowerCase();
        const vb = String(b[sortState.col] || "").toLowerCase();
        if (va < vb) return -1 * sortState.dir;
        if (va > vb) return 1 * sortState.dir;
        return 0;
      });
    }

    tableBody.innerHTML = "";
    if (rows.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="text-muted">No students yet</td>`;
      tableBody.appendChild(tr);
      updateSortIndicators();
      return;
    }

    for (const s of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.work)}</td>
        <td>${escapeHtml(s.interest)}</td>
        <td>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${s.id}" title="Delete">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    }

    // attach delete handlers
    tableBody.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = Number(btn.getAttribute("data-id"));
        if (confirm("Remove this student?")) deleteStudent(id);
      });
    });

    updateSortIndicators();
  }

  function toggleSort(col, th) {
    if (sortState.col === col) {
      sortState.dir = -sortState.dir; // flip
    } else {
      sortState.col = col;
      sortState.dir = 1;
    }
    renderTable();
  }

  function updateSortIndicators() {
    document.querySelectorAll("#studentsTable thead th.sortable").forEach(th => {
      const col = th.getAttribute("data-col");
      const span = th.querySelector(".sort-indicator");
      span.innerHTML = "";
      if (sortState.col === col) {
        span.innerHTML = sortState.dir === 1 ? " ▲" : " ▼";
      }
    });
  }

  // --- Utilities ---
  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>"'`=\/]/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    }[s]));
  }

})();

// Import/Export functionality
function exportData() {
    const data = JSON.stringify(people);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network-data.json';
    a.click();
    URL.revokeObjectURL(url);
}

function resizeCanvas() {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('form-section').offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        // Clear existing data
        people = [];
        nodes = [];
        links = [];
        // Parse and add each person
        const importedPeople = JSON.parse(e.target.result);
        importedPeople.forEach(person => {
            // Use the same logic as addPerson, but pass values directly
            const nameNode = new Node(nodes.length, person.name, 'name');
            nodes.push(nameNode);

            let workNode = nodes.find(n => n.type === 'work' && n.label === person.work);
            if (!workNode) {
                workNode = new Node(nodes.length, person.work, 'work');
                nodes.push(workNode);
            }

            let interestNode = nodes.find(n => n.type === 'interest' && n.label === person.interest);
            if (!interestNode) {
                interestNode = new Node(nodes.length, person.interest, 'interest');
                nodes.push(interestNode);
            }

            links.push({ source: nameNode.id, target: workNode.id });
            links.push({ source: nameNode.id, target: interestNode.id });

            people.push(person);
        });
        // Optionally, trigger a redraw here if needed
    };
    reader.readAsText(file);
});


// Start animation
animate();
