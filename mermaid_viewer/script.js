// Initialize Mermaid with HD settings
function initMermaid(ganttWidth) {
    mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
        sequence: { useMaxWidth: false },
        // Gantt sizes itself from its parent's width at render time, which is tiny
        // (mermaid renders into an off-screen element), so pass the width explicitly
        gantt: { useMaxWidth: false, useWidth: ganttWidth }
    });
}

// Fit gantt charts to the visible preview area (minus the .mermaid padding)
function fitGanttWidth() {
    const container = document.getElementById('diagram-container');
    return Math.max(800, container.clientWidth - 96);
}

initMermaid(fitGanttWidth());

const inputField = document.getElementById('mermaid-input');
const outputArea = document.getElementById('graph-output');
const statusTag = document.getElementById('status-tag');
const renderBtn = document.getElementById('render-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const toggleCodeBtn = document.getElementById('toggle-code-btn');
const editorPanel = document.getElementById('editor-panel');

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
    Crash --> [*]`,

    gantt: `gantt
    title ABC Bank AI Programme - Project Plan
    dateFormat YYYY-MM-DD
    axisFormat %b %Y
    tickInterval 1month

    section M1 Data Foundation
    KD1 Customer DB       :crit, kd1, 2027-01-04, 13w
    KD2 Analytical store  :crit, kd2, after kd1, 13w

    section M2 Reporting and Applications
    KD3 Dashboard         :crit, kd3, after kd2, 8w
    KD4 Customer view     :kd4, after kd1, 12w

    section M3 Predictive Models
    KD5 Fraud model       :kd5, 2027-01-04, 21w
    KD6 Loan model        :kd6, after kd1, 15w
    KD8 News model        :kd8, 2027-05-31, 8w
    KD7 Segmentation      :kd7, after kd2 kd6, 12w

    section M4 Agents and Assistants
    KD11 Knowledge bot    :kd11, 2027-01-04, 13w
    KD9 Customer agent    :kd9, after kd11, 17w
    KD10 Internal bot     :kd10, after kd4 kd9, 12w`
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
    initMermaid(fitGanttWidth());

    outputArea.removeAttribute('data-processed');
    outputArea.innerHTML = code;

    try {
        await mermaid.run({ nodes: [outputArea] });
        useNaturalSize(outputArea.querySelector('svg'));
        updateStatus('success', 'SUCCESS');
    } catch (error) {
        updateStatus('error', 'SYNTAX ERROR');
        outputArea.innerHTML = `<div class="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <strong>Render Error:</strong> Please check your Mermaid syntax.
        </div>`;
    }
}

// Some diagram types (state, class, ER, ...) emit width="100%" and rely on
// max-width, which our CSS removes, so they balloon to fill the panel.
// Pin them to their natural size (the viewBox) instead.
function useNaturalSize(svg) {
    const viewBox = svg && svg.viewBox && svg.viewBox.baseVal;
    if (!viewBox || !viewBox.width) return;
    svg.style.width = `${viewBox.width}px`;
    svg.style.maxWidth = 'none';
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
        backgroundColor: "#282a36",
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

// 3. Clear Text Function
function clearText() {
    inputField.value = '';
    outputArea.removeAttribute('data-processed');
    outputArea.innerHTML = '';
    sampleSelector.value = '';
    updateStatus('ready', 'READY');
    inputField.focus();
}

// 4. Show/hide the code panel; re-render so the diagram fits the new width
function toggleCode() {
    const collapsed = editorPanel.classList.toggle('collapsed');
    toggleCodeBtn.textContent = collapsed ? 'Show code' : 'Hide code';
    if (outputArea.querySelector('svg')) renderDiagram();
}

// Helper to change status UI
function updateStatus(type, text) {
    statusTag.innerText = text;
    statusTag.className = `status-${type}`;
}

// Event Listeners
renderBtn.addEventListener('click', renderDiagram);
downloadBtn.addEventListener('click', downloadPNG);
clearBtn.addEventListener('click', clearText);
toggleCodeBtn.addEventListener('click', toggleCode);