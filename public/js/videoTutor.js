// ==============================================================================
// INTERACTIVE VIDEO TUTOR & ADAPTIVE LEARNING STUDIO (Theme 06)
// Interactive video lessons with mid-lecture checkpoints, understanding diagnostics,
// and targeted adaptive re-teaching for identified knowledge gaps.
// ==============================================================================

class VideoTutorEngine {
  constructor(options = {}) {
    this.containerId = options.containerId || 'video-tutor-container';
    this.currentLessonIndex = 0;
    this.isPlaying = false;
    this.currentTimeSec = 0;
    this.totalDurationSec = 90;
    this.voiceEnabled = true;
    this.currentCheckpoint = null;
    this.answers = {};
    this.diagnosticReport = null;
    this.activeReteach = null;
    this.speechUtterance = null;
    this.animationTimer = null;
    this.mouthOpen = false;

    // Lessons catalog
    this.lessons = [
      {
        id: "recursion",
        title: "Lesson 1: Recursion & The Call Stack",
        subtitle: "Why the Base Case stops infinite memory explosion",
        category: "Recursion & Algorithms",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 90,
        timeline: [
          { time: 0, title: "Introduction: What is Recursion?", slideText: "Recursion is a function solving a problem by calling a smaller copy of itself." },
          { time: 20, title: "The Call Stack Mechanics", slideText: "Each call stacks a new memory frame on top of the previous one." },
          { time: 40, title: "Checkpoint 1: The Infinite Trap", isCheckpoint: true, checkpointId: "q1" },
          { time: 55, title: "The Base Case Solution", slideText: "A guard clause 'if (n <= 1) return 1' halts the downward spiral." },
          { time: 75, title: "Checkpoint 2: The Return Unwinding", isCheckpoint: true, checkpointId: "q2" },
          { time: 85, title: "Summary & Synthesis", slideText: "Two parts to every recursion: 1) Base Case, 2) Recursive Step!" }
        ],
        narration: [
          "Welcome to our interactive session on Recursion! Many students think recursion is magic, but it is actually a neat stack of memory trays.",
          "Every time factorial calls itself, it puts a new task onto the Call Stack. But what stops this stack from growing forever?",
          "Let's test your mental model on this before we continue. Answer the checkpoint on your screen!"
        ],
        questions: {
          q1: {
            title: "In-Video Checkpoint 1 (Time 0:40)",
            question: "In factorial(n), if we write 'return n * factorial(n - 1)' without an 'if' base case check, what actually happens in computer memory?",
            options: [
              { key: "A", text: "The function safely stops when n reaches 0 and returns 0" },
              { key: "B", text: "It creates infinite stack frames until Maximum Call Stack Exceeded (Stack Overflow)", isCorrect: true },
              { key: "C", text: "It runs backwards and calculates the answer anyway" }
            ],
            gapId: "base_case_overflow",
            gapConcept: "Base Case & Memory Overload"
          },
          q2: {
            title: "In-Video Checkpoint 2 (Time 1:15)",
            question: "When does factorial(4) actually receive its multiplied numerical value?",
            options: [
              { key: "A", text: "On the very first line before calling factorial(3)" },
              { key: "B", text: "Only during the unwinding phase AFTER the base case returns 1", isCorrect: true },
              { key: "C", text: "The moment memory runs out" }
            ],
            gapId: "stack_unwind",
            gapConcept: "Stack Unwinding Propagation"
          }
        }
      },
      {
        id: "two_pointers",
        title: "Lesson 2: Two-Pointer Technique",
        subtitle: "Using sorted memory to solve problems in O(N) linear time",
        category: "Arrays & Pointers",
        videoAvatar: "👨‍🏫 Dr. Turing",
        durationSec: 90,
        timeline: [
          { time: 0, title: "The Brute Force Problem", slideText: "Nested loops take O(N^2) time to test all pairs. We can do better!" },
          { time: 25, title: "Leveraging Sorted Order", slideText: "Sorted arrays place smallest numbers on the left and largest on the right." },
          { time: 45, title: "Checkpoint 1: The Pointer Shift", isCheckpoint: true, checkpointId: "q1" },
          { time: 65, title: "The Monotonic Elimination", slideText: "Discarding useless numbers in 1 step without checking them all." },
          { time: 80, title: "Checkpoint 2: The Search Window", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Hello! Today we unlock the Two-Pointer technique. Instead of checking every pair like searching a haystack, we slide two bookmarks.",
          "Because the array is sorted, we always know which direction makes the sum larger or smaller. Let's see if you can spot which pointer to move!"
        ],
        questions: {
          q1: {
            title: "In-Video Checkpoint 1 (Time 0:45)",
            question: "Given sorted array [2, 7, 11, 15] and target 9. Left is at 2, right is at 15. The sum is 17. 17 is greater than 9. Which pointer MUST move?",
            options: [
              { key: "A", text: "left++ to choose a larger number" },
              { key: "B", text: "right-- to choose a smaller number because the array is sorted", isCorrect: true },
              { key: "C", text: "Both pointers move simultaneously" }
            ],
            gapId: "pointer_direction",
            gapConcept: "Pointer Boundary Adjustment"
          },
          q2: {
            title: "In-Video Checkpoint 2 (Time 1:20)",
            question: "Why can we completely eliminate 15 from consideration once 2 + 15 exceeds 9?",
            options: [
              { key: "A", text: "Because 2 is the smallest number; adding any other number to 15 will also exceed 9", isCorrect: true },
              { key: "B", text: "Because 15 is an odd number" },
              { key: "C", text: "Because the computer forgot 15" }
            ],
            gapId: "elimination_property",
            gapConcept: "Sorted Elimination Invariant"
          }
        }
      },
      {
        id: "binary_search",
        title: "Lesson 3: Binary Search Precision",
        subtitle: "Logarithmic divide & conquer without off-by-one errors",
        category: "Search & Algorithms",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 80,
        timeline: [
          { time: 0, title: "The Power of O(log N)", slideText: "Find any item in 1 billion elements in just 30 comparisons!" },
          { time: 30, title: "The Midpoint Split", slideText: "mid = Math.floor((low + high) / 2). Test the center element." },
          { time: 50, title: "Checkpoint 1: Boundary Update", isCheckpoint: true, checkpointId: "q1" },
          { time: 70, title: "Avoid Infinite Loop", slideText: "Always advance boundaries: low = mid + 1, high = mid - 1." }
        ],
        narration: [
          "Binary search is like opening a dictionary in the exact center. You instantly toss away half the pages!",
          "Let's test how you adjust the boundaries when the target is larger than your middle element."
        ],
        questions: {
          q1: {
            title: "In-Video Checkpoint 1 (Time 0:50)",
            question: "When target > arr[mid], what should your new lower bound be?",
            options: [
              { key: "A", text: "low = mid (Keep mid included in the search space)" },
              { key: "B", text: "low = mid + 1 (Exclude mid since we already tested it)", isCorrect: true },
              { key: "C", text: "high = mid - 1" }
            ],
            gapId: "boundary_shift",
            gapConcept: "Midpoint Pruning & Boundary Precision"
          }
        }
      }
    ];
  }

  init() {
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const lesson = this.lessons[this.currentLessonIndex];

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Video Tutor Banner Header -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-orange-950/70 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold border border-orange-500/30">
                🎥 AI Video Tutor & Diagnostic Studio
              </span>
              <span class="text-xs text-slate-400">• Theme 06: Human-AI Interactive Teaching</span>
            </div>
            <h2 class="text-lg md:text-xl font-bold text-white">${lesson.title}</h2>
            <p class="text-xs text-slate-300">${lesson.subtitle}</p>
          </div>

          <!-- Lesson Selector Dropdown -->
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-400">Lesson:</label>
            <select id="video-lesson-select" class="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-500">
              ${this.lessons.map((l, i) => `
                <option value="${i}" ${i === this.currentLessonIndex ? 'selected' : ''}>${l.title}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- MAIN VIDEO PLAYER & AVATAR STUDIO -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- LEFT: Interactive Video Screen -->
          <div class="lg:col-span-8 flex flex-col gap-3">
            <div class="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col min-h-[380px]">
              
              <!-- Video Screen Canvas / Content Display -->
              <div id="video-screen-content" class="flex-1 p-6 flex flex-col justify-between relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
                
                <!-- Tutor Overlay Info -->
                <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div class="flex items-center gap-2.5">
                    <div id="avatar-speaker-badge" class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-lg shadow-lg border border-indigo-400/50">
                      ${lesson.videoAvatar.includes('Ada') ? '👩‍🏫' : '👨‍🏫'}
                    </div>
                    <div>
                      <span class="text-xs font-bold text-white block">${lesson.videoAvatar}</span>
                      <span id="video-speech-status" class="text-[10px] text-emerald-400 font-mono">Ready to teach</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <button id="btn-toggle-voice" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-slate-700 flex items-center gap-1.5 transition">
                      <span id="voice-icon">🔊</span> Voice Narration: <strong id="voice-status-text" class="text-emerald-400">ON</strong>
                    </button>
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono" id="video-timestamp">
                      00:00 / 01:30
                    </span>
                  </div>
                </div>

                <!-- Animated Presentation Slide / Visual Teaching Board -->
                <div id="video-teaching-board" class="my-auto py-6 text-center max-w-xl mx-auto space-y-4">
                  <div class="inline-block p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 shadow-inner">
                    <div id="video-slide-badge" class="text-xs font-bold font-mono text-orange-400 uppercase tracking-widest mb-1">
                      Chapter 1: Foundations
                    </div>
                    <h3 id="video-slide-title" class="text-xl md:text-2xl font-black text-white mb-2">
                      Understanding Function Stack Frames
                    </h3>
                    <p id="video-slide-text" class="text-xs md:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                      Click "Play Lesson" to start the interactive AI tutor session. The video tutor will pause at checkpoints to test your understanding!
                    </p>
                  </div>

                  <!-- Audio Waveform Animation -->
                  <div id="audio-waveform-box" class="hidden flex items-center justify-center gap-1.5 h-6">
                    <span class="w-1 bg-cyan-400 rounded-full animate-pulse h-3"></span>
                    <span class="w-1 bg-cyan-400 rounded-full animate-pulse h-6"></span>
                    <span class="w-1 bg-indigo-400 rounded-full animate-pulse h-4"></span>
                    <span class="w-1 bg-indigo-400 rounded-full animate-pulse h-5"></span>
                    <span class="w-1 bg-orange-400 rounded-full animate-pulse h-3"></span>
                  </div>
                </div>

                <!-- Interactive In-Video Question Overlay (Hidden until checkpoint) -->
                <div id="in-video-checkpoint-modal" class="hidden absolute inset-0 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col justify-between z-30 animate-fadeIn">
                  <!-- Populated dynamically when paused at checkpoint -->
                </div>

              </div>

              <!-- Video Timeline & Controls Bar -->
              <div class="bg-slate-900 px-4 py-3 border-t border-slate-800 flex flex-col gap-2">
                
                <!-- Progress Bar with Checkpoint Pins 📍 -->
                <div class="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden cursor-pointer" id="video-timeline-track">
                  <div id="video-progress-fill" class="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full w-0 transition-all duration-200"></div>
                  <!-- Checkpoint Pins placed dynamically -->
                  <div class="absolute top-0 bottom-0 left-[44%] w-1 bg-red-500 z-10" title="Checkpoint 1: Question"></div>
                  <div class="absolute top-0 bottom-0 left-[83%] w-1 bg-red-500 z-10" title="Checkpoint 2: Question"></div>
                </div>

                <!-- Play / Pause & Checkpoint Triggers -->
                <div class="flex items-center justify-between text-xs pt-1">
                  <div class="flex items-center gap-2">
                    <button id="btn-play-pause-video" class="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg shadow flex items-center gap-1.5 transition">
                      <span id="play-pause-icon">▶</span> <span id="play-pause-text">Play Lesson</span>
                    </button>
                    <button id="btn-restart-video" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition">
                      🔄 Restart
                    </button>
                  </div>

                  <div class="flex items-center gap-2 text-[11px] text-slate-400">
                    <button id="btn-trigger-cp1" class="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 rounded flex items-center gap-1">
                      <span>📍</span> Test Checkpoint 1
                    </button>
                    <button id="btn-trigger-cp2" class="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 rounded flex items-center gap-1">
                      <span>📍</span> Test Checkpoint 2
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <!-- RIGHT: Student Understanding Diagnostic & Adaptive Re-teaching Panel -->
          <div class="lg:col-span-4 flex flex-col gap-4">
            
            <!-- Understanding Score & Gap Card -->
            <div class="bg-[#111827] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between min-h-[380px]">
              <div>
                <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Cognitive Understanding Diagnostic</h3>
                  <span id="understanding-tier-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                    Awaiting Answers
                  </span>
                </div>

                <!-- Score Gauge -->
                <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 mb-3 text-center">
                  <span class="text-[11px] text-slate-500 block mb-1">Student Comprehension Index</span>
                  <div class="text-3xl font-black font-mono text-cyan-300" id="understanding-score-display">-- %</div>
                  <div class="w-full bg-slate-900 rounded-full h-2 mt-2 overflow-hidden">
                    <div id="understanding-score-bar" class="h-full bg-slate-700 rounded-full w-0 transition-all duration-500"></div>
                  </div>
                  <p id="understanding-summary-text" class="text-xs text-slate-400 mt-2 italic">
                    Answer the in-video questions during the lecture to diagnose your mental model.
                  </p>
                </div>

                <!-- Identified Knowledge Gaps / Misconceptions -->
                <div class="space-y-2">
                  <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Diagnosed Knowledge Gaps:</span>
                  <div id="identified-gaps-list" class="space-y-2">
                    <div class="p-2.5 bg-slate-900/60 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 text-center">
                      No misconceptions recorded yet. Play the lesson and answer checkpoints.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Targeted Re-Teaching Action Button -->
              <div class="pt-3 border-t border-slate-800 mt-3">
                <button id="btn-start-reteach" class="w-full py-2.5 px-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 opacity-50 cursor-not-allowed" disabled>
                  <span>🎯</span> Re-Teach My Confused Topics
                </button>
              </div>

            </div>

          </div>

        </div>

        <!-- TARGETED ADAPTIVE RE-TEACHING STUDIO (Appears when Re-Teach is clicked) -->
        <div id="adaptive-reteach-studio" class="hidden p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border-2 border-orange-500/40 shadow-2xl space-y-6">
          <!-- Dynamically populated -->
        </div>

      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Lesson selection change
    document.getElementById('video-lesson-select')?.addEventListener('change', (e) => {
      this.switchLesson(parseInt(e.target.value, 10));
    });

    // Play/Pause button
    document.getElementById('btn-play-pause-video')?.addEventListener('click', () => {
      this.togglePlay();
    });

    // Restart button
    document.getElementById('btn-restart-video')?.addEventListener('click', () => {
      this.restart();
    });

    // Voice toggle
    document.getElementById('btn-toggle-voice')?.addEventListener('click', () => {
      this.toggleVoice();
    });

    // Checkpoint jump triggers
    document.getElementById('btn-trigger-cp1')?.addEventListener('click', () => {
      this.triggerCheckpoint('q1');
    });

    document.getElementById('btn-trigger-cp2')?.addEventListener('click', () => {
      this.triggerCheckpoint('q2');
    });

    // Start Re-teaching button
    document.getElementById('btn-start-reteach')?.addEventListener('click', () => {
      this.startTargetedReteaching();
    });
  }

  switchLesson(index) {
    this.stopSpeaking();
    this.currentLessonIndex = index;
    this.currentTimeSec = 0;
    this.isPlaying = false;
    this.answers = {};
    this.diagnosticReport = null;
    this.activeReteach = null;
    if (this.animationTimer) clearInterval(this.animationTimer);
    this.render();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    const playBtnText = document.getElementById('play-pause-text');
    const playBtnIcon = document.getElementById('play-pause-icon');
    const statusText = document.getElementById('video-speech-status');
    const waveform = document.getElementById('audio-waveform-box');

    if (playBtnText) playBtnText.textContent = 'Pause';
    if (playBtnIcon) playBtnIcon.textContent = '⏸';
    if (statusText) statusText.textContent = 'Teaching lecture...';
    if (waveform) waveform.classList.remove('hidden');

    const lesson = this.lessons[this.currentLessonIndex];
    
    // Narrate chapter aloud if voice enabled
    if (this.voiceEnabled && this.currentTimeSec === 0) {
      this.speakText(lesson.narration[0]);
    }

    // Timer loop for video progress
    if (this.animationTimer) clearInterval(this.animationTimer);
    this.animationTimer = setInterval(() => {
      this.currentTimeSec += 1;
      this.updateVideoProgress();

      // Check for checkpoints
      if (this.currentTimeSec === 40 && !this.answers['q1']) {
        this.pause();
        this.triggerCheckpoint('q1');
      } else if (this.currentTimeSec === 75 && !this.answers['q2']) {
        this.pause();
        this.triggerCheckpoint('q2');
      }

      if (this.currentTimeSec >= lesson.durationSec) {
        this.pause();
        this.currentTimeSec = lesson.durationSec;
      }
    }, 1000);
  }

  pause() {
    this.isPlaying = false;
    if (this.animationTimer) clearInterval(this.animationTimer);
    this.stopSpeaking();

    const playBtnText = document.getElementById('play-pause-text');
    const playBtnIcon = document.getElementById('play-pause-icon');
    const statusText = document.getElementById('video-speech-status');
    const waveform = document.getElementById('audio-waveform-box');

    if (playBtnText) playBtnText.textContent = 'Play Lesson';
    if (playBtnIcon) playBtnIcon.textContent = '▶';
    if (statusText) statusText.textContent = 'Paused';
    if (waveform) waveform.classList.add('hidden');
  }

  restart() {
    this.pause();
    this.currentTimeSec = 0;
    this.updateVideoProgress();
  }

  updateVideoProgress() {
    const lesson = this.lessons[this.currentLessonIndex];
    const fill = document.getElementById('video-progress-fill');
    const ts = document.getElementById('video-timestamp');

    const percent = Math.min(100, Math.round((this.currentTimeSec / lesson.durationSec) * 100));
    if (fill) fill.style.width = percent + '%';

    const formatTime = (s) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (ts) ts.textContent = `${formatTime(this.currentTimeSec)} / ${formatTime(lesson.durationSec)}`;

    // Update slides according to timeline
    for (let i = lesson.timeline.length - 1; i >= 0; i--) {
      const step = lesson.timeline[i];
      if (this.currentTimeSec >= step.time) {
        const slideBadge = document.getElementById('video-slide-badge');
        const slideTitle = document.getElementById('video-slide-title');
        const slideText = document.getElementById('video-slide-text');

        if (slideBadge) slideBadge.textContent = `Chapter ${i + 1}`;
        if (slideTitle) slideTitle.textContent = step.title;
        if (slideText && step.slideText) slideText.textContent = step.slideText;
        break;
      }
    }
  }

  // TRIGGER CHECKPOINT QUESTION OVERLAY (Slide & Question Feature)
  triggerCheckpoint(qId) {
    this.pause();
    const lesson = this.lessons[this.currentLessonIndex];
    const questionData = lesson.questions[qId];
    if (!questionData) return;

    const modal = document.getElementById('in-video-checkpoint-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // Announce checkpoint
    if (this.voiceEnabled) {
      this.speakText("Checkpoint question! Please select the correct option to test your understanding.");
    }

    modal.innerHTML = `
      <div class="max-w-xl mx-auto w-full my-auto space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
              📍 In-Video Checkpoint Question
            </span>
            <span class="text-xs text-slate-400 font-mono">${questionData.title}</span>
          </div>
          <span class="text-xs text-orange-400 font-bold">Concept Check</span>
        </div>

        <h3 class="text-sm md:text-base font-bold text-white leading-snug">
          ${questionData.question}
        </h3>

        <div class="space-y-2 pt-2">
          ${questionData.options.map(opt => `
            <button class="checkpoint-opt-btn w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500 text-xs text-slate-200 transition flex items-center justify-between group" data-key="${opt.key}">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-orange-600 group-hover:text-white font-mono font-bold flex items-center justify-center text-xs text-orange-400 border border-slate-700">
                  ${opt.key}
                </span>
                <span>${opt.text}</span>
              </div>
              <span class="text-slate-500 group-hover:text-white text-xs">➔</span>
            </button>
          `).join('')}
        </div>

        <div id="checkpoint-feedback" class="hidden p-3 rounded-lg text-xs"></div>

        <div class="flex items-center justify-between pt-2">
          <button id="btn-skip-checkpoint" class="text-xs text-slate-500 hover:text-slate-300">
            Skip Question ⏭
          </button>
          <button id="btn-resume-video" class="hidden px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition">
            Continue Video Lecture ▶
          </button>
        </div>
      </div>
    `;

    // Handle answer click
    modal.querySelectorAll('.checkpoint-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedKey = btn.getAttribute('data-key');
        this.submitAnswer(qId, selectedKey, questionData);
      });
    });

    document.getElementById('btn-skip-checkpoint')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.play();
    });

    document.getElementById('btn-resume-video')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.play();
    });
  }

  submitAnswer(qId, selectedKey, questionData) {
    this.answers[qId] = selectedKey;
    const isCorrect = questionData.options.find(o => o.key === selectedKey)?.isCorrect || false;

    const feedbackEl = document.getElementById('checkpoint-feedback');
    const resumeBtn = document.getElementById('btn-resume-video');

    if (feedbackEl) {
      feedbackEl.classList.remove('hidden');
      if (isCorrect) {
        feedbackEl.className = 'p-3 rounded-lg text-xs bg-emerald-950/80 border border-emerald-600 text-emerald-200 animate-fadeIn';
        feedbackEl.innerHTML = `🎉 <strong>Correct!</strong> Great job! You properly understand the ${questionData.gapConcept}.`;
        if (this.voiceEnabled) this.speakText("Correct answer! Excellent comprehension.");
      } else {
        feedbackEl.className = 'p-3 rounded-lg text-xs bg-red-950/80 border border-red-600 text-red-200 animate-fadeIn';
        feedbackEl.innerHTML = `⚠️ <strong>Not quite!</strong> Misconception detected regarding <em>${questionData.gapConcept}</em>. Don't worry, the AI tutor will re-teach this exact topic after the lecture!`;
        if (this.voiceEnabled) this.speakText("That was not quite right, but don't worry, I will re-teach you this specific concept in a moment.");
      }
    }

    if (resumeBtn) resumeBtn.classList.remove('hidden');

    // Run understanding evaluation
    this.analyzeStudentUnderstanding();
  }

  // ANALYZE UNDERSTANDING LEVEL OF STUDENT
  async analyzeStudentUnderstanding() {
    const lesson = this.lessons[this.currentLessonIndex];
    
    try {
      const res = await fetch('/api/analyze-understanding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          answers: this.answers
        })
      });

