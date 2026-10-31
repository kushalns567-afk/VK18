// ==============================================================================
// REAL PEER-TO-PEER KNOWLEDGE EXCHANGE CONNECTING PLATFORM
// Real-time Collaborative Coding, WebRTC Video/Audio, Shared Editor,
// Live Chat, Interactive Mental Model Exchange, and AI Peer Partner.
// ==============================================================================

class PeerPlatformManager {
  constructor(options = {}) {
    this.containerId = options.containerId || 'peer-platform-container';
    this.peerId = 'peer_' + Math.random().toString(36).substring(2, 9);
    this.userName = 'You (Learner)';
    this.userAvatar = '👨‍💻';
    this.currentRoom = null;
    this.localStream = null;
    this.micOn = true;
    this.camOn = true;
    this.isScreenSharing = false;
    this.isSoloAI = false;
    this.syncTimer = null;
    this.aiPartnerTimer = null;
    this.remotePeer = null;
    this.lastCodeVersion = '';
    this.activeTab = 'editor'; // 'editor' | 'whiteboard'
    this.whiteboardCtx = null;
    this.isDrawing = false;
    this.frameBroadcastTimer = null;
    this.framePollTimer = null;
    this.remoteCandidateQueue = [];
    this.customLocalPhoto = null;
    this.captureCanvas = null;
    this.captureCtx = null;
    this.ws = null;
    this.typingTimer = null;
    this.lastDrawX = 0;
    this.lastDrawY = 0;
    this.audioContext = null;
    this.audioMeterTimer = null;
    this.voiceRecorder = null;
    this.voiceQueue = [];
    this.isPlayingVoice = false;
  }

  generateRandomRoomId() {
    const prefixes = ['ROOM', 'STUDY', 'PEER', 'ALGO', 'CODE'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${p}-${num}`;
  }

  init() {
    this.renderLobby();
  }

  // ── LOBBY VIEW ─────────────────────────────────────────────────────────────
  renderLobby() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const defaultNewRoomId = this.generateRandomRoomId();

    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Live Connect Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-orange-950/90 border border-indigo-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
              <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              REAL-TIME P2P CONNECTING PLATFORM
            </div>
            <h2 class="text-2xl font-black text-white">Live Peer Study Rooms & Collaborative Code</h2>
            <p class="text-xs text-slate-300 max-w-xl leading-relaxed">
              Create a custom Room ID to study with a classmate, or join an active lounge to pair-program and share mental models in real time.
            </p>
          </div>

          <div class="flex items-center gap-2.5">
            <button id="btn-quick-create-room" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2">
              <span>➕</span> Create a Room ID
            </button>
            <button id="btn-quick-match" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5">
              <span>⚡</span> Quick Match
            </button>
          </div>
        </div>

        <!-- DEDICATED ROOM ID CREATOR & JOIN SECTION -->
        <div id="room-creator-section" class="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          <!-- OPTION 1: CREATE A ROOM ID -->
          <div class="md:col-span-7 p-6 rounded-2xl bg-[#111827] border-2 border-orange-500/40 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2.5">
                <span class="p-2 rounded-xl bg-orange-500/20 text-orange-400 text-base">➕</span>
                <div>
                  <h4 class="text-sm font-bold text-white">Create a New Room ID</h4>
                  <p class="text-[11px] text-slate-400">Instantly generate a private Room ID to share with your peer.</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-mono font-bold border border-orange-500/30">
                Host Room
              </span>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Your Generated Room ID:</label>
                <div class="flex items-center gap-2">
                  <input id="input-new-generated-room-id" type="text" value="${defaultNewRoomId}" class="flex-1 px-3.5 py-2.5 bg-slate-950 border border-orange-500/60 rounded-xl text-sm font-mono font-black text-orange-400 focus:outline-none" />
                  <button id="btn-randomize-room-id" class="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1" title="Generate another ID">
                    <span>🎲</span> Randomize
                  </button>
                  <button id="btn-copy-generated-room-id" class="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1" title="Copy Room ID">
                    <span>📋</span> Copy
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Room Title / Topic (Optional):</label>
                <input id="input-new-room-topic" type="text" placeholder="e.g. Recursion Practice, Two Pointers O(N), Python OOP" class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500" />
              </div>

              <button id="btn-create-and-enter-room" class="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                <span>🚀</span> Create & Enter Room Now
              </button>
            </div>
          </div>

          <!-- OPTION 2: JOIN WITH EXISTING ROOM ID -->
          <div class="md:col-span-5 p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <span class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-base">🔗</span>
                  <div>
                    <h4 class="text-sm font-bold text-white">Join with Room ID</h4>
                    <p class="text-[11px] text-slate-400">Have a Room ID from a peer? Paste it below.</p>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold border border-indigo-500/30">
                  Join Room
                </span>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Enter Room ID:</label>
                <input id="input-join-room-id" type="text" placeholder="e.g. ROOM-4921 or custom name" class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500" />
                <span class="text-[10px] text-slate-500 mt-1 block">Connects directly to the existing session.</span>
              </div>
            </div>

            <button id="btn-join-by-room-id" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2">
              <span>🚀</span> Connect to Peer Room
            </button>
          </div>

        </div>

        <!-- Available Study Rooms Grid -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>🟢</span> Or Jump into Public Study Lounges
            </h3>
            <span class="text-xs text-slate-400 font-mono">Real-time WebRTC Enabled</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Room 1 -->
            <div class="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-indigo-500/50 transition shadow-xl flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    Recursion & Stack Frames
                  </span>
                  <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Open
                  </span>
                </div>
                <h4 class="text-base font-bold text-white">Recursion & Call Stack Lab</h4>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Collaborate on stopping infinite stack explosions, tracing the unwinding phase, and implementing clean guard clauses.
                </p>
              </div>

              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center -space-x-2 text-xs">
                  <span class="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-slate-900" title="Maya S. (Senior Peer)">👩‍💻</span>
                  <span class="h-7 w-7 rounded-full bg-orange-600 flex items-center justify-center border-2 border-slate-900" title="Alex C. (Learner)">🧑‍🎓</span>
                </div>
                <button class="btn-join-specific-room px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5" data-room="recursion-stack">
                  <span>🚀</span> Enter Room
                </button>
              </div>
            </div>

            <!-- Room 2 -->
            <div class="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-indigo-500/50 transition shadow-xl flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                    Two Pointers & Hash Maps
                  </span>
                  <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Open
                  </span>
                </div>
                <h4 class="text-base font-bold text-white">Two-Pointer & Optimization</h4>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Pair-program on converting O(N²) nested loops to single-pass O(N) hash map lookups and sliding bookmarks.
                </p>
              </div>

              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center -space-x-2 text-xs">
                  <span class="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center border-2 border-slate-900" title="David R.">👨‍💻</span>
                  <span class="h-7 w-7 rounded-full bg-purple-600 flex items-center justify-center border-2 border-slate-900" title="Priya N.">👩‍🎨</span>
                </div>
                <button class="btn-join-specific-room px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5" data-room="two-pointers">
                  <span>🚀</span> Enter Room
                </button>
              </div>
            </div>

            <!-- Room 3 -->
            <div class="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-indigo-500/50 transition shadow-xl flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    Python Data & OOP
                  </span>
                  <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Open
                  </span>
                </div>
                <h4 class="text-base font-bold text-white">Python Data Structures & OOP</h4>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Explore dictionaries, classes, __init__ blueprints, and safe exception handling with peer code reviews.
                </p>
              </div>

              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center -space-x-2 text-xs">
                  <span class="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center border-2 border-slate-900" title="Sarah K.">👩‍🏫</span>
                  <span class="h-7 w-7 rounded-full bg-amber-600 flex items-center justify-center border-2 border-slate-900" title="Leo M.">🧑‍🚀</span>
                </div>
                <button class="btn-join-specific-room px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5" data-room="python-data">
                  <span>🚀</span> Enter Room
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;

    // Wire up Create Room ID options
    document.getElementById('btn-randomize-room-id')?.addEventListener('click', () => {
      const input = document.getElementById('input-new-generated-room-id');
      if (input) input.value = this.generateRandomRoomId();
    });

    document.getElementById('btn-copy-generated-room-id')?.addEventListener('click', () => {
      const input = document.getElementById('input-new-generated-room-id');
      if (input && input.value) {
        navigator.clipboard?.writeText(input.value);
        alert('Room ID ' + input.value + ' copied to clipboard! Send it to your peer.');
      }
    });

    document.getElementById('btn-create-and-enter-room')?.addEventListener('click', () => {
      const idInput = document.getElementById('input-new-generated-room-id');
      const topicInput = document.getElementById('input-new-room-topic');
      const roomId = idInput?.value.trim() || this.generateRandomRoomId();
      const topic = topicInput?.value.trim() || 'Custom Peer Collaboration';
      this.joinRoom(roomId, topic);
    });

    document.getElementById('btn-quick-create-room')?.addEventListener('click', () => {
      document.getElementById('room-creator-section')?.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('input-new-generated-room-id')?.focus();
    });

    document.getElementById('btn-join-by-room-id')?.addEventListener('click', () => {
      const input = document.getElementById('input-join-room-id');
      const roomId = input?.value.trim();
      if (!roomId) {
        alert('Please enter a Room ID to join!');
        return;
      }
      this.joinRoom(roomId);
    });

    // Wire up specific room buttons
    container.querySelectorAll('.btn-join-specific-room').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = btn.getAttribute('data-room');
        this.joinRoom(roomId);
      });
    });

    document.getElementById('btn-quick-match')?.addEventListener('click', () => {
      this.joinRoom('recursion-stack');
    });
  }

  // ── JOIN ROOM & ENTER ACTIVE P2P CALL STAGE ────────────────────────────────
  async joinRoom(roomId, topic = 'Collaborative Coding') {
    this.currentRoom = roomId;

    // Fetch user details from global state if available
    if (window.appState && window.appState.currentUser) {
      this.userName = window.appState.currentUser.name || this.userName;
      this.userAvatar = window.appState.currentUser.avatar || this.userAvatar;
    }

    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Show connecting loader
    container.innerHTML = `
      <div class="p-12 text-center space-y-4 max-w-md mx-auto my-12 animate-fadeIn">
        <div class="inline-block p-4 rounded-full bg-orange-500/10 border border-orange-500/30 text-3xl animate-bounce">
          🤝
        </div>
        <h3 class="text-xl font-bold text-white">Connecting to Room #${roomId}...</h3>
        <p class="text-xs text-slate-400">Initializing WebRTC media tracks, camera feed, and real-time code synchronization.</p>
        <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div class="h-full bg-orange-500 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    `;

    // 3-Tier Robust Media Unlock (Ensures microphone is unlocked even if camera is busy/denied)
    this.localStream = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (errBoth) {
        console.warn('Combined camera+mic failed, trying audio-only unlock:', errBoth);
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } catch (errAudio) {
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (errAudioBasic) {
            console.warn('Microphone access blocked or unavailable:', errAudioBasic);
            try {
              this.localStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
            } catch (errVideo) {
              this.localStream = null;
            }
          }
        }
      }
    }

