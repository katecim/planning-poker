const socket = io({ autoConnect: false });
const gooseHonk = new Audio('/assets/sounds/honk.mp3');
gooseHonk.preload = 'auto';
const reactionSounds = {
    '👻': new Audio('/assets/sounds/ghost-wooo.mp3'),
    '🙀': new Audio('/assets/sounds/cat-meow.mp3'),
    '🎅': new Audio('/assets/sounds/santaclaus_hohoho.mp3')
};
Object.values(reactionSounds).forEach(sound => {
    sound.preload = 'auto';
});
let currentUserId = null;
const reactionSoundTimers = new Map();
const reactionPlaybackIds = new Map();
const reactionPlaybackSegments = {
    '👻': { start: 0, duration: 2.8, fadeDuration: 0.5 },
    '🎅': { start: 4, duration: 3 }
};

function playGooseHonk() {
    gooseHonk.currentTime = 0;
    gooseHonk.play().catch(() => {});
}

function scheduleReactionStop(sound, emoji, playbackId, segment) {
    const fadeDuration = segment.fadeDuration || 0;
    const timer = setTimeout(() => {
        if (reactionPlaybackIds.get(emoji) !== playbackId) return;

        if (!fadeDuration) {
            sound.pause();
            sound.currentTime = segment.start;
            reactionSoundTimers.delete(emoji);
            return;
        }

        const fadeStartedAt = performance.now();
        const startingVolume = sound.volume;
        const fadeFrame = now => {
            if (reactionPlaybackIds.get(emoji) !== playbackId) return;

            const progress = Math.min((now - fadeStartedAt) / (fadeDuration * 1000), 1);
            sound.volume = startingVolume * (1 - progress);

            if (progress === 1) {
                sound.pause();
                sound.currentTime = segment.start;
                sound.volume = 1;
                reactionSoundTimers.delete(emoji);
            } else {
                requestAnimationFrame(fadeFrame);
            }
        };

        requestAnimationFrame(fadeFrame);
    }, (segment.duration - fadeDuration) * 1000);

    reactionSoundTimers.set(emoji, timer);
}

function playReactionSound(emoji) {
    const sound = reactionSounds[emoji];
    if (!sound) return;

    const existingTimer = reactionSoundTimers.get(emoji);
    if (existingTimer) clearTimeout(existingTimer);

    const playbackId = (reactionPlaybackIds.get(emoji) || 0) + 1;
    reactionPlaybackIds.set(emoji, playbackId);
    const segment = reactionPlaybackSegments[emoji];

    sound.pause();
    sound.volume = 1;
    sound.currentTime = segment?.start || 0;
    const playback = sound.play();

    if (segment) {
        playback.then(() => {
            if (reactionPlaybackIds.get(emoji) !== playbackId) return;
            scheduleReactionStop(sound, emoji, playbackId, segment);
        }).catch(() => {});
    } else {
        playback.catch(() => {});
    }
}

// Cache common elements
const screens = {
    login: document.getElementById('login-screen'),
    game: document.getElementById('game-screen'),
    logout: document.getElementById('logout-container'),
    admin: document.getElementById('admin-controls'),
    results: document.getElementById('results'),
    userList: document.getElementById('user-list'),
    status: document.getElementById('session-status'),
    bgWidget: document.getElementById('admin-bg-widget'),
    emojiControls: document.getElementById('emoji-controls')
};

/** Helpers **/
const toggleScreens = (isLoggedIn) => {
    screens.login.classList.toggle('hidden', isLoggedIn);
    screens.game.classList.toggle('hidden', !isLoggedIn);
    screens.logout.classList.toggle('hidden', !isLoggedIn);
    screens.emojiControls.classList.toggle('hidden', !isLoggedIn || !socket.connected);
};

// Background change
document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.onclick = () => {
        const bgType = btn.getAttribute('data-bg');
        
        socket.emit('change_bg', bgType)
    };
});

/** Socket Listeners **/
socket.on('init_constants', ({ deck, emojis, currentBg }) => {
    renderDeck(deck);
    renderEmojiButtons(emojis);

    if (currentBg) {
        document.body.className = `bg-${currentBg}`;

        document.querySelectorAll('.bg-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-bg') === currentBg;
            btn.classList.toggle('selected', isActive);
        });
    }
});

