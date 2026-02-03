// Initialize Mermaid with HD settings
mermaid.initialize({ 
    startOnLoad: true, 
    theme: 'neutral',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: false },
    gantt: { useMaxWidth: false }
});

const inputField = document.getElementById('mermaid-input');
const outputArea = document.getElementById('graph-output');
const statusTag = document.getElementById('status-tag');
const renderBtn = document.getElementById('render-btn');
const downloadBtn = document.getElementById('download-btn');

// 1. Render Function
async function renderDiagram() {
    const code = inputField.value;
    
    updateStatus('working', 'RENDERING...');
    
    outputArea.removeAttribute('data-processed');
    outputArea.innerHTML = code;

    try {
        await mermaid.run({ nodes: [outputArea] });
        updateStatus('success', 'SUCCESS');
    } catch (error) {
        updateStatus('error', 'SYNTAX ERROR');
        outputArea.innerHTML = `<div class="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <strong>Render Error:</strong> Please check your Mermaid syntax.
        </div>`;
    }
}

// 2. High-Res Download Function
function downloadPNG() {
    const container = document.getElementById('diagram-container');
    
    if (!outputArea.querySelector('svg')) {
        alert("Please render a diagram first.");
        return;
    }

    updateStatus('working', 'EXPORTING HD...');

    html2canvas(container, {
        scale: 3, // 300% resolution
        useCORS: true,
        backgroundColor: "#ffffff",
        width: container.scrollWidth,  // Captures full width even if hidden
        height: container.scrollHeight // Captures full height even if hidden
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `diagram-hd-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        updateStatus('success', 'EXPORT COMPLETE');
    });
}

// Helper to change status UI
function updateStatus(type, text) {
    statusTag.innerText = text;
    statusTag.className = `status-${type}`;
}

// Event Listeners
renderBtn.addEventListener('click', renderDiagram);
downloadBtn.addEventListener('click', downloadPNG);