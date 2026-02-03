let player;
let monitorInterval;

function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

function loadVideo() {
    const urlInput = document.getElementById('videoUrl').value;
    const videoId = extractVideoId(urlInput);
    const start = parseInt(document.getElementById('startTime').value) || 0;
    
    if (!videoId) {
        alert("Please enter a valid YouTube URL");
        return;
    }

    if (player) {
        player.destroy();
    }

    // Creating the player instance
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'start': start,
            'autoplay': 1,
            'rel': 0,
            'origin': window.location.origin || '*' 
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
    startMonitoring();
}

function startMonitoring() {
    if (monitorInterval) clearInterval(monitorInterval);

    monitorInterval = setInterval(() => {
        const end = parseInt(document.getElementById('endTime').value);
        const start = parseInt(document.getElementById('startTime').value) || 0;
        const loop = document.getElementById('loopVideo').checked;

        if (player && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            
            if (currentTime >= end) {
                if (loop) {
                    player.seekTo(start);
                } else {
                    player.pauseVideo();
                    clearInterval(monitorInterval);
                }
            }
        }
    }, 200);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        startMonitoring();
    } else {
        clearInterval(monitorInterval);
    }
}