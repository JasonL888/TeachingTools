let player;
let monitorInterval;
let pendingAutoLoad = false;

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

function initFromQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    const url = params.get('url');
    const start = params.get('start');
    const end = params.get('end');
    const loop = params.get('loop');

    if (videoId) {
        document.getElementById('videoUrl').value = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url) {
        document.getElementById('videoUrl').value = url;
    }
    if (start) document.getElementById('startTime').value = start;
    if (end) document.getElementById('endTime').value = end;
    if (loop) document.getElementById('loopVideo').checked = (loop === '1' || loop === 'true');

    if (videoId || url) {
        pendingAutoLoad = true;
    }
}

function onYouTubeIframeAPIReady() {
    if (pendingAutoLoad) {
        pendingAutoLoad = false;
        loadVideo();
    }
}

function generateLink() {
    const url = document.getElementById('videoUrl').value;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    const loop = document.getElementById('loopVideo').checked;
    const videoId = extractVideoId(url);

    const params = new URLSearchParams();
    if (videoId) {
        params.set('v', videoId);
    } else if (url) {
        params.set('url', url);
    }
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    if (loop) params.set('loop', '1');

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);

    const btn = document.getElementById('copyLinkBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 1500);
}

document.addEventListener('DOMContentLoaded', initFromQueryParams);

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