socket.on('update', (state) => {
    const me = state.users.find(user => user.id === currentUserId);

    // Sync UI
    if (me?.vote === null) {
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    }
    screens.admin.classList.toggle('hidden', !me?.isAdmin);
    screens.bgWidget.classList.toggle('hidden', !me?.isAdmin);

    // Render Users & Calculate
    let [total, count] = [0, 0];
    screens.userList.replaceChildren();
    state.users.forEach(user => {
        let display = user.vote === null ? '...' : '✔️';
        
        if (state.revealed) {
            display = user.vote ?? '-';
            if (typeof user.vote === 'number') { total += user.vote; count++; }
        }

        const row = document.createElement('li');
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = user.name;

        if (user.isAdmin) {
            const badge = document.createElement('span');
            badge.className = 'admin-badge';
            badge.textContent = 'Guide';
            name.append(badge);
        }

        if (!user.isOnline) {
            const presence = document.createElement('span');
            presence.className = 'presence-status';
            presence.textContent = 'Offline';
            name.append(presence);
        }

        const vote = document.createElement('span');
        vote.className = `vote ${state.revealed ? 'revealed' : ''}`;
        vote.textContent = String(display);

        row.append(name, vote);
        screens.userList.append(row);
    });

    // Results UI
    screens.results.classList.toggle('hidden', !state.revealed);
    if (state.revealed) {
        document.getElementById('average-score').innerText = count > 0 ? (total / count).toFixed(1) : 0;
        screens.status.innerText = "Votes Revealed!";
        screens.status.style.color = "var(--primary-color)";
    } else {
        screens.status.innerText = "Voting in progress...";
        screens.status.style.color = "rgba(255,255,255,0.7)";
    }
});

// Background change listener
socket.on('bg_changed', (bgType) => {
    document.body.className = `bg-${bgType}`;

    document.querySelectorAll('.bg-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-bg') === bgType;
        btn.classList.toggle('selected', isActive);
    });
});

socket.on('connect', () => {
    screens.emojiControls.classList.toggle('hidden', !currentUserId);
});

socket.on('disconnect', () => {
    screens.emojiControls.classList.add('hidden');
});

/** Game Actions **/
async function joinGame() {
    const name = document.getElementById('username').value;
    if (!name.trim()) return alert("Please enter a name");

    try {
        const response = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not join session');

        currentUserId = result.user.id;
        toggleScreens(true);
        socket.connect();
    } catch (error) {
        alert(error.message);
    }
}

async function logout() {
    if (!confirm("Are you sure?")) return;

    try {
        const response = await fetch('/api/session', { method: 'DELETE' });
        if (!response.ok) throw new Error('Could not leave session');
        socket.disconnect();
        currentUserId = null;
        toggleScreens(false);
    } catch (error) {
        alert(error.message);
    }
}

function renderDeck(deckValues) {
    const deckDiv = document.getElementById('deck');
    deckDiv.innerHTML = '';
    deckValues.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'card';
        btn.innerHTML = typeof val === 'string' ? `<span>${val}</span>` : val;
        btn.onclick = () => {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
            btn.classList.add('selected');
            socket.emit('vote', val);
        };
        deckDiv.appendChild(btn);
    });
}

function renderEmojiButtons(emojiList) {
    const emojiContainer = document.getElementById('emoji-controls');
    if (!emojiContainer) return;
    
    emojiContainer.innerHTML = '';
    emojiList.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.innerText = emoji;
        btn.onclick = (e) => sendReaction(emoji, e);
        emojiContainer.appendChild(btn);
    });
}

function revealCards() { socket.emit('reveal'); }

function resetGame() { 
    socket.emit('reset'); 
} 

function sendReaction(emoji, event) {
    if (!currentUserId || !socket.connected) return;

    if (emoji === '🪿') {
        playGooseHonk();
    } else {
        playReactionSound(emoji);
    }

    // Calculate the button's center position relative to the screen width
    const rect = event.target.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    
    // Convert to percentage (0% to 100%) so it works on different screen sizes
    const xPercent = (centerX / window.innerWidth) * 100;
    
    socket.emit('reaction', { emoji, x: xPercent });
}

socket.on('reaction', (data) => {
    const emojiChar = data.emoji || data; 
    const xPos = data.x || 90;
    
    // Create floating emoji element
    const el = document.createElement('div');
    el.innerText = emojiChar;
    el.className = 'floater';
    
    const randomOffset = (Math.random() * 1) - 0.5; // Add a small random horizontal offset to prevent perfect stacking
    
    el.style.left = (xPos + randomOffset) + '%'; 
    el.style.bottom = '80px'; 

    document.body.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 4000);
});

socket.on('connect_error', (error) => {
    if (error.message === 'Unauthorized') {
        currentUserId = null;
        toggleScreens(false);
    }
});

window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/session');
        if (!response.ok) return;

        const result = await response.json();
        currentUserId = result.user.id;
        toggleScreens(true);
        socket.connect();
    } catch {
        toggleScreens(false);
    }
});