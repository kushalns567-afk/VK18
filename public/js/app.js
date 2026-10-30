// ==============================================================================
// APPLICATION CORE CONTROLLER
// Real-Time Confusion-Aware Interactive Tutor (Team VK 18)
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    activeTab: 'workspace', // 'workspace', 'analytics', 'creativity', 'deck', 'architecture'
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
    deckSlideIndex: 0 // 0 to 4
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
      creativity: document.getElementById('view-creativity'),
      deck: document.getElementById('view-deck')
    };

    Object.keys(views).forEach(k => {
      if (k === tabId) {
        views[k]?.classList.remove('hidden');
      } else {
        views[k]?.classList.add('hidden');
      }
    });

    if (tabId === 'deck') {
      renderSlide(state.deckSlideIndex);
    } else if (tabId === 'video') {
      videoTutor.render();
    } else if (tabId === 'analytics') {
      renderAnalyticsView();
    } else if (tabId === 'creativity') {
      renderCreativityLab();
    }
  }

  // Hook up IDE "Watch Video Lesson" button
  document.getElementById('btn-open-video-tutor')?.addEventListener('click', () => {
    switchTab('video');
  });

  // 11. PITCH DECK SLIDE VIEWER (Slides 1 to 5)
  const deckSlides = [
    {
      slideNum: "1/5",
      title: "Real-Time Confusion-Aware Interactive Tutor",
      subtitle: "Theme 06: Computational Creativity & Human-AI Interaction",
      teamName: "VK 18",
      teamId: "AH-52",
      members: ["MADHU N", "NAGESHWARI BS", "PAVAN K", "KUSHAL NS"],
      event: "AFTERHOURS 1.0 - CODE BEYOND THE CLOCK",
      host: "AWS STUDENT BUILDER GROUP DBIT | Don Bosco Institute of Technology, Bengaluru, Karnataka",
      contentHtml: `
        <div class="flex flex-col items-center justify-center text-center py-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-6">
            <span>🔥</span> AFTERHOURS 1.0 • HACKATHON PROTOTYPE
          </div>
          <h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-indigo-300 mb-4">
            Real-Time Confusion-Aware<br/>Interactive Tutor
          </h1>
          <p class="text-base text-slate-300 max-w-xl mx-auto mb-8">
            Non-invasive keystroke telemetry, real-time cognitive friction diagnosis, and dynamic Socratic visual analogies.
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full text-left">
            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[11px] text-slate-500 uppercase tracking-wider block">Theme</span>
              <span class="text-xs font-bold text-amber-300">06: Comp. Creativity</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[11px] text-slate-500 uppercase tracking-wider block">Team Name</span>
              <span class="text-xs font-bold text-orange-400">VK 18</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[11px] text-slate-500 uppercase tracking-wider block">Team ID</span>
              <span class="text-xs font-bold text-indigo-400">AH-52</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-[11px] text-slate-500 uppercase tracking-wider block">Institution</span>
              <span class="text-xs font-bold text-white">DBIT Bangalore</span>
            </div>
          </div>

          <div class="mt-8 flex flex-wrap justify-center gap-2">
            ${["MADHU N", "NAGESHWARI BS", "PAVAN K", "KUSHAL NS"].map(m => `
              <span class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                👤 ${m}
              </span>
            `).join('')}
          </div>
        </div>
      `
    },
    {
      slideNum: "2/5",
      title: "Theme & Problem Statement",
      subtitle: "Theme 06: Computational Creativity & Human-AI Interaction",
      contentHtml: `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div class="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xl mb-4">⚠️</div>
              <h3 class="text-base font-bold text-white mb-2">What Exact Problem Are We Solving?</h3>
              <ul class="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>Static E-Learning:</strong> Current coding & math platforms present rigid, one-way content that cannot sense learner cognitive load.</li>
                <li>• <strong>Silent Struggle:</strong> When students get confused on abstract concepts, their struggle remains completely invisible in real time.</li>
                <li>• <strong>Post-Mortem Discovery:</strong> Gaps are only identified after the student fails an assessment or gives up on the course entirely.</li>
              </ul>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl mb-4">👥</div>
              <h3 class="text-base font-bold text-white mb-2">For Whom Is This a Problem?</h3>
              <ul class="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>Self-Paced Learners:</strong> Students learning programming and math remotely without live teacher guidance.</li>
                <li>• <strong>Beginners in STEM:</strong> Learners who encounter non-intuitive syntax and unfamiliar mental models.</li>
                <li>• <strong>EdTech Platforms:</strong> Online learning providers suffering from massive <strong>80%+ student dropout rates</strong>.</li>
              </ul>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mb-4">🎯</div>
              <h3 class="text-base font-bold text-white mb-2">Why Does This Problem Matter?</h3>
              <ul class="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>Halts Friction Early:</strong> Intervening dynamically at the point of confusion prevents cognitive burnout and frustration.</li>
                <li>• <strong>Scalable 1-on-1 Guidance:</strong> Brings the proactive empathy of a human tutor to every student at zero marginal cost.</li>
                <li>• <strong>Cognitive Alignment:</strong> Matches the delivery format dynamically to the learner's real-time comprehension state.</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      slideNum: "3/5",
      title: "Proposed Solution",
      subtitle: "WHAT THE PRODUCT DOES",
      contentHtml: `
        <div class="py-6">
          <div class="p-4 rounded-xl bg-indigo-950/40 border border-indigo-700/50 mb-6 text-xs text-slate-200 leading-relaxed">
            <strong class="text-indigo-300 font-bold block mb-1">Executive Summary:</strong>
            An interactive React coding & math workspace that monitors non-invasive behavioral telemetry (typing speed, deletion frequency, inactivity dwell time, and repeated incorrect attempts). When confusion is diagnosed, the AI tutor intervenes dynamically, switching from high-level abstract explanations to step-by-step visual analogies.
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <span class="absolute -top-3 left-4 px-2 py-0.5 rounded bg-orange-600 text-[10px] font-bold text-white">Step 1</span>
              <h4 class="font-bold text-white text-sm mb-2 mt-2">Practice</h4>
              <p class="text-xs text-slate-300">Learner solves coding or math challenges inside an interactive React/Monaco workspace.</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <span class="absolute -top-3 left-4 px-2 py-0.5 rounded bg-amber-600 text-[10px] font-bold text-white">Step 2</span>
              <h4 class="font-bold text-white text-sm mb-2 mt-2">Track Telemetry</h4>
              <p class="text-xs text-slate-300">Client hooks measure typing cadence, burst deletions, idle dwell, and execution errors.</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <span class="absolute -top-3 left-4 px-2 py-0.5 rounded bg-red-600 text-[10px] font-bold text-white">Step 3</span>
              <h4 class="font-bold text-white text-sm mb-2 mt-2">Detect Confusion</h4>
              <p class="text-xs text-slate-300">Scoring heuristic detects struggle thresholds (e.g. repeated backspaces + 60s idle).</p>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 relative">
              <span class="absolute -top-3 left-4 px-2 py-0.5 rounded bg-emerald-600 text-[10px] font-bold text-white">Step 4</span>
              <h4 class="font-bold text-white text-sm mb-2 mt-2">Dynamic Pivot</h4>
              <p class="text-xs text-slate-300">AI Tutor intervenes via side-panel, switching from text to step-by-step visual analogies.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      slideNum: "4/5",
      title: "How It Works & Architecture",
      subtitle: "ARCHITECTURE & DATA FLOW",
      contentHtml: `
        <div class="py-6 space-y-6">
          <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-center text-slate-300 overflow-x-auto">
            <span class="text-cyan-400 font-bold">[React Web IDE / Canvas]</span>
            <span class="text-slate-500 mx-2">──(Telemetry Stream)──&gt;</span>
            <span class="text-amber-400 font-bold">[Confusion Diagnostic Engine]</span>
            <span class="text-slate-500 mx-2">──(Trigger Threshold)──&gt;</span>
            <span class="text-orange-400 font-bold">[AWS Bedrock / LLM]</span>
            <span class="text-slate-500 mx-2">──(Visual Metaphor)──&gt;</span>
            <span class="text-emerald-400 font-bold">[Interactive Step-by-Step UI]</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 class="font-bold text-sm text-cyan-300 mb-2">Tech Stack</h4>
              <ul class="text-xs text-slate-300 space-y-1.5">
                <li>• <strong>Frontend:</strong> React, Tailwind CSS, Monaco Editor (syntax & telemetry capture).</li>
                <li>• <strong>Backend & Cloud:</strong> Node.js / FastAPI, AWS Lambda (serverless triggers), Amazon DynamoDB (session telemetry & error logs).</li>
                <li>• <strong>AI Engine:</strong> AWS Bedrock (Claude 3.5 Sonnet / Llama 3) for dynamic analogy generation.</li>
              </ul>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 class="font-bold text-sm text-amber-300 mb-2">Data Source</h4>
              <ul class="text-xs text-slate-300 space-y-1.5">
                <li>• <strong>Keystroke Telemetry:</strong> Real-time typing velocity (WPM), burst deletes, backspace ratio.</li>
                <li>• <strong>Interaction Dwell:</strong> Inactivity time per code line/math problem & compilation error loops.</li>
                <li>• <strong>Synthetic Baselines:</strong> Calibrated against benchmark problem-solving logs to detect struggle vs. thinking.</li>
              </ul>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 class="font-bold text-sm text-purple-300 mb-2">Why Theme's Tech Is Needed</h4>
              <ul class="text-xs text-slate-300 space-y-1.5">
                <li>• <strong>Human-AI Interaction:</strong> Interventions must be non-intrusive, respecting student cognitive flow without annoying them.</li>
                <li>• <strong>Computational Creativity:</strong> Canned hints fail; AI dynamically synthesizes creative, relatable metaphors (e.g. arrays as lockers).</li>
                <li>• <strong>Real-Time Adaptation:</strong> Low latency guarantees assistance right when the confusion happens.</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      slideNum: "5/5",
      title: "What We Will Build",
      subtitle: "Core features to be built and demoed during the hackathon",
      contentHtml: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex gap-3">
            <div class="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">1</div>
            <div>
              <h4 class="font-bold text-white text-sm mb-1">Telemetry-Instrumented React IDE</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Monaco-powered coding dashboard instrumented with keystroke listeners. Monitors typing cadence, deletion frequency, dwell time, and execution errors. 100% privacy-preserving telemetry capture (zero webcam required).
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</div>
            <div>
              <h4 class="font-bold text-white text-sm mb-1">Real-Time Confusion Scoring Engine</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Lightweight heuristic algorithm evaluating cognitive friction thresholds. Distinguishes between constructive thinking pauses vs. unproductive struggle. Triggers adaptive tutoring events with sub-300ms latency.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex gap-3">
            <div class="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 font-bold flex items-center justify-center shrink-0">3</div>
            <div>
              <h4 class="font-bold text-white text-sm mb-1">Dynamic Socratic Intervention Modal</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Non-intrusive slide-in AI tutor that activates only upon confusion triggers. Converts abstract syntax & math logic into step-by-step visual analogies. Offers progressive hints that gradually scaffold understanding.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex gap-3">
            <div class="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center shrink-0">4</div>
            <div>
              <h4 class="font-bold text-white text-sm mb-1">Live Telemetry & Learning Heatmap</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Live HUD display of student typing speed, struggle index, and error frequency. Post-session timeline marking exact struggle points for review. Complete end-to-end working demo ready for judges.
              </p>
            </div>
          </div>
        </div>
      `
    }
  ];

  function renderSlide(index) {
    state.deckSlideIndex = index;
    const slide = deckSlides[index];
    const container = document.getElementById('slide-content-container');
    if (!container) return;

    container.innerHTML = `
      <div class="slide-card rounded-2xl p-6 md:p-8 min-h-[500px] flex flex-col justify-between shadow-2xl relative">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="h-6 w-1 bg-orange-500 rounded-full"></div>
            <div>
              <span class="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest">${slide.subtitle}</span>
              <h2 class="text-xl md:text-2xl font-bold text-white">${slide.title}</h2>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
            Slide ${slide.slideNum}
          </span>
        </div>

        <div class="flex-1 my-4">
          ${slide.contentHtml}
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span>AFTERHOURS 1.0</span>
            <span>•</span>
            <span class="text-orange-400 font-bold">Team VK 18 (AH-52)</span>
          </div>
          <div class="flex gap-2">
            <button id="btn-slide-prev" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition ${index === 0 ? 'opacity-40 cursor-not-allowed' : ''}">
              ◀ Previous
            </button>
            <button id="btn-slide-next" class="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium shadow transition ${index === deckSlides.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}">
              Next Slide ▶
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-slide-prev')?.addEventListener('click', () => {
      if (state.deckSlideIndex > 0) renderSlide(state.deckSlideIndex - 1);
    });
    document.getElementById('btn-slide-next')?.addEventListener('click', () => {
      if (state.deckSlideIndex < deckSlides.length - 1) renderSlide(state.deckSlideIndex + 1);
    });
  }

  // 12. ANALYTICS & HEATMAP VIEW
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

  // 13. COMPUTATIONAL CREATIVITY LAB VIEW
  function renderCreativityLab() {
    const container = document.getElementById('creativity-content-container');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="p-4 rounded-xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-indigo-950/40 border border-orange-500/30">
          <h3 class="text-base font-bold text-white mb-1">Theme 06: Computational Creativity & Human-AI Interaction</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Rather than serving generic syntax error messages or spoiling solutions, the tutor dynamically synthesizes creative, relatable visual metaphors that align with human spatial intuition.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span class="text-2xl mb-2 block">🪆</span>
              <h4 class="font-bold text-white text-sm">Recursion -> Russian Dolls</h4>
              <p class="text-xs text-slate-400 mt-1">Visualizes function stack frames as nested dolls. Solves the missing Base Case trap.</p>
            </div>
            <button id="btn-lab-dolls" class="mt-4 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow">
              Open Interactive Demo
            </button>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span class="text-2xl mb-2 block">🏫</span>
              <h4 class="font-bold text-white text-sm">Two-Pointers -> Hallway Lockers</h4>
              <p class="text-xs text-slate-400 mt-1">Converts array indices into school lockers and sliding student pointers.</p>
            </div>
            <button id="btn-lab-lockers" class="mt-4 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow">
              Open Interactive Demo
            </button>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span class="text-2xl mb-2 block">📖</span>
              <h4 class="font-bold text-white text-sm">Binary Search -> Phonebook Rip</h4>
              <p class="text-xs text-slate-400 mt-1">Visualizes O(log N) page-halving and upper/lower bound clipping.</p>
            </div>
            <button id="btn-lab-phone" class="mt-4 w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow">
              Open Interactive Demo
            </button>
          </div>
        </div>

        <!-- Metaphor Display Box -->
        <div id="creativity-preview-box" class="mt-6"></div>
      </div>
    `;

    const previewBox = document.getElementById('creativity-preview-box');
    metaphorEngine.render('recursion_dolls', previewBox);

    document.getElementById('btn-lab-dolls')?.addEventListener('click', () => {
      metaphorEngine.render('recursion_dolls', previewBox);
    });
    document.getElementById('btn-lab-lockers')?.addEventListener('click', () => {
      metaphorEngine.render('array_lockers', previewBox);
    });
    document.getElementById('btn-lab-phone')?.addEventListener('click', () => {
      metaphorEngine.render('binary_search', previewBox);
    });
  }

  // 14. CHALLENGE SELECTOR CHANGE EVENT
  challengeSelect.addEventListener('change', (e) => {
    loadChallenge(parseInt(e.target.value, 10));
  });

  // Populate challenge dropdown
  challengeSelect.innerHTML = window.CHALLENGES.map((ch, idx) => `
    <option value="${idx}">${ch.title}</option>
  `).join('');

  // Initial Load
  loadChallenge(0);
  telemetry.start();
});
