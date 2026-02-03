let player;
let monitorInterval;

/**
 * Converts HH:MM:SS or MM:SS to total seconds
 */
function timestampToSeconds(timestamp) {
    if (!timestamp) return 0;
    const parts = timestamp.split(':').map(Number);
    let seconds = 0;

    if (parts.length === 3) {
        // HH:MM:SS
        seconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        seconds = (parts[0] * 60) + parts[1];
    } else {
        // Just seconds
        seconds = parts[0] || 0;
    }
    return seconds;
}

function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

function loadVideo() {
    const urlInput = document.getElementById('videoUrl').value;
    const videoId = extractVideoId(urlInput);
    
    // Convert the timestamp strings to numbers
    const start = timestampToSeconds(document.getElementById('startTime').value);
    const end = timestampToSeconds(document.getElementById('endTime').value);
    
    if (!videoId) {
        alert("Please enter a valid YouTube URL");
        return;
    }

    if (player) {
        player.destroy();
    }

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
            'onReady': (event) => onPlayerReady(event, end, start),
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event, end, start) {
    event.target.playVideo();
    startMonitoring(end, start);
}

function startMonitoring(end, start) {
    if (monitorInterval) clearInterval(monitorInterval);

    monitorInterval = setInterval(() => {
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
        const start = timestampToSeconds(document.getElementById('startTime').value);
        const end = timestampToSeconds(document.getElementById('endTime').value);
        startMonitoring(end, start);
    } else {
        clearInterval(monitorInterval);
    }
}