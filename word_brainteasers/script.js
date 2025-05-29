let currentSet = null;
let currentIndex = 0;
let answers = {};

// Folder selection handler
document.getElementById('folder-list').addEventListener('change', async (e) => {
    const folder = e.target.value;
    if (!folder) return;
    
    try {
        // Load answers
        const response = await fetch(`puzzles/${folder}/answers.json`);
        answers = await response.json();
        
        // Initialize game
        currentSet = folder;
        currentIndex = 0;
        loadImage(currentIndex);
        document.getElementById('game-interface').classList.remove('d-none');
        document.getElementById('answer-display').textContent = '';
    } catch (error) {
        alert('Error loading puzzle set. Please check your files.');
        console.error('Error loading puzzle set:', error);
    }
});

// Image loader
function loadImage(index) {
    const imageKeys = Object.keys(answers);
    if (index >= imageKeys.length) {
        alert('Congratulations! You completed this set!');
        document.getElementById('game-interface').classList.add('d-none');
        return;
    }
    
    const imageName = imageKeys[index];
    const img = document.getElementById('image-display');
    img.src = `puzzles/${currentSet}/${imageName}`;
    document.getElementById('answer-display').textContent = '';
}

// Reveal answer handler
document.getElementById('reveal-answer').addEventListener('click', () => {
    const imageKeys = Object.keys(answers);
    const currentImage = imageKeys[currentIndex];
    document.getElementById('answer-display').textContent = answers[currentImage];
});

// Next puzzle handler
document.getElementById('next-puzzle').addEventListener('click', () => {
    currentIndex++;
    loadImage(currentIndex);
});
