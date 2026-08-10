// --- TIME UPDATER ---
function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    document.getElementById('local-time').textContent = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateTime, 1000);
updateTime(); // Initial call

// --- LISTENER COUNT ---
let listeners = Math.floor(Math.random() * 20) + 30; // Start between 30 and 50

function updateListeners() {
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    listeners = Math.max(12, listeners + change); // Never drop below 12
    document.getElementById('listener-count').textContent = `● ${listeners} online`;
    
    const nextTick = 2000 + Math.random() * 5000;
    setTimeout(updateListeners, nextTick);
}
setTimeout(updateListeners, 1000);

// --- YOUTUBE IFRAME API ---
const PLAYLIST_ID = 'PLJzVAPJOE4zM'; // Single unified playlist to play
let player;
let isDragging = false;

// 1. Load the API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. Initialize Player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // Load single playlist
    player.loadPlaylist({
        list: PLAYLIST_ID,
        listType: 'playlist',
        index: 0
    });
    
    // Wait slightly before setting shuffle to ensure load
    setTimeout(() => {
        player.setLoop(true);
        player.setShuffle(true);
    }, 1500);
    
    // Bind Controls
    document.getElementById('play-btn').addEventListener('click', () => {
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
        player.previousVideo();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        player.nextVideo();
    });
    
    // Start tracking progress
    setInterval(updateProgress, 1000);
}

function onPlayerStateChange(event) {
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    if (event.data === YT.PlayerState.PLAYING) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        updateMetadata();
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
    
    if (event.data === YT.PlayerState.UNSTARTED || event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING) {
        updateMetadata();
    }
}

function updateMetadata() {
    if (!player || !player.getVideoData) return;
    
    const data = player.getVideoData();
    if (data && data.video_id) {
        let title = data.title || 'Unknown Title';
        let artist = data.author || 'YouTube';
        
        // Attempt to split title if it follows "Artist - Title" format
        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0];
            title = parts.slice(1).join(' - ');
        }
        
        document.getElementById('track-title').textContent = title;
        document.getElementById('track-artist').textContent = artist;
        document.getElementById('thumbnail').src = `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    seconds = Math.floor(seconds);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateProgress() {
    if (!player || !player.getDuration || isDragging) return;
    
    const duration = player.getDuration();
    const current = player.getCurrentTime();
    
    if (duration > 0) {
        const percent = (current / duration) * 100;
        document.getElementById('progress-fill').style.width = `${percent}%`;
        document.getElementById('progress-scrubber').style.left = `${percent}%`;
        document.getElementById('time-display').textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }
    
    // Ensure metadata is populated in case events were missed
    const titleText = document.getElementById('track-title').textContent;
    if (titleText === 'Loading...' || titleText === 'Unknown Title') {
         updateMetadata();
    }
}

// --- SEEKING LOGIC ---
const progressContainer = document.getElementById('progress-bar-container');

progressContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleSeek(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        // Disable transitions during drag for snappier feel
        document.getElementById('progress-fill').style.transition = 'none';
        document.getElementById('progress-scrubber').style.transition = 'none';
        handleSeek(e);
    }
});

document.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        // Re-enable transitions
        document.getElementById('progress-fill').style.transition = 'width 0.1s linear';
        document.getElementById('progress-scrubber').style.transition = 'left 0.1s linear, transform 0.2s';
        handleSeek(e, true);
    }
});

function handleSeek(e, finalize = false) {
    if (!player || !player.getDuration) return;
    
    const rect = progressContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width)); // Clamp between 0 and width
    
    const percent = x / rect.width;
    
    document.getElementById('progress-fill').style.width = `${percent * 100}%`;
    document.getElementById('progress-scrubber').style.left = `${percent * 100}%`;
    
    const duration = player.getDuration();
    const seekTime = duration * percent;
    document.getElementById('time-display').textContent = `${formatTime(seekTime)} / ${formatTime(duration)}`;
    
    if (finalize) {
        player.seekTo(seekTime, true);
    }
}