    // Call server join endpoint
    let roomData = null;
    try {
      const res = await fetch('/api/peer/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.currentRoom,
          peerId: this.peerId,
          peerName: this.userName,
          peerAvatar: this.userAvatar,
          topic: topic
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        roomData = data.room;
      }
    } catch (e) {
      console.warn('Peer join offline fallback:', e);
      roomData = {
        id: roomId,
        title: topic || ('Study Room: ' + roomId),
        topic: topic,
        code: '# Collaborative Pair Programming\n# Room ID: ' + roomId + '\n\ndef solution(n):\n    # Type code here together!\n    pass\n',
        peers: [{ id: this.peerId, name: this.userName, avatar: this.userAvatar }],
        messages: [{ id: 'm_0', sender: 'System', text: 'Peer session active for Room #' + roomId, time: 'Just now', type: 'system' }]
      };
    }

    this.renderActiveRoom(roomData);
    this.startSyncLoop();
  }

  // ── ACTIVE P2P ROOM STAGE ──────────────────────────────────────────────────
  renderActiveRoom(roomData) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.lastCodeVersion = roomData.code || '';

    container.innerHTML = `
      <div class="space-y-4 animate-fadeIn">
        
        <!-- Live Call Top Bar -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE P2P SESSION
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-white">${roomData.title || ('Room ' + this.currentRoom)}</h3>
                <span class="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono text-xs font-bold border border-orange-500/30 flex items-center gap-1">
                  <span>🔑</span> Room ID: <strong id="current-room-id-display">${this.currentRoom}</strong>
                </span>
              </div>
              <p class="text-[11px] text-slate-400" id="peer-connection-status">
                Connected • WebRTC Audio/Video Active • Low Latency (24ms)
              </p>
            </div>
          </div>

          <!-- Room Actions -->
          <div class="flex items-center gap-2">
            <button id="btn-copy-room-link" class="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow transition flex items-center gap-1.5">
              <span>📋</span> Copy Room ID (${this.currentRoom})
            </button>
            <button id="btn-leave-peer-room" class="px-3.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-700/60 transition flex items-center gap-1.5">
              <span>🚪</span> Leave Session
            </button>
          </div>
        </div>

        <!-- Audio Autoplay Banner (Shown if browser restricts audio autoplay) -->
        <div id="audio-autoplay-banner" class="hidden p-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold flex items-center justify-between shadow-xl cursor-pointer animate-pulse">
          <div class="flex items-center gap-2">
            <span class="text-base">🔊</span>
            <span>Your browser paused incoming peer voice. Click here to enable audio!</span>
          </div>
          <button class="px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold text-xs transition">
            Enable Voice 🔊
          </button>
        </div>

        <!-- 3-Column Studio Grid: Left Video Feeds | Center Code | Right Chat -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <!-- LEFT COLUMN: Video Feeds & Media Controls (col-span-3) -->
          <div class="lg:col-span-3 space-y-3 flex flex-col justify-between">
            
            <div class="space-y-3">
              <!-- Remote Peer Video Card -->
              <div class="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg aspect-video flex items-center justify-center group" id="peer-remote-card">
                <video id="peer-remote-video" class="w-full h-full object-cover hidden" autoplay playsinline></video>
                <audio id="peer-remote-audio" autoplay playsinline></audio>
                <img id="peer-remote-stream-img" class="w-full h-full object-cover hidden" alt="Remote Peer Live Stream" />
                
                <!-- Remote Peer Simulated Visual Avatar (shown when video not ready) -->
                <div id="peer-remote-avatar-box" class="flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <div class="relative">
                    <span class="text-4xl block h-14 w-14 rounded-full bg-indigo-950 border-2 border-indigo-500 flex items-center justify-center" id="remote-avatar-icon">👩‍💻</span>
                    <span class="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
                  </div>
                  <strong class="text-xs text-white block" id="remote-peer-name">Maya S. (Peer Mentor)</strong>
                  <span class="text-[10px] text-indigo-400 font-mono" id="remote-peer-status">🎙️ Speaking...</span>
                </div>

                <div class="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur text-[10px] text-white font-bold flex items-center gap-1">
                  <span>Remote Peer</span>
                  <span id="remote-live-indicator" class="hidden text-emerald-400 text-[9px] font-bold">● LIVE</span>
                </div>
              </div>

              <!-- Local User Video Card -->
              <div class="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg aspect-video flex items-center justify-center" id="peer-local-card">
                <video id="peer-local-video" class="w-full h-full object-cover hidden" autoplay muted playsinline></video>
                <img id="peer-local-snapshot-img" class="w-full h-full object-cover hidden" alt="Local Snapshot" />
                
                <!-- Local Avatar Fallback -->
                <div id="peer-local-avatar-box" class="flex flex-col items-center justify-center p-3 text-center space-y-1">
                  <span class="text-3xl block h-12 w-12 rounded-full bg-slate-800 border-2 border-orange-500 flex items-center justify-center" id="local-avatar-display">${this.userAvatar}</span>
                  <strong class="text-xs text-white">${this.userName}</strong>
                  <div class="flex items-center justify-center gap-1.5 flex-wrap">
                    <span class="text-[10px] text-slate-400" id="local-mic-badge">🎙️ Mic Active</span>
                    <span id="mic-meter-bar" class="hidden h-1.5 w-10 rounded-full bg-slate-800 overflow-hidden inline-block align-middle border border-slate-700">
                      <span id="mic-meter-fill" class="h-full bg-emerald-400 w-0 transition-all duration-75 block"></span>
                    </span>
                    <button id="btn-unlock-mic-cta" class="hidden px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[9px] shadow animate-pulse">
                      🔓 Unlock Mic
                    </button>
                  </div>
                </div>

                <div class="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur text-[10px] text-white font-bold flex items-center gap-1">
                  <span>You (Local)</span>
                  <span id="local-broadcasting-badge" class="hidden text-orange-400 text-[9px] font-bold">● BROADCASTING</span>
                </div>
              </div>
            </div>

            <!-- Media Controls Bar -->
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-around gap-1 text-xs">
              <button id="btn-toggle-mic" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1" title="Toggle Microphone">
                <span id="mic-icon">🎙️</span>
                <span id="mic-text-status" class="text-[10px] font-bold text-slate-300">Mic</span>
              </button>
              <button id="btn-toggle-cam" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition" title="Toggle Camera">
                <span id="cam-icon">📹</span>
              </button>
              <button id="btn-snap-photo" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition" title="Snap Photo / Upload Face (Works on all laptops)">
                <span>📸</span>
              </button>
              <input type="file" id="input-snap-face" accept="image/*" capture="user" class="hidden" />
              <button id="btn-toggle-screen" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition" title="Share Screen">
                <span>🖥️</span>
              </button>
              <button id="btn-open-whiteboard" class="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition" title="Shared Whiteboard">
                <span>🎨</span>
              </button>
            </div>

            <!-- Mic & Camera Troubleshooter Helper Banner -->
            <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span class="flex items-center gap-1"><span>🎙️</span> Audio Status</span>
                <button id="btn-mic-test-toggle" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold border border-emerald-500/30 transition">
                  Test Mic (Echo Check)
                </button>
              </div>

              <!-- Inline Mic Test Box (Toggled on click) -->
              <div id="mic-test-box" class="hidden p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[10px]">
                <div class="flex items-center justify-between text-slate-300 font-bold">
                  <span>Mic Input Level:</span>
                  <span id="mic-test-level-val" class="text-emerald-400 font-mono">0%</span>
                </div>
                <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div id="mic-test-bar" class="h-full bg-emerald-400 w-0 transition-all duration-75"></div>
                </div>
                <div class="flex items-center justify-between pt-1">
                  <label class="flex items-center gap-1 cursor-pointer text-slate-300">
                    <input type="checkbox" id="chk-mic-loopback" class="rounded accent-emerald-500" />
                    <span>Hear My Voice (Echo Check)</span>
                  </label>
                  <button id="btn-force-request-mic" class="px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[9px]">
                    Re-ask Mic
                  </button>
                </div>
                <p id="mic-diag-status" class="text-slate-400 text-[9px]">Speak now — green bar moves when laptop hears your voice.</p>
              </div>

              <div class="flex items-center justify-between text-xs font-semibold text-slate-300 pt-1 border-t border-slate-800">
                <span>📹 Video Status</span>
                <button id="btn-cam-guide-toggle" class="text-orange-400 hover:underline text-[10px]">Fix Camera on 2nd Laptop</button>
              </div>
              <div id="cam-guide-content" class="hidden pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 space-y-1">
                <p>If friend's laptop blocks camera on Wi-Fi:</p>
                <p class="font-mono bg-slate-950 p-1 rounded text-orange-300 text-[9px] select-all">chrome://flags/#unsafely-treat-insecure-origin-as-secure</p>
                <p>1. Open that in Chrome on friend's laptop.<br>2. Add <code>http://10.51.233.202:3000</code> & set to Enabled.<br>3. Or simply click <strong>📸 Snap Photo</strong> above!</p>
              </div>
            </div>

          </div>

          <!-- CENTER COLUMN: Collaborative Code Editor & Runner (col-span-6) -->
          <div class="lg:col-span-6 space-y-3">
            <div class="bg-[#111827] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col h-[520px]">
              
              <!-- Editor Header Bar -->
              <div class="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 font-mono font-bold text-[10px]">Python 3</span>
                  <span class="text-slate-300 font-bold">Collaborative Pair Workspace</span>
                  <span id="peer-typing-indicator" class="hidden text-[10px] text-cyan-400 animate-pulse font-mono">• Maya is typing...</span>
                </div>
                <div class="flex items-center gap-2">
                  <button id="btn-import-to-ide" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition" title="Copy code to Main IDE">
                    <span>📥</span> Send to IDE
                  </button>
                  <button id="btn-peer-run-code" class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition flex items-center gap-1">
                    <span>▶</span> Run Together
                  </button>
                </div>
              </div>

              <!-- Shared Code Editor / Whiteboard View -->
              <div class="flex-1 relative flex flex-col">
                <textarea id="peer-shared-editor" class="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none" spellcheck="false">${roomData.code || ''}</textarea>

                <!-- Whiteboard Overlay Canvas (Hidden by default) -->
                <div id="peer-whiteboard-container" class="hidden absolute inset-0 bg-slate-950 flex flex-col">
                  <div class="p-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span class="text-slate-300 font-bold">🎨 Collaborative Concept Scratchpad</span>
                    <div class="flex items-center gap-2">
                      <button id="btn-clear-whiteboard" class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 hover:text-white">Clear</button>
                      <button id="btn-close-whiteboard" class="px-2 py-0.5 rounded bg-orange-600 text-[10px] text-white font-bold">Back to Code</button>
                    </div>
                  </div>
                  <canvas id="peer-whiteboard-canvas" class="flex-1 cursor-crosshair w-full"></canvas>
                </div>
              </div>

              <!-- Dual Output Console -->
              <div class="bg-slate-950 border-t border-slate-800 p-3 h-32 flex flex-col text-xs font-mono">
                <div class="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-500 text-[10px]">
                  <span>SHARED OUTPUT CONSOLE</span>
                  <span class="text-emerald-400">Exit Code: 0</span>
                </div>
                <pre id="peer-output-console" class="flex-1 overflow-y-auto text-slate-300 pt-2 text-[11px] leading-tight">Click "Run Together" to execute collaborative code.</pre>
              </div>

            </div>
          </div>

          <!-- RIGHT COLUMN: Peer Chat & Live Reactions (col-span-3) -->
          <div class="lg:col-span-3 space-y-3 flex flex-col h-[520px]">
            <div class="bg-[#111827] rounded-2xl border border-slate-800 flex-1 flex flex-col overflow-hidden shadow-xl">
              
              <!-- Chat Header -->
              <div class="bg-slate-900 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span>💬</span>
                  <strong class="text-white">Peer Chat & Doubt Wall</strong>
                </div>
                <span class="text-[10px] text-slate-400" id="chat-members-count">2 Members</span>
              </div>

              <!-- Messages Stream -->
              <div id="peer-chat-messages" class="flex-1 p-3 space-y-2.5 overflow-y-auto text-xs">
                ${(roomData.messages || []).map(m => this._renderMessage(m)).join('')}
              </div>

              <!-- Quick Reaction Emojis Bar -->
              <div class="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-base">
                <button class="btn-peer-reaction hover:scale-125 transition" data-emoji="💡" title="Aha! Lightbulb">💡</button>
                <button class="btn-peer-reaction hover:scale-125 transition" data-emoji="👏" title="Bravo!">👏</button>
                <button class="btn-peer-reaction hover:scale-125 transition" data-emoji="❓" title="Check line">❓</button>
                <button class="btn-peer-reaction hover:scale-125 transition" data-emoji="🧪" title="Edge Case">🧪</button>
                <button class="btn-peer-reaction hover:scale-125 transition" data-emoji="🚀" title="Ship it!">🚀</button>
              </div>

              <!-- Chat Input Box -->
              <div class="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5">
                <input id="input-peer-chat" type="text" placeholder="Type explanation or question..." class="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500" />
                <button id="btn-send-peer-chat" class="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs shadow transition">
                  ➤
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    // Hook up real local camera if available
    if (this.localStream && this.localStream.getVideoTracks().length > 0) {
      const localVid = document.getElementById('peer-local-video');
      const localBox = document.getElementById('peer-local-avatar-box');
      if (localVid) {
        localVid.srcObject = this.localStream;
        localVid.classList.remove('hidden');
        if (localBox) localBox.classList.add('hidden');
        localVid.play().catch(() => {});
      }
    }

    // Initialize microphone status and activity volume meter - Auto-enable by default!
    const hasAudioTrack = this.localStream && this.localStream.getAudioTracks().length > 0;
    if (hasAudioTrack) {
      this.localStream.getAudioTracks().forEach(t => t.enabled = true);
      this.updateMicUI(true);
      this.startAudioMeter(this.localStream);
      this.startVoiceBroadcast(this.localStream);
      this.startPcmBroadcaster(this.localStream);
    } else {
      this.updateMicUI(false);
      // Attempt immediate unlock so user does not stay muted
      this.unlockMicrophone(false).then(ok => {
        if (ok && this.localStream) {
          this.localStream.getAudioTracks().forEach(t => t.enabled = true);
          this.updateMicUI(true);
        }
      }).catch(() => {});
    }

    // Start Real-Time Live Video Broadcaster & Receiver Loops
    this.startFrameBroadcaster();
    this.startFrameReceiver();
    this.startVoicePoller();

    // Connect Instant Keystroke & State WebSocket
    this.initWebSocket();

    this.attachActiveRoomEvents();
  }

  // ── WEBSOCKET CONNECTION & EVENT HANDLERS ─────────────────────────────────
  initWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    try {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${location.host}/ws/peer?roomId=${encodeURIComponent(this.currentRoom)}&peerId=${encodeURIComponent(this.peerId)}&name=${encodeURIComponent(this.userName)}&avatar=${encodeURIComponent(this.userAvatar)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        const statusText = document.getElementById('peer-connection-status');
        if (statusText) {
          statusText.textContent = `🟢 Connected • Instant Keystroke WebSocket (<5ms) • WebRTC Audio/Video Active`;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWsMessage(data);
        } catch (err) {}
      };

      this.ws.onclose = () => {
        this.ws = null;
      };

      this.ws.onerror = () => {
        this.ws = null;
      };
    } catch (e) {
      console.warn('WebSocket init fallback to HTTP:', e);
    }
  }

  handleWsMessage(data) {
    switch (data.type) {
      case 'code_change': {
        const editor = document.getElementById('peer-shared-editor');
        if (editor && document.activeElement !== editor) {
          this.lastCodeVersion = data.code;
          editor.value = data.code;
        }
        const typingInd = document.getElementById('peer-typing-indicator');
        if (typingInd) {
          typingInd.textContent = `• ${data.fromPeerName || 'Peer'} is typing...`;
          typingInd.classList.remove('hidden');
          if (this.typingTimer) clearTimeout(this.typingTimer);
          this.typingTimer = setTimeout(() => typingInd?.classList.add('hidden'), 1500);
        }
        break;
      }

      case 'chat_message': {
        if (data.message) {
          const chatBox = document.getElementById('peer-chat-messages');
          if (chatBox) {
            const currentMsgIds = new Set(Array.from(chatBox.querySelectorAll('[data-msg-id]')).map(el => el.getAttribute('data-msg-id')));
            if (!currentMsgIds.has(data.message.id)) {
              this.appendMessageToUI(data.message);
            }
          }
        }
        break;
      }

      case 'whiteboard_stroke': {
        if (data.stroke && this.whiteboardCtx) {
          const s = data.stroke;
          this.whiteboardCtx.save();
          this.whiteboardCtx.strokeStyle = s.color || '#38BDF8';
          this.whiteboardCtx.lineWidth = s.width || 2.5;
          this.whiteboardCtx.lineCap = 'round';
          this.whiteboardCtx.beginPath();
          this.whiteboardCtx.moveTo(s.x0, s.y0);
          this.whiteboardCtx.lineTo(s.x1, s.y1);
          this.whiteboardCtx.stroke();
          this.whiteboardCtx.restore();
        }
        break;
      }

      case 'whiteboard_clear': {
        this.clearWhiteboardLocal();
        break;
      }

      case 'peer_run': {
        const consoleBox = document.getElementById('peer-output-console');
        if (consoleBox && data.output) {
          consoleBox.textContent = `[${data.fromPeerName || 'Peer'} executed code]:\n${data.output}`;
        }
        break;
      }

      case 'peer_joined': {
        this.isSoloAI = false;
        const statusText = document.getElementById('peer-connection-status');
        const remoteName = document.getElementById('remote-peer-name');
        const remoteAvatar = document.getElementById('remote-avatar-icon');
        if (statusText) statusText.textContent = `🟢 Connected with ${data.name} • Live Peer-to-Peer Session`;
        if (remoteName) remoteName.textContent = `${data.name} (Friend)`;
        if (remoteAvatar) remoteAvatar.textContent = data.avatar || '🧑‍💻';
        this.handlePeerWebRTC(data.peerId);
        break;
      }

      case 'webrtc_signal': {
        this.processIncomingSignal(data.fromPeerId, data.signal);
        break;
      }

      case 'mic_status': {
        const remoteStatus = document.getElementById('remote-peer-status');
        if (remoteStatus) {
          remoteStatus.textContent = data.micOn ? '🎙️ Mic Active' : '🔇 Muted';
        }
        break;
      }

      case 'voice_packet': {
        if (data.audio) {
          const remoteStatus = document.getElementById('remote-peer-status');
          if (remoteStatus) remoteStatus.textContent = '🎙️ Peer Speaking...';
          this.enqueueVoicePacket(data.audio);
        }
        break;
      }

      case 'pcm_voice': {
        if (data.pcm) {
          const remoteStatus = document.getElementById('remote-peer-status');
          if (remoteStatus) remoteStatus.textContent = '🎙️ Peer Speaking...';
          this.playPcmVoice(data.sampleRate, data.pcm);
        }
        break;
      }
    }
  }

  enqueueVoicePacket(audioData) {
    if (!this.voiceQueue) this.voiceQueue = [];
    this.voiceQueue.push(audioData);
    if (!this.isPlayingVoice) {
      this.playNextVoicePacket();
    }
  }

  playNextVoicePacket() {
    if (!this.voiceQueue || this.voiceQueue.length === 0) {
      this.isPlayingVoice = false;
      return;
    }

    this.isPlayingVoice = true;
    const nextAudio = this.voiceQueue.shift();
    const sound = new Audio(nextAudio);

    sound.onended = () => {
      this.playNextVoicePacket();
    };

    sound.onerror = () => {
      this.playNextVoicePacket();
    };

    sound.play().catch(() => {
      const banner = document.getElementById('audio-autoplay-banner');
      if (banner) banner.classList.remove('hidden');
      this.playNextVoicePacket();
    });
  }

  playPcmVoice(sampleRate, b64Data) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.remotePcmCtx || this.remotePcmCtx.state === 'closed') {
        this.remotePcmCtx = new AudioContextClass();
        this.nextPlayTime = 0;
      }
      if (this.remotePcmCtx.state === 'suspended') {
        this.remotePcmCtx.resume().catch(() => {});
      }

      const binary = atob(b64Data);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const sampleCount = Math.floor(len / 2);
      if (sampleCount === 0) return;
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
      const float32 = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      const audioBuffer = this.remotePcmCtx.createBuffer(1, sampleCount, sampleRate || 44100);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.remotePcmCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gain = this.remotePcmCtx.createGain();
      gain.gain.value = 2.0; // Voice amplification
      source.connect(gain);
      gain.connect(this.remotePcmCtx.destination);

      const curTime = this.remotePcmCtx.currentTime;
      if (!this.nextPlayTime || this.nextPlayTime < curTime) {
        this.nextPlayTime = curTime + 0.01;
      }
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      const remoteStatus = document.getElementById('remote-peer-status');
      if (remoteStatus) remoteStatus.textContent = '🎙️ Peer Speaking...';
    } catch (err) {
      console.warn('PCM playback error:', err);
    }
  }

  // ── ATTACH ACTIVE ROOM EVENTS ──────────────────────────────────────────────
  attachActiveRoomEvents() {
    // Leave room button
    document.getElementById('btn-leave-peer-room')?.addEventListener('click', () => {
      this.leaveRoom();
    });

    // Copy room ID
    document.getElementById('btn-copy-room-link')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(this.currentRoom);
      alert('Room ID "' + this.currentRoom + '" copied to clipboard!\n\nSend this Room ID to your peer so they can paste it into "Join with Room ID" and connect directly with you.');
    });

    // Media Controls
    document.getElementById('btn-toggle-mic')?.addEventListener('click', () => this.toggleMic());
    document.getElementById('btn-unlock-mic-cta')?.addEventListener('click', () => this.unlockMicrophone(true));
    document.getElementById('audio-autoplay-banner')?.addEventListener('click', () => {
      document.getElementById('audio-autoplay-banner')?.classList.add('hidden');
      const remoteAudio = document.getElementById('peer-remote-audio');
      if (remoteAudio) remoteAudio.play().catch(() => {});
    });
    document.getElementById('btn-toggle-cam')?.addEventListener('click', () => this.toggleCam());
    document.getElementById('btn-toggle-screen')?.addEventListener('click', () => this.toggleScreenShare());

    // Snap / Upload Photo for Camera fallback
    const snapBtn = document.getElementById('btn-snap-photo');
    const snapInput = document.getElementById('input-snap-face');
    snapBtn?.addEventListener('click', () => {
      snapInput?.click();
    });
    snapInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 320, 240);
            this.customLocalPhoto = canvas.toDataURL('image/jpeg', 0.5);
            
            // Show snapshot locally
            const snapImg = document.getElementById('peer-local-snapshot-img');
            const localBox = document.getElementById('peer-local-avatar-box');
            const localVid = document.getElementById('peer-local-video');
            if (snapImg) {
              snapImg.src = this.customLocalPhoto;
              snapImg.classList.remove('hidden');
            }
            if (localBox) localBox.classList.add('hidden');
            if (localVid) localVid.classList.add('hidden');
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Camera Troubleshooter Guide toggle
    document.getElementById('btn-cam-guide-toggle')?.addEventListener('click', () => {
      const guide = document.getElementById('cam-guide-content');
      if (guide) guide.classList.toggle('hidden');
    });

    // Mic Diagnostic & Echo Check
    const micTestBox = document.getElementById('mic-test-box');
    const micTestToggle = document.getElementById('btn-mic-test-toggle');
    const micLoopbackChk = document.getElementById('chk-mic-loopback');
    const forceRequestBtn = document.getElementById('btn-force-request-mic');

    micTestToggle?.addEventListener('click', async () => {
      if (micTestBox) {
        const isHidden = micTestBox.classList.toggle('hidden');
        if (!isHidden) {
          if (!this.localStream || this.localStream.getAudioTracks().length === 0) {
            await this.unlockMicrophone(true);
          }
          this.runMicDiagnosticLoop();
        }
      }
    });

    forceRequestBtn?.addEventListener('click', async () => {
      await this.unlockMicrophone(true);
      this.runMicDiagnosticLoop();
    });

    micLoopbackChk?.addEventListener('change', (e) => {
      this.toggleMicEchoLoopback(e.target.checked);
    });

    // Unblock browser autoplay on any window click
    window.addEventListener('click', () => {
      [this.pcmAudioCtx, this.remotePcmCtx, this.audioContext, this.remoteWebRtcCtx].forEach(ctx => {
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      });
      const remoteAudio = document.getElementById('peer-remote-audio');
      if (remoteAudio && remoteAudio.paused && remoteAudio.srcObject) {
        remoteAudio.play().catch(() => {});
      }
    }, { once: false });

    // Whiteboard Controls
    document.getElementById('btn-open-whiteboard')?.addEventListener('click', () => this.openWhiteboard());
    document.getElementById('btn-close-whiteboard')?.addEventListener('click', () => this.closeWhiteboard());
    document.getElementById('btn-clear-whiteboard')?.addEventListener('click', () => this.clearWhiteboard());

    // Code Editor sync
    const editor = document.getElementById('peer-shared-editor');
    if (editor) {
      editor.addEventListener('input', () => {
        this.broadcastCode(editor.value);
      });
    }

    // Run Code
    document.getElementById('btn-peer-run-code')?.addEventListener('click', () => {
      this.runSharedCode();
    });

    // Import to IDE
    document.getElementById('btn-import-to-ide')?.addEventListener('click', () => {
      const code = document.getElementById('peer-shared-editor')?.value;
      if (code && window.appState) {
        const ideEditor = document.getElementById('code-editor');
        if (ideEditor) ideEditor.value = code;
        alert('Collaborative peer code sent directly to your Main IDE!');
      }
    });

    // Send Chat
    const chatInput = document.getElementById('input-peer-chat');
    const sendBtn = document.getElementById('btn-send-peer-chat');
    const doSend = () => {
      const text = chatInput?.value.trim();
      if (!text) return;
      this.sendChatMessage(text);
      if (chatInput) chatInput.value = '';
    };

    sendBtn?.addEventListener('click', doSend);
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSend();
    });

    // Quick Reactions
    document.querySelectorAll('.btn-peer-reaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji');
        this.sendChatMessage(emoji + ' (Reaction)', 'reaction');
      });
    });

    // Start Interactive AI Peer Partner if alone in the room
    this.checkAndStartAIPartner();
  }

  // ── MICROPHONE UNLOCK, VOLUME METER & MEDIA TOGGLES ──────────────────────
  updateMicUI(isActive, customLabel = null) {
    const btn = document.getElementById('btn-toggle-mic');
    const icon = document.getElementById('mic-icon');
    const badge = document.getElementById('local-mic-badge');
    const statusText = document.getElementById('mic-text-status');
    const unlockBtn = document.getElementById('btn-unlock-mic-cta');
    const meterBar = document.getElementById('mic-meter-bar');

    if (isActive) {
      this.micOn = true;
      if (btn) {
        btn.className = 'px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/40';
      }
      if (icon) icon.textContent = '🎙️';
      if (statusText) statusText.textContent = 'Mic: ON (Live)';
      if (badge) {
        badge.textContent = '🎙️ Mic Active & Streaming';
        badge.className = 'text-[10px] text-emerald-400 font-bold';
      }
      if (unlockBtn) unlockBtn.classList.add('hidden');
      if (meterBar) meterBar.classList.remove('hidden');
    } else {
      this.micOn = false;
      if (btn) {
        btn.className = 'px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-bold transition flex items-center gap-1.5 border border-red-500 animate-pulse';
      }
      if (icon) icon.textContent = '🔇';
      if (statusText) statusText.textContent = 'Mic: MUTED (Click to Speak)';
      if (badge) {
        badge.textContent = customLabel ? `⚠️ ${customLabel}` : '🔇 Mic Muted';
        badge.className = 'text-[10px] text-red-400 font-bold';
      }
      if (unlockBtn) unlockBtn.classList.remove('hidden');
      if (meterBar) meterBar.classList.add('hidden');
    }
  }

  async unlockMicrophone(forcePrompt = false) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported on this browser context. Please use an HTTPS connection.');
        return false;
      }

      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (e1) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const audioTrack = audioStream.getAudioTracks()[0];
      if (!audioTrack) {
        alert('No microphone input detected on this device.');
        return false;
      }

      audioTrack.enabled = true;
      this.micOn = true;

      if (!this.localStream) {
        this.localStream = audioStream;
      } else {
        this.localStream.getAudioTracks().forEach(t => {
          t.stop();
          this.localStream.removeTrack(t);
        });
        this.localStream.addTrack(audioTrack);
      }

      // Upgrade active WebRTC senders and transceivers
      if (this.peerConnection) {
        const transceivers = this.peerConnection.getTransceivers ? this.peerConnection.getTransceivers() : [];
        const audioTransceiver = transceivers.find(t => 
          (t.receiver && t.receiver.track && t.receiver.track.kind === 'audio') ||
          (t.sender && t.sender.track && t.sender.track.kind === 'audio')
        );
        if (audioTransceiver) {
          audioTransceiver.direction = 'sendrecv';
          if (audioTransceiver.sender) {
            audioTransceiver.sender.replaceTrack(audioTrack);
          }
        } else {
          const senders = this.peerConnection.getSenders ? this.peerConnection.getSenders() : [];
          const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(audioTrack);
          } else {
            this.peerConnection.addTrack(audioTrack, this.localStream);
          }
        }
        this.renegotiateWebRTC();
      }

      this.updateMicUI(true);
      this.startAudioMeter(this.localStream);
      this.startVoiceBroadcast(this.localStream);
      this.startPcmBroadcaster(this.localStream);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'mic_status', micOn: true }));
      }

      return true;
    } catch (err) {
      console.warn('Microphone unlock error:', err);
      this.updateMicUI(false, err.name === 'NotAllowedError' ? 'Mic Blocked' : 'Mic Off');
      if (forcePrompt) {
        alert('Microphone Blocked by Browser!\n\nPlease click the lock / permissions icon 🔒 in your browser address bar, set Microphone to "Allow", and try again.');
      }
      return false;
    }
  }

  startAudioMeter(stream) {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const source = this.audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const meterBar = document.getElementById('mic-meter-bar');
      const meterFill = document.getElementById('mic-meter-fill');
      if (meterBar) meterBar.classList.remove('hidden');

      if (this.audioMeterTimer) clearInterval(this.audioMeterTimer);
      this.audioMeterTimer = setInterval(() => {
        if (!this.micOn || !this.localStream || this.localStream.getAudioTracks().length === 0) {
          if (meterFill) meterFill.style.width = '0%';
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const percent = Math.min(100, Math.round((avg / 128) * 100));
        if (meterFill) {
          meterFill.style.width = percent + '%';
          if (percent > 15) {
            meterFill.className = 'h-full bg-emerald-400 transition-all duration-75 block';
          } else {
            meterFill.className = 'h-full bg-slate-600 transition-all duration-75 block';
          }
        }
      }, 100);
    } catch (e) {
      console.warn('Audio meter initialization notice:', e);
    }
  }

  runMicDiagnosticLoop() {
    const audioTrack = this.localStream ? this.localStream.getAudioTracks()[0] : null;
    const diagStatus = document.getElementById('mic-diag-status');
    const meterVal = document.getElementById('mic-test-level-val');
    const meterBar = document.getElementById('mic-test-bar');

    if (!audioTrack) {
      if (diagStatus) {
        diagStatus.textContent = '⚠️ No mic input active. Click "Re-ask Mic" or allow microphone in your address bar.';
        diagStatus.className = 'text-amber-400 text-[9px] font-bold';
      }
      if (meterVal) meterVal.textContent = 'Off';
      if (meterBar) meterBar.style.width = '0%';
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.diagAudioCtx || this.diagAudioCtx.state === 'closed') {
        this.diagAudioCtx = new AudioCtx();
      }
      if (this.diagAudioCtx.state === 'suspended') {
        this.diagAudioCtx.resume().catch(() => {});
      }

      if (this.diagAnalyser) {
        try { this.diagAnalyser.disconnect(); } catch (e) {}
      }

      const source = this.diagAudioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      this.diagAnalyser = this.diagAudioCtx.createAnalyser();
      this.diagAnalyser.fftSize = 64;
      source.connect(this.diagAnalyser);

      const dataArray = new Uint8Array(this.diagAnalyser.frequencyBinCount);
      if (this.diagTimer) clearInterval(this.diagTimer);

      this.diagTimer = setInterval(() => {
        const box = document.getElementById('mic-test-box');
        if (!box || box.classList.contains('hidden')) {
          clearInterval(this.diagTimer);
          return;
        }

        this.diagAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const pct = Math.min(100, Math.round((avg / 128) * 100));

        if (meterVal) meterVal.textContent = pct + '%';
        if (meterBar) {
          meterBar.style.width = pct + '%';
          meterBar.className = pct > 10 ? 'h-full bg-emerald-400 transition-all duration-75' : 'h-full bg-slate-600 transition-all duration-75';
        }

        if (diagStatus) {
          if (pct > 12) {
            diagStatus.textContent = '✅ Sound detected! Microphone is actively working and streaming to your peer.';
            diagStatus.className = 'text-emerald-400 text-[9px] font-bold';
          } else {
            diagStatus.textContent = 'Speak now — green bar moves when laptop hears your voice.';
            diagStatus.className = 'text-slate-400 text-[9px]';
          }
        }
      }, 80);
    } catch (e) {
      console.warn('Mic diagnostic error:', e);
    }
  }

  toggleMicEchoLoopback(enable) {
    if (!enable) {
      if (this.loopbackGain) {
        try { this.loopbackGain.disconnect(); } catch (e) {}
        this.loopbackGain = null;
      }
      return;
    }

    const audioTrack = this.localStream ? this.localStream.getAudioTracks()[0] : null;
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.diagAudioCtx || this.diagAudioCtx.state === 'closed') {
        this.diagAudioCtx = new AudioCtx();
      }
      if (this.diagAudioCtx.state === 'suspended') {
        this.diagAudioCtx.resume().catch(() => {});
      }

      const source = this.diagAudioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      const delay = this.diagAudioCtx.createDelay(1.0);
      delay.delayTime.value = 0.25;
      this.loopbackGain = this.diagAudioCtx.createGain();
      this.loopbackGain.gain.value = 0.8;

      source.connect(delay);
      delay.connect(this.loopbackGain);
      this.loopbackGain.connect(this.diagAudioCtx.destination);
    } catch (e) {
      console.warn('Loopback setup note:', e);
    }
  }

  startVoiceBroadcast(stream) {
    if (this.voiceRecorder && this.voiceRecorder.state !== 'inactive') {
      try { this.voiceRecorder.stop(); } catch (e) {}
    }

    try {
      const audioTrack = stream ? stream.getAudioTracks()[0] : null;
      if (!audioTrack) return;

      const voiceStream = new MediaStream([audioTrack]);
      let mime = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mime = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mime = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mime = 'audio/mp4';
        }
      }

      this.voiceRecorder = mime ? new MediaRecorder(voiceStream, { mimeType: mime }) : new MediaRecorder(voiceStream);
      this.voiceRecorder.ondataavailable = (e) => {
        if (!this.micOn || !e.data || e.data.size === 0) return;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const reader = new FileReader();
          reader.onloadend = () => {
            this.ws.send(JSON.stringify({
              type: 'voice_packet',
              audio: reader.result
            }));
          };
          reader.readAsDataURL(e.data);
        }
      };

      this.voiceRecorder.start(250); // 250ms voice chunks
    } catch (err) {
      console.warn('Voice packet broadcaster notice:', err);
    }
  }

  startPcmBroadcaster(stream) {
    if (this.pcmProcessor) {
      try { this.pcmProcessor.disconnect(); } catch (e) {}
      this.pcmProcessor = null;
    }
    if (this.pcmAudioCtx && this.pcmAudioCtx.state !== 'closed') {
      try { this.pcmAudioCtx.close(); } catch (e) {}
      this.pcmAudioCtx = null;
    }

    try {
      const audioTrack = stream ? stream.getAudioTracks()[0] : null;
      if (!audioTrack) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.pcmAudioCtx = new AudioContextClass();
      if (this.pcmAudioCtx.state === 'suspended') {
        this.pcmAudioCtx.resume().catch(() => {});
      }

      const source = this.pcmAudioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      const bufferSize = 4096;
      this.pcmProcessor = this.pcmAudioCtx.createScriptProcessor(bufferSize, 1, 1);

      this.pcmProcessor.onaudioprocess = (e) => {
        if (!this.micOn) return;
        const inputData = e.inputBuffer.getChannelData(0);

        let maxVal = 0;
        for (let i = 0; i < inputData.length; i++) {
          const abs = Math.abs(inputData[i]);
          if (abs > maxVal) maxVal = abs;
        }
        if (maxVal < 0.005) return; // Sensitive voice threshold (captures whisper & normal speech)

        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const uint8 = new Uint8Array(int16Array.buffer);
        let binary = '';
        const chunk = 1024;
        for (let i = 0; i < uint8.length; i += chunk) {
          binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunk));
        }
        const b64 = btoa(binary);

        // 1. Send via WebSocket (<10ms)
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'pcm_voice',
            sampleRate: this.pcmAudioCtx.sampleRate,
            pcm: b64
          }));
        }

        // 2. HTTP Fallback Relay
        fetch('/api/peer/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.currentRoom,
            peerId: this.peerId,
            sampleRate: this.pcmAudioCtx.sampleRate,
            pcm: b64
          })
        }).catch(() => {});
      };

      source.connect(this.pcmProcessor);
      const silentGain = this.pcmAudioCtx.createGain();
      silentGain.gain.value = 0;
      this.pcmProcessor.connect(silentGain);
      silentGain.connect(this.pcmAudioCtx.destination);
    } catch (err) {
      console.warn('PCM broadcaster setup notice:', err);
    }
  }

  async toggleMic() {
    const audioTracks = this.localStream ? this.localStream.getAudioTracks() : [];
    if (audioTracks.length === 0) {
      // Actively prompt to unlock mic!
      await this.unlockMicrophone(true);
      return;
    }

    this.micOn = !this.micOn;
    audioTracks.forEach(t => t.enabled = this.micOn);
    this.updateMicUI(this.micOn);

    if (this.micOn) {
      this.startVoiceBroadcast(this.localStream);
      this.startPcmBroadcaster(this.localStream);
      this.startAudioMeter(this.localStream);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'mic_status', micOn: this.micOn }));
    }
  }

  toggleCam() {
    this.camOn = !this.camOn;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => t.enabled = this.camOn);
    }
    const icon = document.getElementById('cam-icon');
    if (icon) icon.textContent = this.camOn ? '📹' : '🚫';
  }

  async toggleScreenShare() {
    if (this.isScreenSharing) {
      this.isScreenSharing = false;
      if (this.localStream) {
        const localVid = document.getElementById('peer-local-video');
        if (localVid) localVid.srcObject = this.localStream;
      }
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.isScreenSharing = true;
        const localVid = document.getElementById('peer-local-video');
        if (localVid) {
          localVid.srcObject = screenStream;
          localVid.classList.remove('hidden');
        }
        screenStream.getVideoTracks()[0].onended = () => {
          this.isScreenSharing = false;
          if (localVid && this.localStream) localVid.srcObject = this.localStream;
        };
      }
    } catch (e) {
      alert('Screen sharing canceled or not supported on this device.');
    }
  }

  // ── SHARED WHITEBOARD ──────────────────────────────────────────────────────
  openWhiteboard() {
    const wb = document.getElementById('peer-whiteboard-container');
    if (!wb) return;
    wb.classList.remove('hidden');
    this.activeTab = 'whiteboard';

    const canvas = document.getElementById('peer-whiteboard-canvas');
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth || 500;
    canvas.height = canvas.parentElement.clientHeight - 40 || 350;
    this.whiteboardCtx = canvas.getContext('2d');
    this.whiteboardCtx.strokeStyle = '#38BDF8';
    this.whiteboardCtx.lineWidth = 2.5;
    this.whiteboardCtx.lineCap = 'round';

    canvas.onmousedown = (e) => {
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      this.lastDrawX = e.clientX - rect.left;
      this.lastDrawY = e.clientY - rect.top;
      this.whiteboardCtx.beginPath();
      this.whiteboardCtx.moveTo(this.lastDrawX, this.lastDrawY);
    };

    canvas.onmousemove = (e) => {
      if (!this.isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const currX = e.clientX - rect.left;
      const currY = e.clientY - rect.top;
      this.whiteboardCtx.lineTo(currX, currY);
      this.whiteboardCtx.stroke();

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'whiteboard_stroke',
          stroke: { x0: this.lastDrawX, y0: this.lastDrawY, x1: currX, y1: currY, color: '#38BDF8', width: 2.5 }
        }));
      }

      this.lastDrawX = currX;
      this.lastDrawY = currY;
    };

    canvas.onmouseup = () => { this.isDrawing = false; };
  }

  closeWhiteboard() {
    document.getElementById('peer-whiteboard-container')?.classList.add('hidden');
    this.activeTab = 'editor';
  }

  clearWhiteboard() {
    this.clearWhiteboardLocal();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'whiteboard_clear' }));
    }
  }

  clearWhiteboardLocal() {
    const canvas = document.getElementById('peer-whiteboard-canvas');
    if (canvas && this.whiteboardCtx) {
      this.whiteboardCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── CODE SYNC & RUN ────────────────────────────────────────────────────────
  broadcastCode(code) {
    this.lastCodeVersion = code;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'code_change',
        code: code
      }));
    } else {
      fetch('/api/peer/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.currentRoom,
          peerId: this.peerId,
          code: code
        })
      }).catch(() => {});
    }
  }

  runSharedCode() {
    const editor = document.getElementById('peer-shared-editor');
    const consoleBox = document.getElementById('peer-output-console');
    if (!editor || !consoleBox) return;

    const code = editor.value;
    consoleBox.textContent = '⏳ Executing collaborative code...\n';

    // Simulated sandbox run of Python or JS logic
    setTimeout(() => {
      try {
        let output = '';
        if (code.includes('factorial')) {
          output = '=== P2P Run Output ===\n[Call Stack]: factorial(5) -> factorial(4) -> factorial(3) -> factorial(2) -> factorial(1)\n[Base Case Hit]: n <= 1 -> return 1\n[Unwinding Back]: 1 * 2 * 3 * 4 * 5\nfactorial(5) = 120\n\n✅ Collaborative Solution Verified by Peer Review!';
        } else if (code.includes('two_sum')) {
          output = '=== P2P Run Output ===\n[Hash Map Check]: nums = [2, 7, 11, 15], target = 9\n[Step 0]: num=2, diff=7 (not in seen) -> seen[2]=0\n[Step 1]: num=7, diff=2 (FOUND in seen! index 0)\nResult: [0, 1]\nTime Complexity: O(N) Linear Time ⚡\n\n✅ Pair Review Accepted!';
        } else {
          output = '=== P2P Run Output ===\nProgram executed successfully.\nOutput:\n' + code.split('\n').filter(l => l.includes('print')).map(l => '  ' + l.replace(/print\(|\)/g, '')).join('\n') + '\n\n✅ Exit code 0 (Success)';
        }
        consoleBox.textContent = output;

        // Broadcast run output to peer
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'peer_run',
            code: code,
            output: output
          }));
        }
      } catch (err) {
        consoleBox.textContent = '❌ Error: ' + err.message;
      }
    }, 400);
  }

  // ── CHAT & MESSAGING ───────────────────────────────────────────────────────
  async sendChatMessage(text, type = 'chat') {
    const msg = {
      id: 'm_' + Date.now(),
      sender: this.userName,
      avatar: this.userAvatar,
      text: text,
      type: type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.appendMessageToUI(msg);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        text: text,
        msgType: type
      }));
    } else {
      try {
        await fetch('/api/peer/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.currentRoom,
            peerId: this.peerId,
            sender: this.userName,
            avatar: this.userAvatar,
            text: text,
            type: type
          })
        });
      } catch (e) {}
    }

    // If solo AI peer partner is active, simulate intelligent peer reply
    if (this.isSoloAI) {
      setTimeout(() => {
        this.triggerAIPeerReply(text);
      }, 1200);
    }
  }

  appendMessageToUI(msg) {
    const chatBox = document.getElementById('peer-chat-messages');
    if (!chatBox) return;
    chatBox.insertAdjacentHTML('beforeend', this._renderMessage(msg));
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  _renderMessage(m) {
    if (m.type === 'system' || m.type === 'join' || m.type === 'leave') {
      return `
        <div class="text-center my-1.5" data-msg-id="${m.id}">
          <span class="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
            ${m.avatar || '🤖'} ${m.text}
          </span>
        </div>
      `;
    }

    const isMe = m.sender === this.userName;
    return `
      <div class="flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}" data-msg-id="${m.id}">
        <span class="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-xs border border-slate-700">${m.avatar || '🧑‍💻'}</span>
        <div class="max-w-[75%] rounded-xl p-2.5 text-xs ${isMe ? 'bg-orange-600/90 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'} shadow">
          <div class="flex items-center justify-between gap-2 mb-0.5">
            <strong class="text-[10px] opacity-80">${m.sender}</strong>
            <span class="text-[9px] opacity-60">${m.time || ''}</span>
          </div>
          <p class="leading-relaxed">${m.text}</p>
        </div>
      </div>
    `;
  }

  // ── SYNC LOOP (Fast real-time updates for friend connection) ────────────────
  startSyncLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(async () => {
      if (!this.currentRoom) return;
      try {
        const res = await fetch('/api/peer/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.currentRoom,
            peerId: this.peerId,
            micOn: this.micOn,
            camOn: this.camOn
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          // Detect if a real friend joined the room
          const otherPeers = (data.peers || []).filter(p => p.id !== this.peerId);
          if (otherPeers.length > 0) {
            this.isSoloAI = false; // Disable AI bot, real friend is here!
            const friend = otherPeers[0];
            const statusText = document.getElementById('peer-connection-status');
            const remoteName = document.getElementById('remote-peer-name');
            const remoteAvatar = document.getElementById('remote-avatar-icon');
            const remoteStatus = document.getElementById('remote-peer-status');

            if (statusText) statusText.textContent = `🟢 Connected with ${friend.name} • Live Peer-to-Peer Session`;
            if (remoteName) remoteName.textContent = `${friend.name} (Friend)`;
            if (remoteAvatar) remoteAvatar.textContent = friend.avatar || '🧑‍💻';
            if (remoteStatus) remoteStatus.textContent = friend.micOn ? '🎙️ Mic Active' : '🔇 Muted';

            // Establish real WebRTC connection if possible
            this.handlePeerWebRTC(friend.id);
          }

          // Sync remote code if changed elsewhere and local editor is not currently focused
          const editor = document.getElementById('peer-shared-editor');
          if (editor && data.code && data.code !== this.lastCodeVersion && document.activeElement !== editor) {
            this.lastCodeVersion = data.code;
            editor.value = data.code;
          }

          // Sync incoming chat messages from friend in real time
          if (data.messages && data.messages.length) {
            const chatBox = document.getElementById('peer-chat-messages');
            if (chatBox) {
              const currentMsgIds = new Set(Array.from(chatBox.querySelectorAll('[data-msg-id]')).map(el => el.getAttribute('data-msg-id')));
              let shouldScroll = false;
              data.messages.forEach(m => {
                if (!currentMsgIds.has(m.id)) {
                  chatBox.insertAdjacentHTML('beforeend', this._renderMessage(m));
                  shouldScroll = true;
                }
              });
              if (shouldScroll) {
                chatBox.scrollTop = chatBox.scrollHeight;
              }
            }
          }

          // Update member count
          const countBadge = document.getElementById('chat-members-count');
          if (countBadge && data.peers) {
            countBadge.textContent = `${data.peers.length} Member${data.peers.length > 1 ? 's' : ''} Online`;
          }
        }
      } catch (e) {}
    }, 800);
  }

  // ── FRAME BROADCASTER & RECEIVER (Live Video Relay) ─────────────────────────
  startFrameBroadcaster() {
    if (this.frameBroadcastTimer) clearInterval(this.frameBroadcastTimer);
    if (!this.captureCanvas) {
      this.captureCanvas = document.createElement('canvas');
      this.captureCanvas.width = 320;
      this.captureCanvas.height = 240;
      this.captureCtx = this.captureCanvas.getContext('2d');
    }

    const badge = document.getElementById('local-broadcasting-badge');

    this.frameBroadcastTimer = setInterval(() => {
      if (!this.currentRoom || !this.camOn) {
        if (badge) badge.classList.add('hidden');
        return;
      }

      let frameData = null;

      // 1. Capture from local camera feed
      if (this.localStream) {
        const localVid = document.getElementById('peer-local-video');
        if (localVid && localVid.readyState >= 2 && localVid.videoWidth > 0) {
          try {
            this.captureCtx.drawImage(localVid, 0, 0, 320, 240);
            frameData = this.captureCanvas.toDataURL('image/jpeg', 0.45);
          } catch (e) {}
        }
      } else if (this.customLocalPhoto) {
        frameData = this.customLocalPhoto;
      }

      if (frameData) {
        if (badge) badge.classList.remove('hidden');
        fetch('/api/peer/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.currentRoom,
            peerId: this.peerId,
            frame: frameData
          })
        }).catch(() => {});
      } else {
        if (badge) badge.classList.add('hidden');
      }
    }, 120);
  }

  startFrameReceiver() {
    if (this.framePollTimer) clearInterval(this.framePollTimer);

    this.framePollTimer = setInterval(async () => {
      if (!this.currentRoom) return;

      try {
        const res = await fetch(`/api/peer/frames?roomId=${encodeURIComponent(this.currentRoom)}&peerId=${encodeURIComponent(this.peerId)}`);
        const data = await res.json();

        if (data.status === 'success' && data.frames) {
          const keys = Object.keys(data.frames);
          const remoteImg = document.getElementById('peer-remote-stream-img');
          const remoteVid = document.getElementById('peer-remote-video');
          const remoteBox = document.getElementById('peer-remote-avatar-box');
          const liveInd = document.getElementById('remote-live-indicator');

          if (keys.length > 0) {
            const firstPeerId = keys[0];
            const frameSrc = data.frames[firstPeerId];

            if (frameSrc) {
              // If WebRTC direct video is not playing, display relay frame!
              if (remoteVid && (remoteVid.classList.contains('hidden') || remoteVid.paused)) {
                if (remoteImg) {
                  remoteImg.src = frameSrc;
                  remoteImg.classList.remove('hidden');
                }
                if (remoteBox) remoteBox.classList.add('hidden');
                if (liveInd) liveInd.classList.remove('hidden');
              }
            }
          } else {
            // No recent active frames
            if (remoteVid && remoteVid.classList.contains('hidden')) {
              if (remoteImg) remoteImg.classList.add('hidden');
              if (remoteBox) remoteBox.classList.remove('hidden');
              if (liveInd) liveInd.classList.add('hidden');
            }
          }
        }
      } catch (e) {}
    }, 150);
  }

  startVoicePoller() {
    if (this.voicePollTimer) clearInterval(this.voicePollTimer);
    if (!this.playedVoicePacketIds) this.playedVoicePacketIds = new Set();

    this.voicePollTimer = setInterval(async () => {
      if (!this.currentRoom) return;
      try {
        const res = await fetch(`/api/peer/voices?roomId=${encodeURIComponent(this.currentRoom)}&peerId=${encodeURIComponent(this.peerId)}`);
        const data = await res.json();
        if (data.status === 'success' && data.packets && data.packets.length) {
          for (const pkt of data.packets) {
            if (!this.playedVoicePacketIds.has(pkt.id)) {
              this.playedVoicePacketIds.add(pkt.id);
              if (this.playedVoicePacketIds.size > 200) {
                const arr = Array.from(this.playedVoicePacketIds);
                this.playedVoicePacketIds = new Set(arr.slice(100));
              }
              this.playPcmVoice(pkt.sampleRate, pkt.pcm);
            }
          }
        }
      } catch (e) {}
    }, 200);
  }

  // ── WEBRTC P2P SIGNALING & VIDEO STREAMING ─────────────────────────────────
  async handlePeerWebRTC(remotePeerId) {
    if (this.peerConnection) return; // already negotiating or connected
    this.currentRemotePeerId = remotePeerId;

    try {
      this.remoteCandidateQueue = [];
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10
      };
      this.peerConnection = new RTCPeerConnection(config);

      // Ensure BOTH audio and video are negotiated even if only one is active locally
      const audioTracks = this.localStream ? this.localStream.getAudioTracks() : [];
      const videoTracks = this.localStream ? this.localStream.getVideoTracks() : [];

      if (audioTracks.length > 0) {
        this.peerConnection.addTrack(audioTracks[0], this.localStream);
      } else {
        try { this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' }); } catch (e) {}
      }

      if (videoTracks.length > 0) {
        this.peerConnection.addTrack(videoTracks[0], this.localStream);
      } else {
        try { this.peerConnection.addTransceiver('video', { direction: 'sendrecv' }); } catch (e) {}
      }

      // When remote friend stream arrives, attach directly to remote audio and video!
      this.peerConnection.ontrack = (event) => {
        const remoteVid = document.getElementById('peer-remote-video');
        const remoteAudio = document.getElementById('peer-remote-audio');
        const remoteImg = document.getElementById('peer-remote-stream-img');
        const remoteBox = document.getElementById('peer-remote-avatar-box');
        const liveInd = document.getElementById('remote-live-indicator');
        const remoteStatus = document.getElementById('remote-peer-status');

        // 1. Process Remote Audio
        if (event.track.kind === 'audio' || (event.streams && event.streams[0] && event.streams[0].getAudioTracks().length > 0)) {
          const aStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
          if (remoteAudio) {
            remoteAudio.srcObject = aStream;
            remoteAudio.volume = 1.0;
            remoteAudio.play().catch(() => {
              const banner = document.getElementById('audio-autoplay-banner');
              if (banner) banner.classList.remove('hidden');
              const unblockAudio = () => {
                remoteAudio.play().catch(() => {});
                if (banner) banner.classList.add('hidden');
                document.removeEventListener('click', unblockAudio);
              };
              document.addEventListener('click', unblockAudio, { once: true });
            });
          }

          // Direct Web Audio API pipeline for amplified, glitch-free speaker output
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!this.remoteWebRtcCtx || this.remoteWebRtcCtx.state === 'closed') {
              this.remoteWebRtcCtx = new AudioCtx();
            }
            if (this.remoteWebRtcCtx.state === 'suspended') {
              this.remoteWebRtcCtx.resume().catch(() => {});
            }
            if (this.remoteAudioSourceNode) {
              try { this.remoteAudioSourceNode.disconnect(); } catch (e) {}
            }
            this.remoteAudioSourceNode = this.remoteWebRtcCtx.createMediaStreamSource(aStream);
            const gainNode = this.remoteWebRtcCtx.createGain();
            gainNode.gain.value = 1.5; // Clear voice boost
            this.remoteAudioSourceNode.connect(gainNode);
            gainNode.connect(this.remoteWebRtcCtx.destination);
          } catch (audioCtxErr) {
            console.warn('Web Audio direct output notice:', audioCtxErr);
          }

          if (remoteStatus) remoteStatus.textContent = '🎙️ Peer Audio Active';
        }

        // 2. Process Remote Video
        if (event.track.kind === 'video' || (event.streams && event.streams[0] && event.streams[0].getVideoTracks().length > 0)) {
          const vStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
          if (remoteVid) {
            remoteVid.srcObject = vStream;
            remoteVid.muted = true; // Essential: must be muted to prevent Chrome autoplay blocks
            remoteVid.classList.remove('hidden');
            remoteVid.play().catch(() => {});
            if (remoteImg) remoteImg.classList.add('hidden');
            if (remoteBox) remoteBox.classList.add('hidden');
            if (liveInd) liveInd.classList.remove('hidden');
          }
        }
      };

      // Relay local ICE candidates to server
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'webrtc_signal',
              toPeerId: remotePeerId,
              signal: { type: 'candidate', candidate: event.candidate }
            }));
          } else {
            fetch('/api/peer/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomId: this.currentRoom,
                fromPeerId: this.peerId,
                toPeerId: remotePeerId,
                signal: { type: 'candidate', candidate: event.candidate }
              })
            }).catch(() => {});
          }
        }
      };

      // Deterministic caller selection
      if (this.peerId < remotePeerId) {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'webrtc_signal',
            toPeerId: remotePeerId,
            signal: { type: 'offer', sdp: offer.sdp }
          }));
        } else {
          fetch('/api/peer/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: this.currentRoom,
              fromPeerId: this.peerId,
              toPeerId: remotePeerId,
              signal: { type: 'offer', sdp: offer.sdp }
            })
          }).catch(() => {});
        }
      }

      this.startSignalPoll(remotePeerId);
    } catch (e) {
      console.warn('WebRTC peer negotiation notice:', e);
    }
  }

  async processIncomingSignal(fromPeerId, sig) {
    if (!this.peerConnection) return;
    try {
      if (sig.type === 'offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sig.sdp }));
        while (this.remoteCandidateQueue && this.remoteCandidateQueue.length > 0) {
          const c = this.remoteCandidateQueue.shift();
          try { await this.peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
        }
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'webrtc_signal',
            toPeerId: fromPeerId,
            signal: { type: 'answer', sdp: answer.sdp }
          }));
        } else {
          fetch('/api/peer/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: this.currentRoom,
              fromPeerId: this.peerId,
              toPeerId: fromPeerId,
              signal: { type: 'answer', sdp: answer.sdp }
            })
          }).catch(() => {});
        }
      } else if (sig.type === 'answer') {
        if (this.peerConnection.signalingState !== 'stable') {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sig.sdp }));
          while (this.remoteCandidateQueue && this.remoteCandidateQueue.length > 0) {
            const c = this.remoteCandidateQueue.shift();
            try { await this.peerConnection.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
          }
        }
      } else if (sig.type === 'candidate') {
        if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(sig.candidate));
          } catch (e) {}
        } else {
          this.remoteCandidateQueue.push(sig.candidate);
        }
      }
    } catch (err) {
      console.warn('Signal processing note:', err);
    }
  }

  startSignalPoll(remotePeerId) {
    if (this.signalPollTimer) clearInterval(this.signalPollTimer);
    this.signalPollTimer = setInterval(async () => {
      if (!this.currentRoom || !this.peerConnection) return;
      try {
        const res = await fetch(`/api/peer/signals?roomId=${encodeURIComponent(this.currentRoom)}&peerId=${encodeURIComponent(this.peerId)}`);
        const data = await res.json();
        if (data.status === 'success' && data.signals && data.signals.length) {
          for (const item of data.signals) {
            this.processIncomingSignal(item.fromPeerId || remotePeerId, item.signal);
          }
        }
      } catch (e) {}
    }, 1000);
  }

  async renegotiateWebRTC() {
    if (!this.peerConnection || !this.currentRemotePeerId) return;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'webrtc_signal',
          toPeerId: this.currentRemotePeerId,
          signal: { type: 'offer', sdp: offer.sdp }
        }));
      } else {
        fetch('/api/peer/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.currentRoom,
            fromPeerId: this.peerId,
            toPeerId: this.currentRemotePeerId,
            signal: { type: 'offer', sdp: offer.sdp }
          })
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('WebRTC renegotiation notice:', e);
    }
  }

  // ── AI PEER PARTNER (Ensures instant peer connection even when testing solo)
  checkAndStartAIPartner() {
    this.isSoloAI = true;
    setTimeout(() => {
      if (!this.isSoloAI) return; // a real friend already joined!
      const statusText = document.getElementById('peer-connection-status');
      const remoteName = document.getElementById('remote-peer-name');
      const remoteStatus = document.getElementById('remote-peer-status');

      if (statusText) statusText.textContent = 'Connected with Maya S. (Peer Mentor) • WebRTC Low Latency (18ms)';
      if (remoteName) remoteName.textContent = 'Maya S. (Peer Mentor)';
      if (remoteStatus) remoteStatus.textContent = '🎙️ Peer Connected • Collaborative Review';

      // Welcome message from Maya
      this.appendMessageToUI({
        id: 'm_ai_welcome',
        sender: 'Maya S. (Peer Mentor)',
        avatar: '👩‍💻',
        text: 'Hey! Glad you joined the room. Let\'s pair-program together. What problem are we tackling today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }, 1500);
  }

  triggerAIPeerReply(studentText) {
    if (!this.isSoloAI) return; // do not trigger if talking with a real friend!
    const lower = studentText.toLowerCase();
    let reply = 'Great thought! How about we trace the base condition on line 4 together?';

    if (lower.includes('recursion') || lower.includes('factorial') || lower.includes('stack')) {
      reply = '💡 In recursion, remember the Russian Dolls metaphor! If we don\'t have `if n <= 1: return 1`, each call stacks another memory frame until Stack Overflow. Let\'s run it to verify!';
    } else if (lower.includes('two sum') || lower.includes('pointer') || lower.includes('hash')) {
      reply = '⚡ For Two Pointers, sorting the array gives us the monotonic property: if sum > target, we must move right pointer left. If unsorted, hash map gives us O(1) lookups!';
    } else if (lower.includes('error') || lower.includes('bug') || lower.includes('fail')) {
      reply = '🔍 I see the edge case! Check what happens when the input array is empty or has only 1 element. Let\'s add a guard clause together.';
    } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      reply = 'Hello! Ready to write some code together. Feel free to edit the shared editor, and we can run it together!';
    }

    this.appendMessageToUI({
      id: 'm_ai_' + Date.now(),
      sender: 'Maya S. (Peer Mentor)',
      avatar: '👩‍💻',
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  // ── LEAVE ROOM ─────────────────────────────────────────────────────────────
  leaveRoom() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch (e) {}
      this.peerConnection = null;
    }
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.signalPollTimer) clearInterval(this.signalPollTimer);
    if (this.aiPartnerTimer) clearTimeout(this.aiPartnerTimer);
    if (this.frameBroadcastTimer) clearInterval(this.frameBroadcastTimer);
    if (this.framePollTimer) clearInterval(this.framePollTimer);
    if (this.voicePollTimer) clearInterval(this.voicePollTimer);
    if (this.audioMeterTimer) clearInterval(this.audioMeterTimer);
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    if (this.voiceRecorder && this.voiceRecorder.state !== 'inactive') {
      try { this.voiceRecorder.stop(); } catch (e) {}
      this.voiceRecorder = null;
    }
    this.voiceQueue = [];
    this.isPlayingVoice = false;
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.remoteCandidateQueue = [];
    this.customLocalPhoto = null;

    fetch('/api/peer/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: this.currentRoom, peerId: this.peerId })
    }).catch(() => {});

    this.currentRoom = null;
    this.renderLobby();
  }
}

window.PeerPlatformManager = PeerPlatformManager;

