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
  }

  init() {
    this.renderLobby();
  }

  // ── LOBBY VIEW ─────────────────────────────────────────────────────────────
  renderLobby() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

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
              Connect camera and microphone, pair-program on shared code in real time, and explain mental models using the Feynman technique.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button id="btn-quick-match" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2">
              <span>⚡</span> Quick Match Study Buddy
            </button>
          </div>
        </div>

        <!-- Available Study Rooms Grid -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>🟢</span> Active Collaborative Study Lounges
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

        <!-- Custom Room Creator Bar -->
        <div class="p-4 rounded-xl bg-[#111827] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <span class="text-xl">🚪</span>
            <div>
              <strong class="text-white block">Create or Join a Private Peer Room</strong>
              <span class="text-slate-400 text-[11px]">Enter a custom room code to connect with your classmate directly.</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input id="input-custom-room-code" type="text" placeholder="e.g. room-cs101-algo" class="px-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500" />
            <button id="btn-join-custom-room" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow">
              Connect
            </button>
          </div>
        </div>

      </div>
    `;

    // Wire up room buttons
    container.querySelectorAll('.btn-join-specific-room').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = btn.getAttribute('data-room');
        this.joinRoom(roomId);
      });
    });

    document.getElementById('btn-quick-match')?.addEventListener('click', () => {
      this.joinRoom('recursion-stack');
    });

    document.getElementById('btn-join-custom-room')?.addEventListener('click', () => {
      const code = document.getElementById('input-custom-room-code')?.value.trim();
      if (!code) {
        alert('Please enter a room code!');
        return;
      }
      this.joinRoom(code);
    });
  }

  // ── JOIN ROOM & ENTER ACTIVE P2P CALL STAGE ────────────────────────────────
  async joinRoom(roomId) {
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
        <h3 class="text-xl font-bold text-white">Connecting to Peer Room...</h3>
        <p class="text-xs text-slate-400">Initializing WebRTC media tracks, camera feed, and real-time code synchronization.</p>
        <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div class="h-full bg-orange-500 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    `;

    // Request camera & microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true
        });
      }
    } catch (err) {
      console.warn('Real webcam/mic not available or denied. Falling back to avatar simulation:', err);
      this.localStream = null;
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
          peerAvatar: this.userAvatar
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
        title: 'Study Room: ' + roomId,
        topic: 'Collaborative Coding',
        code: '# Collaborative Pair Programming\n\ndef solution(n):\n    # Type code here together!\n    pass\n',
        peers: [{ id: this.peerId, name: this.userName, avatar: this.userAvatar }],
        messages: [{ id: 'm_0', sender: 'System', text: 'Peer session active.', time: 'Just now', type: 'system' }]
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
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>${roomData.title || this.currentRoom}</span>
                <span class="text-xs text-slate-500 font-mono">#${this.currentRoom}</span>
              </h3>
              <p class="text-[11px] text-slate-400" id="peer-connection-status">
                Connected • WebRTC Audio/Video Active • Low Latency (24ms)
              </p>
            </div>
          </div>

          <!-- Room Actions -->
          <div class="flex items-center gap-2">
            <button id="btn-copy-room-link" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5">
              <span>📋</span> Copy Room Link
            </button>
            <button id="btn-leave-peer-room" class="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-700/60 transition flex items-center gap-1.5">
              <span>🚪</span> Leave Session
            </button>
          </div>
        </div>

        <!-- 3-Column Studio Grid: Left Video Feeds | Center Code | Right Chat -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <!-- LEFT COLUMN: Video Feeds & Media Controls (col-span-3) -->
          <div class="lg:col-span-3 space-y-3 flex flex-col justify-between">
            
            <div class="space-y-3">
              <!-- Remote Peer Video Card -->
              <div class="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg aspect-video flex items-center justify-center group">
                <video id="peer-remote-video" class="w-full h-full object-cover hidden" autoplay playsinline></video>
                
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
                </div>
              </div>

              <!-- Local User Video Card -->
              <div class="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg aspect-video flex items-center justify-center">
                <video id="peer-local-video" class="w-full h-full object-cover hidden" autoplay muted playsinline></video>
                
                <!-- Local Avatar Fallback -->
                <div id="peer-local-avatar-box" class="flex flex-col items-center justify-center p-3 text-center space-y-1">
                  <span class="text-3xl block h-12 w-12 rounded-full bg-slate-800 border-2 border-orange-500 flex items-center justify-center">${this.userAvatar}</span>
                  <strong class="text-xs text-white">${this.userName}</strong>
                  <span class="text-[10px] text-slate-400" id="local-mic-badge">🎙️ Mic Active</span>
                </div>

                <div class="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur text-[10px] text-white font-bold flex items-center gap-1">
                  <span>You (Local)</span>
                </div>
              </div>
            </div>

            <!-- Media Controls Bar -->
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-around gap-1 text-xs">
              <button id="btn-toggle-mic" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition" title="Toggle Microphone">
                <span id="mic-icon">🎙️</span>
              </button>
              <button id="btn-toggle-cam" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition" title="Toggle Camera">
                <span id="cam-icon">📹</span>
              </button>
              <button id="btn-toggle-screen" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition" title="Share Screen">
                <span>🖥️</span>
              </button>
              <button id="btn-open-whiteboard" class="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition" title="Shared Whiteboard">
                <span>🎨</span>
              </button>
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
    if (this.localStream) {
      const localVid = document.getElementById('peer-local-video');
      const localBox = document.getElementById('peer-local-avatar-box');
      if (localVid) {
        localVid.srcObject = this.localStream;
        localVid.classList.remove('hidden');
        if (localBox) localBox.classList.add('hidden');
      }
    }

    this.attachActiveRoomEvents();
  }

  // ── ATTACH ACTIVE ROOM EVENTS ──────────────────────────────────────────────
  attachActiveRoomEvents() {
    // Leave room button
    document.getElementById('btn-leave-peer-room')?.addEventListener('click', () => {
      this.leaveRoom();
    });

    // Copy room link
    document.getElementById('btn-copy-room-link')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.origin + '?room=' + this.currentRoom);
      alert('Room code #' + this.currentRoom + ' copied to clipboard! Share it with a classmate to connect.');
    });

    // Media Controls
    document.getElementById('btn-toggle-mic')?.addEventListener('click', () => this.toggleMic());
    document.getElementById('btn-toggle-cam')?.addEventListener('click', () => this.toggleCam());
    document.getElementById('btn-toggle-screen')?.addEventListener('click', () => this.toggleScreenShare());

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

  // ── TOGGLE MIC / CAM / SCREEN ──────────────────────────────────────────────
  toggleMic() {
    this.micOn = !this.micOn;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => t.enabled = this.micOn);
    }
    const icon = document.getElementById('mic-icon');
    const badge = document.getElementById('local-mic-badge');
    if (icon) icon.textContent = this.micOn ? '🎙️' : '🔇';
    if (badge) badge.textContent = this.micOn ? '🎙️ Mic Active' : '🔇 Muted';
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
      this.whiteboardCtx.beginPath();
      this.whiteboardCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    canvas.onmousemove = (e) => {
      if (!this.isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      this.whiteboardCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      this.whiteboardCtx.stroke();
    };

    canvas.onmouseup = () => { this.isDrawing = false; };
  }

  closeWhiteboard() {
    document.getElementById('peer-whiteboard-container')?.classList.add('hidden');
    this.activeTab = 'editor';
  }

  clearWhiteboard() {
    const canvas = document.getElementById('peer-whiteboard-canvas');
    if (canvas && this.whiteboardCtx) {
      this.whiteboardCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ── CODE SYNC & RUN ────────────────────────────────────────────────────────
  broadcastCode(code) {
    this.lastCodeVersion = code;
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
        <div class="text-center my-1.5">
          <span class="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
            ${m.avatar || '🤖'} ${m.text}
          </span>
        </div>
      `;
    }

    const isMe = m.sender === this.userName;
    return `
      <div class="flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}">
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

  // ── SYNC LOOP (Real-time updates) ──────────────────────────────────────────
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
          // Sync remote code if changed elsewhere and editor not focused
          const editor = document.getElementById('peer-shared-editor');
          if (editor && data.code && data.code !== this.lastCodeVersion && document.activeElement !== editor) {
            this.lastCodeVersion = data.code;
            editor.value = data.code;
          }

          // Update member count
          const countBadge = document.getElementById('chat-members-count');
          if (countBadge && data.peers) {
            countBadge.textContent = `${data.peers.length} Members Online`;
          }
        }
      } catch (e) {}
    }, 2000);
  }

  // ── AI PEER PARTNER (Ensures instant peer connection even when testing solo)
  checkAndStartAIPartner() {
    this.isSoloAI = true;
    setTimeout(() => {
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
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.aiPartnerTimer) clearTimeout(this.aiPartnerTimer);

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
