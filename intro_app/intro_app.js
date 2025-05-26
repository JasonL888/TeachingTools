
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