      if (!res.ok) throw new Error('API Offline');
      const data = await res.json();
      this.updateDiagnosticHUD(data);
    } catch (err) {
      // Local fallback calculation
      const total = Object.keys(lesson.questions).length;
      let correct = 0;
      let gaps = [];

      Object.keys(this.answers).forEach(qKey => {
        const q = lesson.questions[qKey];
        const chosen = this.answers[qKey];
        const correctOpt = q.options.find(o => o.isCorrect)?.key;
        if (chosen === correctOpt) {
          correct++;
        } else {
          gaps.push({
            id: q.gapId,
            concept: q.gapConcept,
            misconception: `Struggling with ${q.gapConcept}`
          });
        }
      });

      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      this.updateDiagnosticHUD({
        scorePercent: score,
        masteryTier: score === 100 ? 'MASTERY' : score >= 50 ? 'DEVELOPING' : 'STRUGGLING',
        identifiedGaps: gaps,
        needsReteaching: gaps.length > 0
      });
    }
  }

  updateDiagnosticHUD(report) {
    this.diagnosticReport = report;
    const scoreDisplay = document.getElementById('understanding-score-display');
    const scoreBar = document.getElementById('understanding-score-bar');
    const tierBadge = document.getElementById('understanding-tier-badge');
    const summaryText = document.getElementById('understanding-summary-text');
    const gapsList = document.getElementById('identified-gaps-list');
    const btnReteach = document.getElementById('btn-start-reteach');

    const score = report.scorePercent || 0;
    if (scoreDisplay) scoreDisplay.textContent = score + '%';
    if (scoreBar) {
      scoreBar.style.width = score + '%';
      scoreBar.className = score >= 80 ? 'h-full bg-emerald-500 rounded-full' : score >= 50 ? 'h-full bg-amber-500 rounded-full' : 'h-full bg-red-500 rounded-full';
    }

    if (tierBadge) {
      if (report.masteryTier === 'MASTERY') {
        tierBadge.textContent = '🌟 MASTERY';
        tierBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700';
      } else if (report.masteryTier === 'DEVELOPING') {
        tierBadge.textContent = '🟡 DEVELOPING';
        tierBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-700';
      } else {
        tierBadge.textContent = '🔴 STRUGGLING';
        tierBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-700 animate-pulse';
      }
    }

    if (summaryText) {
      summaryText.textContent = report.needsReteaching 
        ? `Knowledge gaps detected in ${report.identifiedGaps.length} concept(s). Click 'Re-Teach' below for targeted remediation!`
        : `Fantastic! You demonstrated high mastery on all checkpoint questions!`;
    }

    if (gapsList) {
      if (report.identifiedGaps && report.identifiedGaps.length > 0) {
        gapsList.innerHTML = report.identifiedGaps.map(g => `
          <div class="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-200">
            <div class="font-bold flex items-center gap-1.5 text-red-400">
              <span>⚠️</span> ${g.concept}
            </div>
            <p class="text-[11px] text-slate-300 mt-0.5">${g.misconception}</p>
          </div>
        `).join('');
      } else {
        gapsList.innerHTML = `
          <div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 text-center">
            🎉 Zero blindspots detected! Full concept alignment.
          </div>
        `;
      }
    }

    if (btnReteach) {
      if (report.needsReteaching) {
        btnReteach.disabled = false;
        btnReteach.classList.remove('opacity-50', 'cursor-not-allowed');
        btnReteach.classList.add('animate-bounce');
      } else {
        btnReteach.disabled = true;
        btnReteach.classList.add('opacity-50', 'cursor-not-allowed');
        btnReteach.classList.remove('animate-bounce');
      }
    }
  }

  // TARGETED ADAPTIVE RE-TEACHING (Teach what the student did not understand)
  async startTargetedReteaching() {
    const studio = document.getElementById('adaptive-reteach-studio');
    if (!studio) return;

    studio.classList.remove('hidden');
    studio.scrollIntoView({ behavior: 'smooth' });

    const lesson = this.lessons[this.currentLessonIndex];
    const primaryGap = (this.diagnosticReport?.identifiedGaps && this.diagnosticReport.identifiedGaps[0]) || { id: 'base_case_overflow' };

    studio.innerHTML = `
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎯</span>
          <div>
            <h3 class="text-base font-bold text-white">Targeted Adaptive Re-Teaching</h3>
            <p class="text-xs text-orange-400 font-mono">Synthesizing personalized explanation for: ${primaryGap.concept || 'Knowledge Gap'}</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded bg-orange-950 text-orange-300 text-xs border border-orange-800">Remediation Mode</span>
      </div>
      <div class="p-4 bg-slate-900/80 rounded-xl text-center text-xs text-slate-400">
        🤖 AI Tutor is assembling custom visual analogy and micro-lesson...
      </div>
    `;

    try {
      const res = await fetch('/api/adaptive-reteach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          gapId: primaryGap.id
        })
      });

      const data = await res.json();
      this.renderReteachModule(data.reteachModule, studio);
    } catch (e) {
      // Offline fallback
      this.renderReteachModule({
        title: "Targeted Re-Teaching: Why the Base Case is Mandatory",
        targetConcept: "Base Case & Stack Frames",
        misconceptionAddressed: "Functions calling themselves without stopping create infinite stack frames.",
        audioScript: "Let's clear this up! Imagine you ask a friend 'What is factorial 4?'. They ask someone else for 3, who asks for 2, who asks for 1. If no one tells person 1 to STOP, they keep asking into negative numbers forever! That is why 'if (n <= 1) return 1' is the mandatory stopping brake!",
        remedialSteps: [
          { step: 1, title: "1. Infinite Descent", desc: "factorial(4) -> 3 -> 2 -> 1 -> 0 -> -1... Memory Exhausted!" },
          { step: 2, title: "2. The Base Case Guard", desc: "Placing 'if (n <= 1) return 1;' at the top immediately halts the descent and returns 1." },
          { step: 3, title: "3. The Unwinding", desc: "Now answers multiply back upwards: 1 * 2 * 3 * 4 = 24!" }
        ],
        microCheck: {
          question: "What line of code prevents factorial(n) from crashing?",
          options: ["while(n > 0)", "if (n <= 1) return 1;", "for(let i=0; i<n; i++)"],
          correctIndex: 1,
          explanation: "The guard clause halts calls before reaching zero or negatives!"
        }
      }, studio);
    }
  }

  renderReteachModule(mod, studio) {
    if (this.voiceEnabled && mod.audioScript) {
      this.speakText(mod.audioScript);
    }

    studio.innerHTML = `
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎯</span>
          <div>
            <h3 class="text-base font-bold text-white">${mod.title}</h3>
            <p class="text-xs text-orange-400 font-mono">Addressing Misconception: ${mod.misconceptionAddressed}</p>
          </div>
        </div>
        <button id="btn-close-reteach" class="text-slate-400 hover:text-white text-sm">✕ Close</button>
      </div>

      <!-- Spoken Audio Script Box -->
      <div class="p-4 rounded-xl bg-orange-950/30 border border-orange-500/40 text-xs text-slate-200 leading-relaxed flex items-start gap-3">
        <span class="text-xl">🗣️</span>
        <div>
          <strong class="text-orange-400 block mb-1">AI Tutor Voice Narration:</strong>
          <p>${mod.audioScript}</p>
        </div>
      </div>

      <!-- Visual 3-Step Remedial Progression -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${mod.remedialSteps.map(st => `
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-cyan-400 block mb-1">${st.title}</span>
              <p class="text-xs text-slate-300 leading-relaxed">${st.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Micro-Check Verification Question -->
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">Micro-Check: Confirm Your New Understanding</span>
          <span class="text-[10px] text-slate-400">1-question check</span>
        </div>
        <p class="text-xs text-white font-medium">${mod.microCheck.question}</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          ${mod.microCheck.options.map((opt, i) => `
            <button class="micro-check-btn p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition text-left" data-index="${i}">
              ${opt}
            </button>
          `).join('')}
        </div>

        <div id="micro-check-feedback" class="hidden p-3 rounded-lg text-xs"></div>
      </div>

      <!-- Bridge to Code IDE -->
      <div class="flex items-center justify-between pt-2">
        <span class="text-xs text-slate-400">Ready to put this into practice?</span>
        <button id="btn-jump-to-code" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2">
          <span>🚀</span> Apply & Solve in Coding IDE
        </button>
      </div>
    `;

    document.getElementById('btn-close-reteach')?.addEventListener('click', () => {
      studio.classList.add('hidden');
    });

    document.querySelectorAll('.micro-check-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const fb = document.getElementById('micro-check-feedback');
        if (!fb) return;

        fb.classList.remove('hidden');
        if (idx === mod.microCheck.correctIndex) {
          fb.className = 'p-3 rounded-lg text-xs bg-emerald-950/80 border border-emerald-600 text-emerald-200';
          fb.innerHTML = `🎉 <strong>Bravo!</strong> You completely mastered this! ${mod.microCheck.explanation}`;
          if (this.voiceEnabled) this.speakText("Bravo! You have completely mastered this concept!");
        } else {
          fb.className = 'p-3 rounded-lg text-xs bg-red-950/80 border border-red-600 text-red-200';
          fb.innerHTML = `Notice: Remember that the guard clause halts execution immediately!`;
        }
      });
    });

    document.getElementById('btn-jump-to-code')?.addEventListener('click', () => {
      // Trigger navigation to IDE tab
      document.querySelector('[data-tab="workspace"]')?.click();
    });
  }

  // SPEECH SYNTHESIS ENGINE
  speakText(text) {
    if (!('speechSynthesis' in window) || !this.voiceEnabled) return;
    window.speechSynthesis.cancel();

    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.rate = 1.0;
    this.speechUtterance.pitch = 1.05;

    this.speechUtterance.onstart = () => {
      const badge = document.getElementById('avatar-speaker-badge');
      if (badge) badge.classList.add('ring-4', 'ring-cyan-400', 'animate-pulse');
    };

    this.speechUtterance.onend = () => {
      const badge = document.getElementById('avatar-speaker-badge');
      if (badge) badge.classList.remove('ring-4', 'ring-cyan-400', 'animate-pulse');
    };

    window.speechSynthesis.speak(this.speechUtterance);
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    const icon = document.getElementById('voice-icon');
    const txt = document.getElementById('voice-status-text');

    if (this.voiceEnabled) {
      if (icon) icon.textContent = '🔊';
      if (txt) { txt.textContent = 'ON'; txt.className = 'text-emerald-400'; }
    } else {
      this.stopSpeaking();
      if (icon) icon.textContent = '🔇';
      if (txt) { txt.textContent = 'OFF'; txt.className = 'text-slate-500'; }
    }
  }
}

window.VideoTutorEngine = VideoTutorEngine;
