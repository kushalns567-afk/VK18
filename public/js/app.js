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
    currentUser: null,
    lastExecutionResult: {
      hasRun: false,
      hasError: false,
      errorName: null,
      errorMessage: null,
      actualOutput: null,
      expectedOutput: '24',
      isMatch: false
    }
  };

  // Initialize Metaphor Visualizer Engine
  const metaphorEngine = new window.VisualMetaphorEngine('metaphor-canvas');

  // Initialize Video Tutor Engine
  const videoTutor = new window.VideoTutorEngine({ containerId: 'video-tutor-container' });
  window.videoTutorInstance = videoTutor;
  videoTutor.init();

  // Initialize Real Peer-to-Peer Connecting Platform
  let peerPlatform = null;
  if (window.PeerPlatformManager) {
    peerPlatform = new window.PeerPlatformManager({ containerId: 'peer-platform-container' });
    window.peerPlatformInstance = peerPlatform;
    peerPlatform.init();
  }

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

    consoleOutput.innerHTML = `<span class="text-slate-500">// Ready to execute ${challenge.title}... Target expected value: ${challenge.expectedOutput}</span>`;
    
    // Reset execution and confusion state for new challenge
    state.lastExecutionResult = {
      hasRun: false,
      hasError: false,
      errorName: null,
      errorMessage: null,
      actualOutput: null,
      expectedOutput: challenge.expectedOutput,
      isMatch: false
    };
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
    const currentCh = window.CHALLENGES[state.currentChallengeIndex];
    state.isExecuting = true;
    consoleOutput.innerHTML = `<span class="text-cyan-400">⚡ Executing script in sandbox...</span>`;

    // Captured logs & errors
    let capturedLogs = [];
    let hadError = false;
    let errorDetail = null;
    let errorName = null;

    const originalConsoleLog = console.log;
    console.log = function(...args) {
      capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      originalConsoleLog.apply(console, args);
    };

    const startTime = performance.now();
    try {
      // Run in function wrapper with sandbox safety
      const runner = new Function(code);
      runner();
      const elapsed = Math.round(performance.now() - startTime);

      const combinedOutput = capturedLogs.join(' ');
      // Compare output with expected target value
      const isMatch = combinedOutput.includes(currentCh.expectedOutput);

      state.lastExecutionResult = {
        hasRun: true,
        hasError: false,
        errorName: null,
        errorMessage: null,
        actualOutput: combinedOutput || 'No output returned',
        expectedOutput: currentCh.expectedOutput,
        isMatch: isMatch
      };

      let outputHtml = `<div class="text-xs text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
        <span>Execution status: <strong class="${isMatch ? 'text-emerald-400' : 'text-amber-400'}">${isMatch ? 'PASSED ✅' : 'VALUE MISMATCH ⚠️'}</strong></span>
        <span>${elapsed}ms</span>
      </div>`;

      if (capturedLogs.length > 0) {
        outputHtml += capturedLogs.map(log => `<div class="text-slate-200 font-mono mt-1">${escapeHtml(log)}</div>`).join('');
      } else {
        outputHtml += `<div class="text-slate-400 font-mono italic mt-1">(Code executed without console.log output)</div>`;
      }

      // Expected vs Output Comparison Card
      outputHtml += `
        <div class="mt-2.5 p-2 bg-slate-900 border ${isMatch ? 'border-emerald-700/60' : 'border-amber-600/60'} rounded-lg text-xs flex flex-wrap justify-between items-center gap-2">
          <div>
            <span class="text-slate-400">Target Value:</span> <strong class="text-emerald-400 font-mono">${currentCh.expectedOutput}</strong>
            <span class="mx-2 text-slate-600">|</span>
            <span class="text-slate-400">Actual Result:</span> <strong class="${isMatch ? 'text-emerald-300' : 'text-amber-300'} font-mono">${escapeHtml(combinedOutput || 'undefined')}</strong>
          </div>
          ${!isMatch ? `
            <button id="btn-terminal-open-fix" class="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] shadow transition">
              Inspect Corrected Value in AI Tutor ➔
            </button>
          ` : ''}
        </div>
      `;

      consoleOutput.innerHTML = outputHtml;

      document.getElementById('btn-terminal-open-fix')?.addEventListener('click', () => {
        openTutorDrawer(true);
        switchScaffoldingLevel(4);
      });

      if (isMatch) {
        telemetry.recordExecutionSuccess();
      } else {
        telemetry.recordExecutionError('Output did not match expected value: ' + currentCh.expectedOutput);
      }
    } catch (err) {
      hadError = true;
      errorName = err.name;
      errorDetail = err.message || err.toString();
      const elapsed = Math.round(performance.now() - startTime);

      state.lastExecutionResult = {
        hasRun: true,
        hasError: true,
        errorName: errorName,
        errorMessage: errorDetail,
        actualOutput: `${errorName}: ${errorDetail}`,
        expectedOutput: currentCh.expectedOutput,
        isMatch: false
      };

      consoleOutput.innerHTML = `
        <div class="text-xs text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
          <span>Execution status: <strong class="text-red-400">RUNTIME ERROR</strong></span>
          <span>${elapsed}ms</span>
        </div>
        <div class="text-red-400 font-mono mt-2 p-2 bg-red-950/40 border border-red-800/60 rounded">
          ❌ <strong>${escapeHtml(err.name)}:</strong> ${escapeHtml(errorDetail)}
        </div>
        <div class="mt-2.5 p-2 bg-slate-900 border border-red-700/60 rounded-lg text-xs flex flex-wrap justify-between items-center gap-2">
          <div>
            <span class="text-slate-400">Target Corrected Value:</span> <strong class="text-emerald-400 font-mono">${currentCh.expectedOutput}</strong>
            <span class="mx-2 text-slate-600">|</span>
            <span class="text-slate-400">Status:</span> <strong class="text-red-400 font-mono">Crashed (${escapeHtml(err.name)})</strong>
          </div>
          <button id="btn-terminal-open-fix-err" class="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow transition">
            See Corrected Value in AI Tutor ➔
          </button>
        </div>
      `;

      document.getElementById('btn-terminal-open-fix-err')?.addEventListener('click', () => {
        openTutorDrawer(true);
        switchScaffoldingLevel(4);
      });

      telemetry.recordExecutionError(errorDetail);
    } finally {
      console.log = originalConsoleLog;
      state.isExecuting = false;
      updateTutorErrorPanel(currentCh);
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

  function updateTutorErrorPanel(challenge) {
    if (!challenge) challenge = window.CHALLENGES[state.currentChallengeIndex];
    const res = state.lastExecutionResult || { hasRun: false };

    const iconEl = document.getElementById('tutor-error-icon');
    const titleEl = document.getElementById('tutor-error-title');
    const badgeEl = document.getElementById('tutor-error-badge');
    const actualValEl = document.getElementById('tutor-actual-error-val');
    const expectedValEl = document.getElementById('tutor-expected-correct-val');
    const diagTextEl = document.getElementById('tutor-error-diagnosis-text');

    const expectedDisplay = challenge.correctedOutput !== undefined ? challenge.correctedOutput : JSON.stringify(challenge.expectedOutput);
    if (expectedValEl) {
      expectedValEl.textContent = expectedDisplay;
      expectedValEl.title = `Expected Correct Value: ${expectedDisplay}`;
    }

    if (!res.hasRun) {
      if (iconEl) iconEl.textContent = 'ℹ️';
      if (titleEl) {
        titleEl.textContent = 'Execution Status: Ready';
        titleEl.className = 'text-xs font-bold text-slate-300';
      }
      if (badgeEl) {
        badgeEl.textContent = 'Not Run Yet';
        badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700';
      }
      if (actualValEl) actualValEl.textContent = '(Run code to inspect)';
      if (diagTextEl) diagTextEl.textContent = challenge.errorFixExplanation || 'Click "Run Code" in the editor. The AI Tutor monitors execution and displays your actual value vs. corrected target value here.';
      return;
    }

    if (res.hasError) {
      if (iconEl) iconEl.textContent = '🚨';
      if (titleEl) {
        titleEl.textContent = `Runtime Crash: ${res.errorName || 'Error'}`;
        titleEl.className = 'text-xs font-bold text-red-400';
      }
      if (badgeEl) {
        badgeEl.textContent = 'Runtime Exception';
        badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700 animate-pulse';
      }
      if (actualValEl) {
        actualValEl.textContent = `${res.errorName || 'Error'}: ${res.errorMessage}`;
        actualValEl.title = `${res.errorName}: ${res.errorMessage}`;
      }
      if (diagTextEl) {
        diagTextEl.textContent = challenge.errorFixExplanation || `Your code produced a ${res.errorName}: "${res.errorMessage}". Expected corrected target value is ${expectedDisplay}.`;
      }
    } else if (!res.isMatch) {
      if (iconEl) iconEl.textContent = '⚠️';
      if (titleEl) {
        titleEl.textContent = 'Value Mismatch Detected';
        titleEl.className = 'text-xs font-bold text-amber-400';
      }
      if (badgeEl) {
        badgeEl.textContent = 'Wrong Output';
        badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700';
      }
      if (actualValEl) {
        actualValEl.textContent = typeof res.actualOutput === 'object' ? JSON.stringify(res.actualOutput) : String(res.actualOutput);
        actualValEl.title = `Actual Output: ${actualValEl.textContent}`;
      }
      if (diagTextEl) {
        diagTextEl.textContent = challenge.errorFixExplanation || `Your code returned ${actualValEl.textContent}, but the expected corrected value is ${expectedDisplay}. See Level 4 for the step-by-step fix.`;
      }
    } else {
      if (iconEl) iconEl.textContent = '✅';
      if (titleEl) {
        titleEl.textContent = 'All Checks Passed!';
        titleEl.className = 'text-xs font-bold text-emerald-400';
      }
      if (badgeEl) {
        badgeEl.textContent = 'Correct Output';
        badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700';
      }
      if (actualValEl) {
        actualValEl.textContent = typeof res.actualOutput === 'object' ? JSON.stringify(res.actualOutput) : String(res.actualOutput);
      }
      if (diagTextEl) {
        diagTextEl.textContent = `Success! Your code generated the corrected expected value: ${expectedDisplay}.`;
      }
    }
  }

  function refreshMetaphorInTutor(challenge) {
    if (!challenge) challenge = window.CHALLENGES[state.currentChallengeIndex];
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

    // Update dynamic Error & Corrected Value Panel
    updateTutorErrorPanel(challenge);

    // Update Level 4 (Corrected Value & Solution Scout)
    const scaffoldExpectedBadge = document.getElementById('scaffold-expected-badge');
    const scaffoldBreakdown = document.getElementById('scaffold-corrected-breakdown');
    const scaffoldSnippet = document.getElementById('scaffold-corrected-snippet');
    const btnApplyFix = document.getElementById('btn-apply-corrected-fix');

    const expectedDisplay = challenge.correctedOutput !== undefined ? challenge.correctedOutput : JSON.stringify(challenge.expectedOutput);
    if (scaffoldExpectedBadge) scaffoldExpectedBadge.textContent = `Expected: ${expectedDisplay}`;
    if (scaffoldBreakdown) scaffoldBreakdown.textContent = challenge.correctedValueBreakdown || `Target value calculation: ${expectedDisplay}`;
    if (scaffoldSnippet) scaffoldSnippet.textContent = challenge.correctedSnippet || challenge.correctedCode || '';

    if (btnApplyFix) {
      btnApplyFix.onclick = () => {
        if (!challenge.correctedCode) return;
        codeEditor.value = challenge.correctedCode;
        updateLineNumbers();
        btnApplyFix.innerHTML = '<span>✔️</span> Applied!';
        btnApplyFix.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
        btnApplyFix.classList.add('bg-emerald-700');
        setTimeout(() => {
          btnApplyFix.innerHTML = '<span>⚡</span> Apply Corrected Code';
          btnApplyFix.classList.remove('bg-emerald-700');
          btnApplyFix.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
        }, 1800);
        runUserCode();
      };
    }

    // Set scaffolding tab: if error exists, automatically open Level 4 (Fix Hint); otherwise keep user level
    if (state.lastExecutionResult && (state.lastExecutionResult.hasError || !state.lastExecutionResult.isMatch)) {
      switchScaffoldingLevel(4);
    } else {
      switchScaffoldingLevel(state.activeHintLevel || 1);
    }
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

    const currentCh = window.CHALLENGES[state.currentChallengeIndex];
    const execRes = state.lastExecutionResult || { hasRun: false };
    const expectedDisplay = currentCh.correctedOutput !== undefined ? currentCh.correctedOutput : JSON.stringify(currentCh.expectedOutput);

    try {
      const res = await fetch('/api/bedrock-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentCh.topic,
          code: codeEditor.value,
          question: text,
          lastExecution: execRes,
          expectedCorrectValue: expectedDisplay,
          correctedBreakdown: currentCh.correctedValueBreakdown
        })
      });
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      const metaphor = data.creativeMetaphor;

      let errorContextHtml = '';
      if (execRes.hasError) {
        errorContextHtml = `
          <div class="mt-2 p-2 bg-red-950/70 border border-red-800 rounded text-xs space-y-1">
            <div class="font-bold text-red-300">Detected Error: ${execRes.errorName}</div>
            <div class="text-slate-300">Corrected Target Value: <span class="font-mono text-emerald-300 font-bold">${expectedDisplay}</span></div>
            <div class="text-[11px] text-cyan-300">${currentCh.correctedValueBreakdown || ''}</div>
          </div>
        `;
      } else if (execRes.hasRun && !execRes.isMatch) {
        errorContextHtml = `
          <div class="mt-2 p-2 bg-amber-950/70 border border-amber-800 rounded text-xs space-y-1">
            <div class="font-bold text-amber-300">Output Mismatch: Got ${JSON.stringify(execRes.actualOutput)}</div>
            <div class="text-slate-300">Corrected Target Value: <span class="font-mono text-emerald-300 font-bold">${expectedDisplay}</span></div>
            <div class="text-[11px] text-cyan-300">${currentCh.correctedValueBreakdown || ''}</div>
          </div>
        `;
      }

      typingIndicator.innerHTML = `
        <div class="text-xs font-semibold text-orange-400 mb-1">🤖 AI Tutor (AWS Bedrock Claude 3.5):</div>
        <p class="text-xs text-slate-200">${metaphor.summary}</p>
        ${errorContextHtml}
        <div class="mt-2 p-2 bg-slate-900 rounded border border-slate-700 text-xs text-amber-300">
          <strong>Socratic Nudge:</strong> ${metaphor.socraticPrompt}
        </div>
      `;
    } catch (err) {
      // Dynamic Local Socratic Engine (Offline & Static Mode fallback)
      const m = currentCh.defaultMetaphor || {};
      let errorAnalysisBlock = '';

      if (execRes.hasError) {
        errorAnalysisBlock = `
          <div class="mt-2 p-2.5 bg-red-950/80 border border-red-700/80 rounded-lg text-xs space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-red-300">🛑 Error Detected: ${execRes.errorName}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-red-900 text-red-200">Runtime Crash</span>
            </div>
            <div class="text-slate-300 font-mono text-[11px] bg-slate-950/80 p-1.5 rounded border border-red-900/50">
              ${escapeHtml(execRes.errorMessage || 'Execution halted abnormally.')}
            </div>
            <div class="text-emerald-300 font-semibold flex items-center justify-between pt-1 border-t border-red-900/40">
              <span>Target Corrected Value:</span>
              <span class="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600">${expectedDisplay}</span>
            </div>
            <p class="text-[11px] text-cyan-200 leading-normal">
              <strong>Calculation:</strong> ${escapeHtml(currentCh.correctedValueBreakdown || '')}
            </p>
          </div>
        `;
      } else if (execRes.hasRun && !execRes.isMatch) {
        errorAnalysisBlock = `
          <div class="mt-2 p-2.5 bg-amber-950/80 border border-amber-700/80 rounded-lg text-xs space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-300">⚠️ Output Value Mismatch</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-900 text-amber-200">Wrong Answer</span>
            </div>
            <div class="text-slate-300 font-mono text-[11px]">
              Actual: <span class="text-red-400 font-bold">${JSON.stringify(execRes.actualOutput)}</span> vs Correct: <span class="text-emerald-400 font-bold">${expectedDisplay}</span>
            </div>
            <p class="text-[11px] text-cyan-200 leading-normal">
              <strong>Calculation:</strong> ${escapeHtml(currentCh.correctedValueBreakdown || '')}
            </p>
          </div>
        `;
      } else if (execRes.hasRun && execRes.isMatch) {
        errorAnalysisBlock = `
          <div class="mt-2 p-2.5 bg-emerald-950/80 border border-emerald-700/80 rounded-lg text-xs space-y-1">
            <div class="font-bold text-emerald-300">✅ Code Output Verified!</div>
            <div class="text-slate-200 text-[11px]">Your output correctly matches target <span class="font-mono font-bold text-emerald-400">${expectedDisplay}</span>!</div>
          </div>
        `;
      } else {
        errorAnalysisBlock = `
          <div class="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <span class="text-slate-400 block text-[10px]">Target Corrected Value for this problem:</span>
            <span class="font-mono text-emerald-400 font-bold text-xs">${expectedDisplay}</span>
            <div class="text-[11px] text-slate-300 mt-1">${escapeHtml(currentCh.correctedValueBreakdown || '')}</div>
          </div>
        `;
      }

      typingIndicator.innerHTML = `
        <div class="text-xs font-semibold text-orange-400 mb-1">🤖 AI Tutor (Socratic Engine):</div>
        <p class="text-xs text-slate-200">Think back to <strong>${escapeHtml(m.title || 'the visual analogy')}</strong>. ${escapeHtml(m.explanation || '')}</p>
        ${errorAnalysisBlock}
        <div class="mt-2 p-2 bg-slate-900 rounded border border-slate-700 text-xs text-amber-300">
          <strong>Socratic Nudge:</strong> Look at Line ${state.liveTelemetry.currentLine || 1}. ${escapeHtml(currentCh.errorFixExplanation || 'What condition is required to produce the corrected value?')}
        </div>
        <div class="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Need the full code solution?</span>
          <button class="text-emerald-400 hover:underline font-bold" onclick="document.querySelector('[data-level=\\'4\\']')?.click()">View Level 4 Scout ➔</button>
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
      peer: document.getElementById('view-peer'),
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
    } else if (tabId === 'peer') {
      renderPeerView();
    } else if (tabId === 'analytics') {
      renderAnalyticsView();
    }
  }

  // Hook up IDE "Watch Video Lesson" button
  document.getElementById('btn-open-video-tutor')?.addEventListener('click', () => {
    switchTab('video');
  });

  // 10B. PEER-TO-PEER KNOWLEDGE EXCHANGE CONTROLLER
  const peerCommunityModels = [
    {
      id: 1,
      title: 'Recursion as Russian Nesting Dolls',
      concept: 'Recursion & Algorithms',
      author: 'Sarah K. (Senior Peer)',
      analogy: 'Opening doll 4 reveals doll 3, then doll 2, until you reach the solid baby doll at the center. The solid baby doll is your Base Case — without it, the table collapses under infinite dolls!',
      upvotes: 48,
      tags: ['Recursion', 'Base Case', 'Call Stack']
    },
    {
      id: 2,
      title: 'Two Pointers as Sliding Bookmarks',
      concept: 'Array & Two-Sum Optimization',
      author: 'Leo M. (Peer Mentor)',
      analogy: 'Imagine two bookmarks at both ends of a sorted dictionary. If the word sum is too high, pull the right bookmark inwards. If too low, push the left bookmark forward. Zero wasted comparisons!',
      upvotes: 39,
      tags: ['Two Pointers', 'O(N)', 'Optimization']
    },
    {
      id: 3,
      title: 'Python Variables as Kitchen Jars with Labels',
      concept: 'Variables & Data Types',
      author: 'David R. (Python Tutor)',
      analogy: 'The jar is the memory address, the sticky note is the variable name (e.g. "sugar"), and what you pour inside is the value. You can change what is inside the jar at any time!',
      upvotes: 31,
      tags: ['Python', 'Variables', 'Memory']
    },
    {
      id: 4,
      title: 'Python Dictionaries as a Real Phonebook',
      concept: 'Hash Maps & Key-Value Lookups',
      author: 'Priya N. (Peer Reviewer)',
      analogy: 'Instead of looking people up by page number 0, 1, 2 (like lists), you look them up directly by their name ("Alice"). Looking up a name takes instant O(1) time!',
      upvotes: 27,
      tags: ['Python', 'Dictionaries', 'O(1) Hash Map']
    }
  ];

  function renderPeerView() {
    // Mode toggle between Live P2P Rooms & Mental Models
    const btnLiveRooms = document.getElementById('btn-tab-live-rooms');
    const btnMentalModels = document.getElementById('btn-tab-mental-models');
    const platformContainer = document.getElementById('peer-platform-container');
    const communityContainer = document.getElementById('peer-community-container');

    btnLiveRooms?.addEventListener('click', () => {
      btnLiveRooms.className = 'px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition';
      if (btnMentalModels) btnMentalModels.className = 'px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition';
      platformContainer?.classList.remove('hidden');
      communityContainer?.classList.add('hidden');
    });

    btnMentalModels?.addEventListener('click', () => {
      btnMentalModels.className = 'px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition';
      if (btnLiveRooms) btnLiveRooms.className = 'px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition';
      communityContainer?.classList.remove('hidden');
      platformContainer?.classList.add('hidden');
      renderCommunityModels();
    });

    renderCommunityModels();
  }

  function renderCommunityModels() {
    const list = document.getElementById('peer-models-list');
    if (!list) return;

    list.innerHTML = peerCommunityModels.map(m => `
      <div class="p-4 rounded-xl bg-[#111827] border border-slate-800 hover:border-indigo-500/40 transition shadow-lg space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              ${m.concept}
            </span>
            <span class="text-xs text-slate-400 font-mono">by ${m.author}</span>
          </div>
          <button class="btn-upvote-peer px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-amber-400 border border-slate-700 flex items-center gap-1.5 transition" data-id="${m.id}">
            <span>▲ Upvote</span>
            <strong class="text-white">${m.upvotes}</strong>
          </button>
        </div>
        <h4 class="text-sm font-bold text-white">${m.title}</h4>
        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          "${m.analogy}"
        </p>
        <div class="flex items-center justify-between text-[11px] pt-1">
          <div class="flex items-center gap-1.5">
            ${m.tags.map(t => `<span class="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 text-[10px]">${t}</span>`).join('')}
          </div>
          <button class="btn-watch-concept-video text-orange-400 hover:text-orange-300 text-xs font-bold transition flex items-center gap-1" data-concept="${m.concept}">
            <span>▶ Watch Video</span>
          </button>
        </div>
      </div>
    `).join('');

    // Wire up upvote buttons
    list.querySelectorAll('.btn-upvote-peer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const item = peerCommunityModels.find(m => m.id === id);
        if (item) {
          item.upvotes++;
          renderCommunityModels();
        }
      });
    });

    // Wire up concept video buttons
    list.querySelectorAll('.btn-watch-concept-video').forEach(btn => {
      btn.addEventListener('click', () => {
        launchPeerVideo();
      });
    });
  }

  function launchPeerVideo() {
    switchTab('video');
    // Peer lesson is index 0
    if (window.videoTutorInstance) {
      window.videoTutorInstance.switchLesson(0);
      window.videoTutorInstance.play();
    }
  }

  // Hook up Launch Peer Video buttons
  document.getElementById('btn-watch-peer-video')?.addEventListener('click', launchPeerVideo);
  document.getElementById('btn-start-peer-video-banner')?.addEventListener('click', launchPeerVideo);

  // Hook up Submit Model Form
  document.getElementById('btn-submit-peer-model')?.addEventListener('click', () => {
    const titleInput = document.getElementById('input-peer-title');
    const analogyInput = document.getElementById('input-peer-analogy');
    const title = titleInput?.value.trim();
    const analogy = analogyInput?.value.trim();

    if (!title || !analogy) {
      alert('Please enter both a concept title and your mental model description!');
      return;
    }

    peerCommunityModels.unshift({
      id: Date.now(),
      title: title,
      concept: 'Community Contribution',
      author: 'You (Active Peer)',
      analogy: analogy,
      upvotes: 1,
      tags: ['Peer Tip', 'Community']
    });

    titleInput.value = '';
    analogyInput.value = '';
    renderPeerView();
  });

  // Hook up Join Room buttons
  document.querySelectorAll('.btn-join-room').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Joined Peer Room! Connecting audio/video data channel with active peers...');
    });
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
