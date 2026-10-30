// ==============================================================================
// TELEMETRY CAPTURE & INTERACTION HOOKS (Slide 3 & 4 & 5)
// Non-invasive, 100% Privacy-Preserving Behavioral Tracking
// ==============================================================================

class TelemetryCollector {
  constructor(options = {}) {
    this.onUpdate = options.onUpdate || (() => {});
    this.onConfusionTrigger = options.onConfusionTrigger || (() => {});

    // State variables
    this.isActive = false;
    this.keystrokesInWindow = 0;
    this.burstDeletesInWindow = 0;
    this.recentKeys = [];
    this.recentKeyTimestamps = [];
    
    this.lastActiveTime = Date.now();
    this.idleSeconds = 0;
    this.currentLine = 1;
    this.cursorJumps = 0;
    this.recentErrors = 0;
    this.lastErrorTimestamp = 0;

    this.wpm = 0;
    this.backspaceRatio = 0;
    this.frictionScore = 0;
    this.currentState = 'FLOW';

    // Rolling history for graphs
    this.history = [];

    // Timers
    this.tickerInterval = null;
  }

  start() {
    this.isActive = true;
    this.lastActiveTime = Date.now();

    // 1-second pulse for idle tracking & velocity updates
    this.tickerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  stop() {
    this.isActive = false;
    if (this.tickerInterval) clearInterval(this.tickerInterval);
  }

  // Handle a keydown event from the editor
  recordKey(event, lineIndex = 1) {
    const now = Date.now();
    this.lastActiveTime = now;
    this.idleSeconds = 0;
    this.currentLine = lineIndex;

    this.keystrokesInWindow++;
    this.recentKeyTimestamps.push(now);

    const isDelete = event.key === 'Backspace' || event.key === 'Delete';
    if (isDelete) {
      this.burstDeletesInWindow++;
    }

    // Prune timestamps older than 10 seconds
    const tenSecAgo = now - 10000;
    this.recentKeyTimestamps = this.recentKeyTimestamps.filter(t => t > tenSecAgo);

    this.recomputeMetrics();
  }

  // Handle cursor / selection change
  recordCursorMove(newLineIndex) {
    if (Math.abs(newLineIndex - this.currentLine) > 2) {
      this.cursorJumps++;
    }
    this.currentLine = newLineIndex;
    this.lastActiveTime = Date.now();
    this.idleSeconds = 0;
  }

  // Record an execution error
  recordExecutionError(errorMessage) {
    const now = Date.now();
    this.recentErrors++;
    this.lastErrorTimestamp = now;
    this.lastActiveTime = now;

    // Immediately trigger friction evaluation
    this.tick(true);
  }

  recordExecutionSuccess() {
    // Reward success by dampening error counts
    this.recentErrors = Math.max(0, this.recentErrors - 1);
    this.tick(false);
  }

  // Every second calculation tick
  tick(isImmediate = false) {
    const now = Date.now();
    this.idleSeconds = Math.floor((now - this.lastActiveTime) / 1000);

    // Fade old errors after 60 seconds
    if (now - this.lastErrorTimestamp > 60000 && this.recentErrors > 0) {
      this.recentErrors--;
    }

    // Decay burst deletes slowly
    if (this.burstDeletesInWindow > 0 && Math.random() > 0.4) {
      this.burstDeletesInWindow = Math.max(0, this.burstDeletesInWindow - 1);
    }

    // Decay cursor jumps
    if (this.cursorJumps > 0 && Math.random() > 0.5) {
      this.cursorJumps = Math.max(0, this.cursorJumps - 1);
    }

    this.recomputeMetrics();
  }

  recomputeMetrics() {
    const now = Date.now();
    const tenSecAgo = now - 10000;
    const keysInLast10s = this.recentKeyTimestamps.filter(t => t > tenSecAgo).length;

    // Estimate WPM: (keystrokes / 5) * (60 / 10) = keys * 1.2
    this.wpm = Math.round(keysInLast10s * 1.2);

    // Backspace ratio
    this.backspaceRatio = keysInLast10s > 0 ? Number((this.burstDeletesInWindow / keysInLast10s).toFixed(2)) : 0;

    // Compute Friction Score locally using Cognitive Friction Model
    const telemetrySnapshot = {
      wpm: this.wpm,
      burstDeletes: this.burstDeletesInWindow,
      idleDwellSec: this.idleSeconds,
      backspaceRatio: this.backspaceRatio,
      recentErrors: this.recentErrors,
      cursorJumps: this.cursorJumps,
      currentLine: this.currentLine,
      timestamp: now
    };

    const diagnosis = this.evaluateConfusionScore(telemetrySnapshot);
    this.frictionScore = diagnosis.frictionScore;
    this.currentState = diagnosis.state;

    // Store in history (keep last 60 data points for sparkline)
    this.history.push({
      time: new Date().toLocaleTimeString().split(' ')[0],
      score: this.frictionScore,
      wpm: this.wpm,
      dwell: this.idleSeconds,
      state: this.currentState
    });
    if (this.history.length > 60) this.history.shift();

    // Notify listeners
    this.onUpdate({
      telemetry: telemetrySnapshot,
      diagnosis,
      history: this.history
    });

    if (diagnosis.triggerIntervention) {
      this.onConfusionTrigger({
        telemetry: telemetrySnapshot,
        diagnosis
      });
    }

    // Send async telemetry to server
    this.sendToServer(telemetrySnapshot);
  }

  evaluateConfusionScore(data) {
    const { wpm, burstDeletes, idleDwellSec, backspaceRatio, recentErrors, cursorJumps } = data;

    // Weight 1: Burst deletions (0-30 pts)
    const deletionScore = Math.min(30, burstDeletes * 1.8 + (backspaceRatio > 0.35 ? 12 : 0));

    // Weight 2: Dwell friction (0-35 pts)
    // 0-15s is natural thinking; 15-45s is escalating cognitive load; >45s is freeze
    let dwellScore = 0;
    if (idleDwellSec > 10) {
      dwellScore = Math.min(35, (idleDwellSec - 10) * 1.3);
    }

    // Weight 3: Compilation error loops (0-25 pts)
    const errorScore = Math.min(25, recentErrors * 9.0);

    // Weight 4: Cursor wandering (0-10 pts)
    const navScore = Math.min(10, cursorJumps * 1.5);

    // Flow velocity discount: active smooth typing drops score
    const flowDiscount = wpm > 30 ? Math.min(15, (wpm - 30) * 0.45) : 0;

    let score = Math.round(Math.max(0, Math.min(100, (deletionScore + dwellScore + errorScore + navScore) - flowDiscount)));

    let state = 'FLOW';
    let trigger = false;
    let reason = 'Fluid coding and smooth cadence.';

    if (score >= 65) {
      state = 'CONFUSION';
      trigger = true;
      if (recentErrors >= 2) reason = 'Stuck in compilation error loop!';
      else if (burstDeletes >= 8 && idleDwellSec > 15) reason = 'Frequent deletion bursts & prolonged hesitation!';
      else if (idleDwellSec >= 35) reason = 'Prolonged cognitive block / freeze on current line!';
      else reason = 'Cognitive friction threshold breached!';
    } else if (score >= 35) {
      state = 'THINKING';
      reason = 'Constructive thinking pause. Observing passively.';
    }

    return {
      frictionScore: score,
      state,
      triggerIntervention: trigger,
      reason,
      components: {
        deletionScore: Math.round(deletionScore),
        dwellScore: Math.round(dwellScore),
        errorScore: Math.round(errorScore),
        flowDiscount: Math.round(flowDiscount)
      }
    };
  }

  async sendToServer(payload) {
    try {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {
      // offline fallback
    }
  }

  // Quick Demo Trigger Simulation Methods for Judges
  simulateBurstDeletions() {
    this.burstDeletesInWindow = 18;
    this.recentKeyTimestamps = Array(20).fill(Date.now());
    this.idleSeconds = 12;
    this.tick(true);
  }

  simulateProlongedFreeze() {
    this.idleSeconds = 48;
    this.burstDeletesInWindow = 6;
    this.tick(true);
  }

  simulateErrorLoop() {
    this.recentErrors = 3;
    this.burstDeletesInWindow = 10;
    this.idleSeconds = 20;
    this.tick(true);
  }

  resetToFlowState() {
    this.burstDeletesInWindow = 0;
    this.idleSeconds = 0;
    this.recentErrors = 0;
    this.cursorJumps = 0;
    this.lastActiveTime = Date.now();
    this.recentKeyTimestamps = Array(25).fill(Date.now());
    this.tick(true);
  }
}

window.TelemetryCollector = TelemetryCollector;

