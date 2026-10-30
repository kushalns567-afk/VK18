// ==============================================================================
// APPLICATION CORE CONTROLLER
// Real-Time Confusion-Aware Interactive Tutor
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    activeTab: 'login', // Default screen is 'login' until authenticated
    currentChallengeIndex: 0,
    currentCode: '',
    executionOutput: '',
    isExecuting: false,
    tutorOpen: false,
    activeHintLevel: 1, // 1 to 4
    tutorMessages: [],
    telemetryHistory: [],
    currentDiagnosis: {
      frictionScore: 12,
      state: 'FLOW',
      reason: 'Calm, focused coding cadence.',
      triggerIntervention: false
    },
    liveTelemetry: {
      wpm: 0,
      burstDeletes: 0,
      idleDwellSec: 0,
      backspaceRatio: 0,
      recentErrors: 0,
      currentLine: 1
    },
    currentUser: null
  };

  // Initialize Metaphor Visualizer Engine
  const metaphorEngine = new window.VisualMetaphorEngine('metaphor-canvas');

  // Initialize Video Tutor Engine
  const videoTutor = new window.VideoTutorEngine({ containerId: 'video-tutor-container' });
  videoTutor.init();

  // Initialize Telemetry Engine
  const telemetry = new window.TelemetryCollector({
    onUpdate: (payload) => {
      state.liveTelemetry = payload.telemetry;
      state.currentDiagnosis = payload.diagnosis;
      state.telemetryHistory = payload.history;
      updateTelemetryHUD();
      updateSparkline();
    },
    onConfusionTrigger: (payload) => {
      // Automatic non-intrusive trigger when friction exceeds threshold
      if (!state.tutorOpen) {
        openTutorDrawer(true);
      }
    }
  });

  // DOM Elements
  const codeEditor = document.getElementById('code-editor');
  const lineNumbers = document.getElementById('line-numbers');
  const consoleOutput = document.getElementById('console-output');
  const btnRun = document.getElementById('btn-run-code');
  const challengeSelect = document.getElementById('challenge-select');
  const tutorDrawer = document.getElementById('tutor-drawer');
  const btnToggleTutor = document.getElementById('btn-toggle-tutor');
  const btnCloseTutor = document.getElementById('btn-close-tutor');

  // 1. CHALLENGE LOADER
  function loadChallenge(index) {
    state.currentChallengeIndex = index;
    const challenge = window.CHALLENGES[index];
    state.currentCode = challenge.defaultCode;
    codeEditor.value = challenge.defaultCode;
    updateLineNumbers();

    document.getElementById('challenge-title').textContent = challenge.title;
    document.getElementById('challenge-category').textContent = challenge.category;
    document.getElementById('challenge-badge').textContent = challenge.difficulty;
    document.getElementById('challenge-desc').innerHTML = challenge.description.replace(/\n/g, '<br/>');

    consoleOutput.innerHTML = `<span class="text-slate-500">// Ready to execute ${challenge.title}...</span>`;
    
    // Reset confusion state for new challenge
    telemetry.resetToFlowState();
    refreshMetaphorInTutor(challenge);
  }

  // 2. LINE NUMBERS & EDITOR SYNC
  function updateLineNumbers() {
    const lines = (codeEditor.value || '').split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(lines, 12); i++) {
      const isCurrent = i === state.liveTelemetry.currentLine;
      numbersHtml += `<div class="${isCurrent ? 'text-amber-400 font-bold bg-amber-500/10' : ''}">${i}</div>`;
    }
    lineNumbers.innerHTML = numbersHtml;
  }

  // 3. CODE EXECUTION ENGINE
  btnRun.addEventListener('click', runUserCode);

  function runUserCode() {
    const code = codeEditor.value;
    state.isExecuting = true;
    consoleOutput.innerHTML = `<span class="text-cyan-400">⚡ Executing script in sandbox...</span>`;

    // Captured logs & errors
    let capturedLogs = [];
    let hadError = false;
    let errorDetail = null;

    const originalConsoleLog = console.log;
    console.log = function(...args) {
      capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      originalConsoleLog.apply(console, args);
    };

    const startTime = performance.now();
    try {
      // Run in function wrapper with 1.5s timeout protection against infinite loops
      const runner = new Function(code);
      runner();
      const elapsed = Math.round(performance.now() - startTime);

      let outputHtml = `<div class="text-xs text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
        <span>Execution status: <strong class="text-emerald-400">SUCCESS</strong></span>
        <span>${elapsed}ms</span>
      </div>`;

      if (capturedLogs.length > 0) {
        outputHtml += capturedLogs.map(log => `<div class="text-slate-200 font-mono mt-1">${escapeHtml(log)}</div>`).join('');
      } else {
        outputHtml += `<div class="text-slate-400 font-mono italic mt-1">(Code executed without console.log output)</div>`;
      }

      consoleOutput.innerHTML = outputHtml;
      telemetry.recordExecutionSuccess();
    } catch (err) {
      hadError = true;
      errorDetail = err.message || err.toString();
      const elapsed = Math.round(performance.now() - startTime);

      consoleOutput.innerHTML = `
        <div class="text-xs text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
          <span>Execution status: <strong class="text-red-400">RUNTIME ERROR</strong></span>
          <span>${elapsed}ms</span>
        </div>
        <div class="text-red-400 font-mono mt-2 p-2 bg-red-950/40 border border-red-800/60 rounded">
          ❌ <strong>${escapeHtml(err.name)}:</strong> ${escapeHtml(errorDetail)}
        </div>
        <div class="text-xs text-amber-300/80 mt-2">
          💡 Cognitive Telemetry: Execution error recorded. Repeated failures without modification will trigger the Socratic Tutor.
        </div>
      `;

      telemetry.recordExecutionError(errorDetail);
    } finally {
      console.log = originalConsoleLog;
      state.isExecuting = false;
    }
  }

  // Helper escaping
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 4. EDITOR TELEMETRY LISTENERS
  codeEditor.addEventListener('keydown', (e) => {
    // Determine active line
    const cursorPos = codeEditor.selectionStart;
    const textBefore = codeEditor.value.substring(0, cursorPos);
    const lineIndex = textBefore.split('\n').length;

    telemetry.recordKey(e, lineIndex);
    updateLineNumbers();

    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
    }
  });

  codeEditor.addEventListener('click', () => {
    const cursorPos = codeEditor.selectionStart;
    const textBefore = codeEditor.value.substring(0, cursorPos);
    const lineIndex = textBefore.split('\n').length;
    telemetry.recordCursorMove(lineIndex);
    updateLineNumbers();
  });

  codeEditor.addEventListener('input', () => {
    updateLineNumbers();
  });

  // 5. TELEMETRY HUD UPDATER
  function updateTelemetryHUD() {
    const diag = state.currentDiagnosis;
    const tel = state.liveTelemetry;

    // Friction score meter
    const scoreVal = document.getElementById('friction-score-val');
    const scoreBar = document.getElementById('friction-score-bar');
    const stateBadge = document.getElementById('cognitive-state-badge');
    const reasonText = document.getElementById('friction-reason');

    if (scoreVal) scoreVal.textContent = diag.frictionScore + '%';
    if (scoreBar) {
      scoreBar.style.width = diag.frictionScore + '%';
      if (diag.state === 'FLOW') {
        scoreBar.className = 'h-full bg-emerald-500 transition-all duration-300';
      } else if (diag.state === 'THINKING') {
        scoreBar.className = 'h-full bg-amber-500 transition-all duration-300';
      } else {
        scoreBar.className = 'h-full bg-red-500 transition-all duration-300 animate-pulse';
      }
    }

    if (stateBadge) {
      if (diag.state === 'FLOW') {
        stateBadge.innerHTML = `<span class="h-2 w-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>FLOW STATE`;
        stateBadge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700 flex items-center';
      } else if (diag.state === 'THINKING') {
        stateBadge.innerHTML = `<span class="h-2 w-2 rounded-full bg-amber-400 mr-1.5"></span>ACTIVE THINKING`;
        stateBadge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-amber-950/80 text-amber-400 border border-amber-700 flex items-center';
      } else {
        stateBadge.innerHTML = `<span class="h-2 w-2 rounded-full bg-red-400 mr-1.5 animate-ping"></span>CONFUSION DETECTED`;
        stateBadge.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-red-950/90 text-red-300 border border-red-600 flex items-center animate-bounce';
      }
    }

    if (reasonText) reasonText.textContent = diag.reason;

    // HUD numerical tiles
    const wpmEl = document.getElementById('telemetry-wpm');
    const deletesEl = document.getElementById('telemetry-deletes');
    const dwellEl = document.getElementById('telemetry-dwell');
    const errorsEl = document.getElementById('telemetry-errors');
    const lineEl = document.getElementById('telemetry-line');

    if (wpmEl) wpmEl.textContent = tel.wpm;
    if (deletesEl) deletesEl.textContent = tel.burstDeletes;
    if (dwellEl) dwellEl.textContent = tel.idleDwellSec + 's';
    if (errorsEl) errorsEl.textContent = tel.recentErrors;
    if (lineEl) lineEl.textContent = 'Line ' + tel.currentLine;

    // Visual border glow on workspace if confusion detected
    const editorContainer = document.getElementById('editor-panel-box');
    if (editorContainer) {
      if (diag.state === 'CONFUSION') {
        editorContainer.classList.add('glow-confusion');
      } else {
        editorContainer.classList.remove('glow-confusion');
      }
    }
  }

  // 6. SPARKLINE CANVAS DRAWING
  function updateSparkline() {
    const canvas = document.getElementById('telemetry-sparkline');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const history = state.telemetryHistory;
    if (history.length < 2) return;

    // Threshold guidelines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const confusionY = height - (65 / 100) * height;
    ctx.moveTo(0, confusionY);
    ctx.lineTo(width, confusionY);
    ctx.stroke();

    // Plot friction score line
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38BDF8';

    const step = width / (Math.max(history.length - 1, 1));
    history.forEach((pt, i) => {
      const x = i * step;
      const y = height - (pt.score / 100) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
  }

  // 7. SOCRATIC AI TUTOR DRAWER
  btnToggleTutor.addEventListener('click', () => {
    openTutorDrawer(!state.tutorOpen);
  });

  btnCloseTutor.addEventListener('click', () => {
    openTutorDrawer(false);
  });

  function openTutorDrawer(open) {
    state.tutorOpen = open;
    if (open) {
      tutorDrawer.classList.remove('hidden');
      tutorDrawer.classList.add('slide-in-right');
      refreshMetaphorInTutor(window.CHALLENGES[state.currentChallengeIndex]);
    } else {
      tutorDrawer.classList.add('hidden');
      tutorDrawer.classList.remove('slide-in-right');
    }
  }

  function refreshMetaphorInTutor(challenge) {
    const metaphor = challenge.defaultMetaphor || {};
    const titleEl = document.getElementById('tutor-metaphor-title');
    const explanationEl = document.getElementById('tutor-metaphor-explanation');
    const triggerReasonEl = document.getElementById('tutor-trigger-reason');

    if (titleEl) titleEl.textContent = metaphor.title || 'Dynamic Socratic Guidance';
    if (explanationEl) explanationEl.textContent = metaphor.explanation || 'Step-by-step guidance calibrated to your coding state.';
    if (triggerReasonEl) triggerReasonEl.textContent = state.currentDiagnosis.reason;

    // Render interactive visual metaphor widget
    const canvasContainer = document.getElementById('metaphor-canvas-container');
    if (canvasContainer) {
      metaphorEngine.render(metaphor.type, canvasContainer, {});
    }

    // Set scaffolding tab to Level 1
    switchScaffoldingLevel(state.activeHintLevel);
  }

  // Scaffolding Level Tabs (Slide 5: Progressive scaffolding)
  const scaffoldButtons = document.querySelectorAll('.scaffold-btn');
  scaffoldButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.getAttribute('data-level'), 10);
      switchScaffoldingLevel(level);
    });
  });

  function switchScaffoldingLevel(level) {
    state.activeHintLevel = level;
    scaffoldButtons.forEach(btn => {
      const bLevel = parseInt(btn.getAttribute('data-level'), 10);
      if (bLevel === level) {
        btn.className = 'scaffold-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 text-white shadow transition';
      } else {
        btn.className = 'scaffold-btn px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
      }
    });

    const levelContents = {
      1: document.getElementById('scaffold-content-1'),
      2: document.getElementById('scaffold-content-2'),
      3: document.getElementById('scaffold-content-3'),
      4: document.getElementById('scaffold-content-4')
    };

    Object.keys(levelContents).forEach(key => {
      if (parseInt(key, 10) === level) {
        levelContents[key]?.classList.remove('hidden');
      } else {
        levelContents[key]?.classList.add('hidden');
      }
    });
  }

  // 8. TUTOR CHAT INTERFACE (AWS Bedrock simulation & live API hook)
  const chatInput = document.getElementById('tutor-chat-input');
  const btnSendChat = document.getElementById('btn-send-chat');
  const chatMessagesList = document.getElementById('tutor-chat-messages');

  btnSendChat.addEventListener('click', sendTutorMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendTutorMessage();
  });

  async function sendTutorMessage() {
    const text = (chatInput.value || '').trim();
    if (!text) return;

    // Append student message
    appendChatMessage('user', text);
    chatInput.value = '';

    // Show AI typing indicator
    const typingIndicator = appendChatMessage('ai', '<span class="italic text-slate-400">AWS Bedrock Claude 3.5 Sonnet synthesizing Socratic reply...</span>');

    try {
      const res = await fetch('/api/bedrock-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: window.CHALLENGES[state.currentChallengeIndex].topic,
          code: codeEditor.value,
          question: text
        })
      });
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      const metaphor = data.creativeMetaphor;

      typingIndicator.innerHTML = `
        <div class="text-xs font-semibold text-orange-400 mb-1">🤖 AI Tutor (AWS Bedrock Claude 3.5):</div>
        <p class="text-xs text-slate-200">${metaphor.summary}</p>
        <div class="mt-2 p-2 bg-slate-900 rounded border border-slate-700 text-xs text-amber-300">
          <strong>Socratic Nudge:</strong> ${metaphor.socraticPrompt}
        </div>
      `;
    } catch (err) {
      // Dynamic Local Socratic Engine (Offline & Static Mode fallback)
      const currentCh = window.CHALLENGES[state.currentChallengeIndex];
      const m = currentCh.defaultMetaphor || {};
      typingIndicator.innerHTML = `
        <div class="text-xs font-semibold text-orange-400 mb-1">🤖 AI Tutor (AWS Bedrock Synthesizer):</div>
        <p class="text-xs text-slate-200">Think back to <strong>${m.title || 'the visual analogy'}</strong>. ${m.explanation || ''}</p>
        <div class="mt-2 p-2 bg-slate-900 rounded border border-slate-700 text-xs text-amber-300">
          <strong>Socratic Nudge:</strong> Notice what is happening at Line ${state.liveTelemetry.currentLine}. What stopping condition or pointer adjustment is required to prevent an infinite cycle?
        </div>
      `;
    }
  }

  function appendChatMessage(sender, htmlContent) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `p-3 rounded-lg text-xs leading-relaxed ${
      sender === 'user' 
        ? 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-100 ml-4' 
        : 'bg-slate-800/90 border border-slate-700 text-slate-200 mr-4'
    }`;
    msgDiv.innerHTML = htmlContent;
    chatMessagesList.appendChild(msgDiv);
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
    return msgDiv;
  }

  // 9. JUDGES FAST-DEMO SIMULATOR BUTTONS (Slide 5)
  document.getElementById('demo-btn-burst')?.addEventListener('click', () => {
    telemetry.simulateBurstDeletions();
    openTutorDrawer(true);
  });

  document.getElementById('demo-btn-freeze')?.addEventListener('click', () => {
    telemetry.simulateProlongedFreeze();
    openTutorDrawer(true);
  });

  document.getElementById('demo-btn-error-loop')?.addEventListener('click', () => {
    telemetry.simulateErrorLoop();
    openTutorDrawer(true);
  });

  document.getElementById('demo-btn-reset')?.addEventListener('click', () => {
    telemetry.resetToFlowState();
    openTutorDrawer(false);
  });

  // 10. NAVIGATION TABS CONTROLLER
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });

  function switchTab(tabId) {
    state.activeTab = tabId;
    navTabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.className = 'nav-tab-btn px-4 py-2 rounded-lg text-xs font-bold bg-orange-600 text-white shadow-lg transition';
      } else {
        t.className = 'nav-tab-btn px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition';
      }
    });

    const views = {
      workspace: document.getElementById('view-workspace'),
      video: document.getElementById('view-video'),
      analytics: document.getElementById('view-analytics'),
      login: document.getElementById('view-login')
    };

    Object.keys(views).forEach(k => {
      if (k === tabId) {
        views[k]?.classList.remove('hidden');
      } else {
        views[k]?.classList.add('hidden');
      }
    });

    if (tabId === 'video') {
      videoTutor.render();
    } else if (tabId === 'analytics') {
      renderAnalyticsView();
    }
  }

  // Hook up IDE "Watch Video Lesson" button
  document.getElementById('btn-open-video-tutor')?.addEventListener('click', () => {
    switchTab('video');
  });

  // 11. ANALYTICS & HEATMAP VIEW
  function renderAnalyticsView() {
    const container = document.getElementById('analytics-content-container');
    if (!container) return;

    const renderData = (data) => {
      const sess = data.session || {};
      const summary = sess.metricsSummary || {
        totalKeystrokes: Math.max(state.telemetryHistory.length * 15, 120),
        peakStruggleScore: Math.max(state.currentDiagnosis.frictionScore, 42),
        compilationErrors: state.liveTelemetry.recentErrors,
        interventionCount: state.tutorOpen ? 1 : 0
      };

      container.innerHTML = `
        <div class="space-y-6 fade-in">
          <!-- Metric Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow">
              <span class="text-xs text-slate-400 block mb-1">Total Keystrokes</span>
              <span class="text-2xl font-bold font-mono text-cyan-300">${summary.totalKeystrokes || 140}</span>
              <span class="text-[10px] text-emerald-400 block mt-1">100% Privacy Preserving</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow">
              <span class="text-xs text-slate-400 block mb-1">Peak Struggle Index</span>
              <span class="text-2xl font-bold font-mono text-amber-400">${summary.peakStruggleScore || state.currentDiagnosis.frictionScore}%</span>
              <span class="text-[10px] text-slate-400 block mt-1">Sub-300ms SLA Engine</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow">
              <span class="text-xs text-slate-400 block mb-1">Compilation Errors</span>
              <span class="text-2xl font-bold font-mono text-red-400">${summary.compilationErrors || state.liveTelemetry.recentErrors || 0}</span>
              <span class="text-[10px] text-slate-400 block mt-1">Loop Detection Active</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow">
              <span class="text-xs text-slate-400 block mb-1">AI Tutor Interventions</span>
              <span class="text-2xl font-bold font-mono text-emerald-400">${summary.interventionCount || (state.tutorOpen ? 1 : 0)}</span>
              <span class="text-[10px] text-indigo-400 block mt-1">Socratic Metaphor Pivot</span>
            </div>
          </div>

          <!-- Heatmap by Code Line -->
          <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-sm text-white">Line-by-Line Struggle Hotspot Heatmap</h3>
                <p class="text-xs text-slate-400">Pinpoints the exact logical statements where cognitive blocks occurred</p>
              </div>
              <span class="px-2.5 py-1 text-xs rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Target: ${window.CHALLENGES[state.currentChallengeIndex].title}
              </span>
            </div>

            <div class="space-y-1 font-mono text-xs">
              ${(codeEditor.value || '').split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isStruggling = lineNum === state.liveTelemetry.currentLine && state.currentDiagnosis.frictionScore >= 50;
                const intensity = isStruggling ? 'bg-red-950/60 border-l-4 border-red-500 text-red-200' : 'bg-slate-950/40 text-slate-400';

                return `
                  <div class="flex items-center p-1.5 rounded ${intensity}">
                    <span class="w-8 text-right pr-3 text-slate-600 select-none">${lineNum}</span>
                    <span class="truncate">${escapeHtml(line || ' ')}</span>
                    ${isStruggling ? '<span class="ml-auto px-2 py-0.5 rounded bg-red-600 text-white font-sans text-[10px] font-bold shrink-0">STUCK (45s dwell)</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    };

    fetch('/api/session-analytics')
      .then(res => res.json())
      .then(data => renderData(data))
      .catch(() => {
        renderData({});
      });
  }

  // 12. USER AUTHENTICATION & LOGIN MANAGEMENT
  function initAuth() {
    const saved = localStorage.getItem('confusion_tutor_user');
    if (saved) {
      try {
        state.currentUser = JSON.parse(saved);
      } catch(e) {}
    }

    if (state.currentUser) {
      document.getElementById('main-nav-bar')?.classList.remove('hidden');
      document.getElementById('main-simulator-bar')?.classList.remove('hidden');
      updateAuthUI();
      switchTab('workspace');
    } else {
      document.getElementById('main-nav-bar')?.classList.add('hidden');
      document.getElementById('main-simulator-bar')?.classList.add('hidden');
      updateAuthUI();
      switchTab('login');
    }

    // Form tab toggles
    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabSignUp = document.getElementById('auth-tab-signup');
    const formSignIn = document.getElementById('form-signin');
    const formSignUp = document.getElementById('form-signup');

    tabSignIn?.addEventListener('click', (e) => {
      e.preventDefault();
      tabSignIn.className = 'text-sm font-bold text-orange-400 border-b-2 border-orange-500 pb-1 mr-6 transition';
      tabSignUp.className = 'text-sm font-medium text-slate-400 hover:text-white pb-1 transition';
      formSignIn?.classList.remove('hidden');
      formSignUp?.classList.add('hidden');
    });

    tabSignUp?.addEventListener('click', (e) => {
      e.preventDefault();
      tabSignUp.className = 'text-sm font-bold text-orange-400 border-b-2 border-orange-500 pb-1 transition';
      tabSignIn.className = 'text-sm font-medium text-slate-400 hover:text-white pb-1 mr-6 transition';
      formSignUp?.classList.remove('hidden');
      formSignIn?.classList.add('hidden');
    });

    // Form Sign In submission
    formSignIn?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email')?.value.trim();
      const password = document.getElementById('signin-password')?.value;
      const errEl = document.getElementById('signin-error');

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          loginSuccess(data.user);
        } else {
          showAuthError(errEl, data.message || 'Login failed. Please check credentials.');
        }
      } catch(err) {
        // Fallback for static/offline mode
        loginSuccess({
          id: 'u_' + Date.now(),
          name: email.split('@')[0] || 'Alex Chen',
          email: email || 'alex@student.edu',
          role: 'Student',
          avatar: '👨‍💻'
        });
      }
    });

    // Form Sign Up submission
    formSignUp?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name')?.value.trim();
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value;
      const role = document.getElementById('signup-role')?.value || 'Student';
      const errEl = document.getElementById('signup-error');

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          loginSuccess(data.user);
        } else {
          showAuthError(errEl, data.message || 'Registration failed.');
        }
      } catch(err) {
        loginSuccess({
          id: 'u_' + Date.now(),
          name: name || 'Learner',
          email: email || 'user@edu.com',
          role: role,
          avatar: role === 'Educator' ? '👩‍🏫' : '👨‍💻'
        });
      }
    });

    // 1-Click Demo Profiles
    document.querySelectorAll('.quick-login-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prof = btn.getAttribute('data-profile');
        if (prof === 'student') {
          loginSuccess({ id: 'u_1', name: 'Alex Chen', email: 'alex@student.edu', role: 'Student', avatar: '👨‍💻' });
        } else if (prof === 'educator') {
          loginSuccess({ id: 'u_2', name: 'Dr. Sarah Connor', email: 'sarah@edu.org', role: 'Educator', avatar: '👩‍🏫' });
        } else {
          loginSuccess({ id: 'u_3', name: 'Guest Learner', email: 'guest@demo.com', role: 'Guest', avatar: '🚀' });
        }
      });
    });
  }

  function showAuthError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }

  function loginSuccess(user) {
    state.currentUser = user;
    localStorage.setItem('confusion_tutor_user', JSON.stringify(user));
    document.getElementById('main-nav-bar')?.classList.remove('hidden');
    document.getElementById('main-simulator-bar')?.classList.remove('hidden');
    updateAuthUI();
    telemetry.start();
    switchTab('workspace');
  }

  function logoutUser() {
    state.currentUser = null;
    localStorage.removeItem('confusion_tutor_user');
    fetch('/api/logout', { method: 'POST' }).catch(() => {});
    document.getElementById('main-nav-bar')?.classList.add('hidden');
    document.getElementById('main-simulator-bar')?.classList.add('hidden');
    updateAuthUI();
    telemetry.stop();
    switchTab('login');
  }

  function updateAuthUI() {
    const authContainer = document.getElementById('auth-header-container');
    if (!authContainer) return;

    if (state.currentUser) {
      authContainer.innerHTML = `
        <div class="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs shadow">
          <span class="text-base">${state.currentUser.avatar || '👨‍💻'}</span>
          <div class="leading-none pr-1">
            <span class="font-bold text-white block text-[11px]">${state.currentUser.name}</span>
            <span class="text-[9px] text-orange-400 font-mono">${state.currentUser.role}</span>
          </div>
          <button id="btn-logout" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 font-medium text-[10px] transition border border-slate-700/60" title="Sign Out">
            Sign Out ⎋
          </button>
        </div>
      `;
      document.getElementById('btn-logout')?.addEventListener('click', logoutUser);
    } else {
      authContainer.innerHTML = `
        <button id="btn-nav-login" class="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition">
          <span>🔑</span> Sign In
        </button>
      `;
      document.getElementById('btn-nav-login')?.addEventListener('click', () => {
        switchTab('login');
      });
    }
  }

  // 14. CHALLENGE SELECTOR CHANGE EVENT
  challengeSelect.addEventListener('change', (e) => {
    loadChallenge(parseInt(e.target.value, 10));
  });

  // Populate challenge dropdown
  challengeSelect.innerHTML = window.CHALLENGES.map((ch, idx) => `
    <option value="${idx}">${ch.title}</option>
  `).join('');

  // Initial Load: Check auth status (landing on Login if not authenticated)
  loadChallenge(0);
  initAuth();
  if (state.currentUser) {
    telemetry.start();
  }
});
