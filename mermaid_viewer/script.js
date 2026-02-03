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

const sampleSelector = document.getElementById('sample-selector');

const samples = {
    flowchart: `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Enjoy]
    B -- No --> D[Debug]
    D --> B`,

    sequence: `sequenceDiagram
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,

    timeline: `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook : Google
    2005 : Youtube
    2006 : Twitter`,

    mindmap: `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping`,

    state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`
};

// Handle Selection
sampleSelector.addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected && samples[selected]) {
        inputField.value = samples[selected];
        renderDiagram(); // Automatically render when selected
    }
});

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