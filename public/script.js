const socket = io();
const STORAGE_KEY = 'persistent_id'; // unified key
const NAME_KEY = 'username';

// Cache common elements
const screens = {
    login: document.getElementById('login-screen'),
    game: document.getElementById('game-screen'),
    logout: document.getElementById('logout-container'),
    admin: document.getElementById('admin-controls'),
    results: document.getElementById('results'),
    userList: document.getElementById('user-list'),
    status: document.getElementById('session-status'),
    bgWidget: document.getElementById('admin-bg-widget')
};

/** Helpers **/
const getPersistentId = () => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = `user_${Math.random().toString(36).slice(2, 11)}`;
        localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
};

const toggleScreens = (isLoggedIn) => {
    screens.login.classList.toggle('hidden', isLoggedIn);
    screens.game.classList.toggle('hidden', !isLoggedIn);
    screens.logout.classList.toggle('hidden', !isLoggedIn);
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
    const myId = localStorage.getItem(STORAGE_KEY);
    const me = state.users.find(u => u.persistentId === myId);

    // Sync UI
    if (me?.vote === null) {
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    }
    screens.admin.classList.toggle('hidden', !me?.isAdmin);
    screens.bgWidget.classList.toggle('hidden', !me?.isAdmin);

    // Render Users & Calculate
    let [total, count] = [0, 0];
    screens.userList.innerHTML = state.users.map(u => {
        let display = u.vote === null ? '...' : '✔️';
        
        if (state.revealed) {
            display = u.vote ?? '-';
            if (typeof u.vote === 'number') { total += u.vote; count++; }
        }

        const badge = u.isAdmin ? '<span class="admin-badge">Guide</span>' : '';
        return `<li>
            <span class="name">${u.name} ${badge}</span>
            <span class="vote ${state.revealed ? 'revealed' : ''}">${display}</span>
        </li>`;
    }).join('');

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

/** Game Actions **/
function joinGame() {
    const name = document.getElementById('username').value;
    if (!name) return alert("Please enter a name");
    
    localStorage.setItem(NAME_KEY, name);
    socket.emit('join', { name, persistentId: getPersistentId() });
    toggleScreens(true);
}

function logout() {
    if (!confirm("Are you sure?")) return;
    socket.emit('logout');
    localStorage.clear();
    window.location.reload();
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

// Suggest name on refresh if name in localStorage
window.onload = () => {
    const savedName = localStorage.getItem(NAME_KEY);
    const savedId = localStorage.getItem(STORAGE_KEY);

    if (savedName && savedId) {
        socket.emit('join', { name: savedName, persistentId: savedId });
        toggleScreens(true);
    } 
};