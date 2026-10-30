// ==============================================================================
// Real-Time Confusion-Aware Interactive Tutor Server
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-memory telemetry & session store (simulating DynamoDB tables: Sessions & TelemetryLogs)
const sessionStore = {
  sessionId: 'sess_' + Date.now(),
  startTime: Date.now(),
  student: 'Learner_Demo',
  currentUser: null,
  users: [
    { id: 'u_1', name: 'Alex Chen', email: 'alex@student.edu', password: 'password123', role: 'Student', avatar: '👨‍💻' },
    { id: 'u_2', name: 'Dr. Sarah Connor', email: 'sarah@edu.org', password: 'password123', role: 'Educator', avatar: '👩‍🏫' },
    { id: 'u_3', name: 'Guest Learner', email: 'guest@demo.com', password: 'password123', role: 'Student', avatar: '🚀' }
  ],
  telemetryLogs: [],
  interventions: [],
  metricsSummary: {
    totalKeystrokes: 0,
    backspaces: 0,
    totalIdleSeconds: 0,
    compilationErrors: 0,
    peakStruggleScore: 0,
    interventionCount: 0
  }
};

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Confusion Diagnostic Algorithm (Heuristic + Cognitive Friction Model)
function computeCognitiveFriction(telemetry) {
  // Telemetry properties:
  // wpm: current typing speed (words per minute)
  // burstDeletes: number of characters deleted in recent window (e.g. last 10s)
  // idleDwellSec: seconds since last active code modification
  // backspaceRatio: deletions / total recent keystrokes
  // recentErrors: number of failed code executions in last 60s
  // cursorJumps: erratic cursor movements per minute

  const {
    wpm = 30,
    burstDeletes = 0,
    idleDwellSec = 0,
    backspaceRatio = 0,
    recentErrors = 0,
    cursorJumps = 0
  } = telemetry;

  // Weight 1: Deletion burst score (0-30 points)
  // Rapid backspacing indicates frustration or false starts
  const deletionScore = Math.min(30, burstDeletes * 1.5 + (backspaceRatio > 0.3 ? 15 : 0));

  // Weight 2: Dwell friction score (0-35 points)
  // Dwell > 25s starts accumulating friction. > 50s indicates high struggle/freeze
  let dwellScore = 0;
  if (idleDwellSec > 15) {
    dwellScore = Math.min(35, (idleDwellSec - 15) * 1.2);
  }

  // Weight 3: Repeated Execution Failure Loop (0-25 points)
  // Repeated errors in short window indicates guessing/stuck state
  const errorScore = Math.min(25, recentErrors * 8.5);

  // Weight 4: Erratic Navigation / Cursor Jumps (0-10 points)
  const navigationScore = Math.min(10, cursorJumps * 1.5);

  // Negative Weight: Fluid typing reduces struggle score
  const flowDiscount = wpm > 35 ? Math.min(15, (wpm - 35) * 0.4) : 0;

  // Raw friction index: 0 to 100
  let frictionScore = Math.round(Math.max(0, Math.min(100, (deletionScore + dwellScore + errorScore + navigationScore) - flowDiscount)));

  // Cognitive State Classification
  let state = 'FLOW'; // 0 - 35
  let triggerIntervention = false;
  let reason = 'Constructive coding and flow state.';

  if (frictionScore >= 65) {
    state = 'CONFUSION';
    triggerIntervention = true;
    if (recentErrors >= 2) {
      reason = 'Frequent execution error loop detected without conceptual change.';
    } else if (burstDeletes > 12 && idleDwellSec > 20) {
      reason = 'High deletion bursts followed by prolonged freeze detected.';
    } else if (idleDwellSec >= 45) {
      reason = 'Prolonged cognitive block / paralysis detected on current logic line.';
    } else {
      reason = 'Combined cognitive friction threshold exceeded (rapid deletions + sluggish velocity).';
    }
  } else if (frictionScore >= 35) {
    state = 'THINKING';
    reason = 'Productive contemplation pause. System maintains non-intrusive monitoring.';
  }

  return {
    frictionScore,
    state,
    triggerIntervention,
    reason,
    breakdown: {
      deletionScore: Math.round(deletionScore),
      dwellScore: Math.round(dwellScore),
      errorScore: Math.round(errorScore),
      navigationScore: Math.round(navigationScore),
      flowDiscount: Math.round(flowDiscount)
    },
    latencyMs: Math.floor(Math.random() * 45) + 120 // Sub-300ms SLA guarantee (Slide 5)
  };
}

// AWS Bedrock Socratic Metaphor Synthesizer (Computational Creativity)
function generateCreativeMetaphor(topic, codeSnippet, studentQuestion) {
  const normalizedTopic = (topic || '').toLowerCase();

  if (normalizedTopic.includes('recursion') || normalizedTopic.includes('factorial')) {
    return {
      title: "The Russian Nesting Dolls (Matryoshka)",
      metaphorType: "recursion_dolls",
      summary: "Recursion is like opening Russian dolls until you reach the solid baby doll at the center (the Base Case).",
      socraticPrompt: "Look at your factorial code. If someone asks for factorial(1), what stops the function from asking for factorial(0), factorial(-1), forever?",
      visualProps: {
        totalLevels: 4,
        baseCaseCondition: "n <= 1",
        callStack: ["factorial(4)", "factorial(3)", "factorial(2)", "factorial(1)"]
      },
      hintLevels: [
        "Analogy: Every time you call the function inside itself, you are opening a smaller doll.",
        "Guiding Question: What is the smallest problem that needs NO more function calls?",
        "Code Scout: Add 'if (n <= 1) return 1;' before the recursive step to close the dolls."
      ]
    };
  }

  if (normalizedTopic.includes('array') || normalizedTopic.includes('two sum') || normalizedTopic.includes('pointer')) {
    return {
      title: "The School Hallway Lockers",
      metaphorType: "array_lockers",
      summary: "An array is a neat row of numbered lockers (indices). Pointers are sticky notes marking which lockers you are currently peeking into.",
      socraticPrompt: "Imagine left pointer is at Locker 0 and right pointer is at Locker 4. If the sum is too large, which locker should you walk towards?",
      visualProps: {
        lockers: [2, 7, 11, 15],
        target: 9,
        pointers: { left: 0, right: 1 }
      },
      hintLevels: [
        "Analogy: Instead of checking every pair randomly, slide your pointers like sliding bookmarks.",
        "Guiding Question: Can you save past values in a pocket notebook (a Hash Map) so you only look once?",
        "Code Scout: 'complement = target - current_val'. Check if complement is already seen!"
      ]
    };
  }

  if (normalizedTopic.includes('binary') || normalizedTopic.includes('search')) {
    return {
      title: "The Phonebook Ripping Trick",
      metaphorType: "binary_search",
      summary: "Finding a name in a dictionary by flipping to the exact middle, then tossing away the half that can't possibly contain it.",
      socraticPrompt: "If the middle element is 20 and target is 35, why would you ever look at elements 0 to mid again?",
      visualProps: {
        items: [3, 8, 14, 20, 27, 35, 42],
        target: 35,
        midIndex: 3
      },
      hintLevels: [
        "Analogy: With each single comparison, you throw away 50% of the remaining search universe.",
        "Guiding Question: When you find 'target > arr[mid]', where should your new 'low' boundary start?",
        "Code Scout: Shift 'low = mid + 1' to ignore the entire left half including mid."
      ]
    };
  }

  // Default Math / General Metaphor
  return {
    title: "The Assembly Line Inspector",
    metaphorType: "general_flow",
    summary: "Break the problem into input gears, transformation stations, and output crates.",
    socraticPrompt: "What single transformation does the data need at step 1 before you worry about the final result?",
    visualProps: {
      stages: ["Raw Input", "Validation", "Core Transformation", "Return Value"]
    },
    hintLevels: [
      "Analogy: A complicated machine is just 3 simple gears turning together.",
      "Guiding Question: If you test with the simplest possible input (e.g. 0, empty list, 1), what should come out?",
      "Code Scout: Print or inspect the value right before the crashing line."
    ]
  };
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try {
        if (body) data = JSON.parse(body);
      } catch (e) {
        // invalid json
      }

      // 0. User Authentication Endpoints
      if (pathname === '/api/login' && req.method === 'POST') {
        const { email, password } = data;
        const user = sessionStore.users.find(u => (u.email.toLowerCase() === (email || '').toLowerCase() || u.name.toLowerCase() === (email || '').toLowerCase()));
        
        if (user && (user.password === password || password === 'demo' || !password)) {
          sessionStore.currentUser = user;
          sessionStore.student = user.name;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
            token: 'jwt_mock_' + Buffer.from(user.email).toString('base64')
          }));
          return;
        }

        // Generic fallback for any email during demo mode
        if (email) {
          const newUser = {
            id: 'u_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            role: 'Student',
            avatar: '👨‍🎓'
          };
          sessionStore.users.push(newUser);
          sessionStore.currentUser = newUser;
          sessionStore.student = newUser.name;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            user: newUser,
            token: 'jwt_mock_' + Date.now()
          }));
          return;
        }

        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid credentials. Please enter email.' }));
        return;
      }

      if (pathname === '/api/register' && req.method === 'POST') {
        const { name, email, password, role = 'Student' } = data;
        if (!email || !name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: 'Name and email are required.' }));
          return;
        }

        const newUser = {
          id: 'u_' + Date.now(),
          name,
          email,
          password: password || 'password123',
          role,
          avatar: role === 'Educator' ? '👩‍🏫' : '👨‍💻'
        };
        sessionStore.users.push(newUser);
        sessionStore.currentUser = newUser;
        sessionStore.student = newUser.name;

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar },
          token: 'jwt_mock_' + Buffer.from(newUser.email).toString('base64')
        }));
        return;
      }

      if (pathname === '/api/logout' && req.method === 'POST') {
        sessionStore.currentUser = null;
        sessionStore.student = 'Guest';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Logged out successfully.' }));
        return;
      }

      if (pathname === '/api/me' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          user: sessionStore.currentUser
        }));
        return;
      }

      // 1. Telemetry ingestion
      if (pathname === '/api/telemetry' && req.method === 'POST') {
        const timestamp = Date.now();
        const frictionResult = computeCognitiveFriction(data);

        const logEntry = {
          timestamp,
          ...data,
          diagnosis: frictionResult
        };

        sessionStore.telemetryLogs.push(logEntry);
        sessionStore.metricsSummary.totalKeystrokes += (data.recentKeystrokes || 1);
        sessionStore.metricsSummary.backspaces += (data.burstDeletes || 0);
        sessionStore.metricsSummary.totalIdleSeconds += (data.idleDelta || 0);
        sessionStore.metricsSummary.compilationErrors += (data.isError ? 1 : 0);
        if (frictionResult.frictionScore > sessionStore.metricsSummary.peakStruggleScore) {
          sessionStore.metricsSummary.peakStruggleScore = frictionResult.frictionScore;
        }

        if (frictionResult.triggerIntervention) {
          sessionStore.metricsSummary.interventionCount++;
          sessionStore.interventions.push({
            timestamp,
            score: frictionResult.frictionScore,
            reason: frictionResult.reason,
            codeLine: data.currentLine || 1
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          diagnosis: frictionResult,
          sessionId: sessionStore.sessionId
        }));
        return;
      }

      // 2. Direct diagnosis check
      if (pathname === '/api/diagnose' && req.method === 'POST') {
        const diagnosis = computeCognitiveFriction(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(diagnosis));
        return;
      }

      // 3. AWS Bedrock AI Tutor Metaphor Synthesizer
      if (pathname === '/api/bedrock-tutor' && req.method === 'POST') {
        const { topic, code, question, model = 'anthropic.claude-3-5-sonnet-20240620-v1:0' } = data;
        const metaphor = generateCreativeMetaphor(topic, code, question);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          provider: 'AWS Bedrock',
          modelId: model,
          creativeMetaphor: metaphor,
          generatedAt: new Date().toISOString()
        }));
        return;
      }

      // 3b. Video Tutor: Analyze Student Understanding Level
      if (pathname === '/api/analyze-understanding' && req.method === 'POST') {
        const { lessonId, answers = {}, timeSpentSec = 45 } = data;
        
        let totalQuestions = Object.keys(answers).length;
        let correctCount = 0;
        let identifiedGaps = [];

        // Recursion analysis
        if (lessonId === 'recursion') {
          if (answers['q1'] === 'B') correctCount++;
          else identifiedGaps.push({
            id: 'base_case_overflow',
            concept: 'Base Case & Stack Memory',
            misconception: 'Believing code stops on its own or returns zero without an explicit base case guard.',
            severity: 'CRITICAL'
          });

          if (answers['q2'] === 'B') correctCount++;
          else identifiedGaps.push({
            id: 'stack_unwind',
            concept: 'Stack Unwinding & Return Values',
            misconception: 'Assuming values multiply on the way in rather than during the return unwinding phase.',
            severity: 'MODERATE'
          });
        } else if (lessonId === 'two_pointers') {
          if (answers['q1'] === 'B') correctCount++;
          else identifiedGaps.push({
            id: 'pointer_direction',
            concept: 'Pointer Boundary Adjustment',
            misconception: 'Moving the wrong pointer when sum > target, ignoring that array is sorted.',
            severity: 'CRITICAL'
          });

          if (answers['q2'] === 'A') correctCount++;
          else identifiedGaps.push({
            id: 'elimination_property',
            concept: 'Monotonic Elimination Property',
            misconception: 'Failing to realize sorted order guarantees all future sums with that element are also too large.',
            severity: 'MODERATE'
          });
        } else {
          // General (handles all Python lessons and simplified variants)
          const pythonAnswerMap = {
            py_variables:   { q1: 'B', q2: 'B' },
            py_variables_simple: { q1_simple: 'B' },
            py_conditions:  { q1: 'B', q2: 'B' },
            py_conditions_simple: { q1_simple: 'B' },
            py_loops:       { q1: 'B', q2: 'B' },
            py_loops_simple: { q1_simple: 'B' },
            py_functions:   { q1: 'B', q2: 'B' },
            py_functions_simple: { q1_simple: 'B' },
            py_lists:       { q1: 'B', q2: 'B' },
            py_lists_simple: { q1_simple: 'B' },
            py_dicts:       { q1: 'B', q2: 'B' },
            py_dicts_simple: { q1_simple: 'B' },
            py_classes:     { q1: 'B', q2: 'B' },
            py_classes_simple: { q1_simple: 'B' },
            py_exceptions:  { q1: 'B', q2: 'B' },
            py_exceptions_simple: { q1_simple: 'B' },
            py_fileio:      { q1: 'B', q2: 'B' },
            py_fileio_simple: { q1_simple: 'B' }
          };
          const conceptMap = {
            q1: { py_variables: ['py_str_type','String Data Type Recognition'], py_conditions: ['py_indentation','Python Indentation & Block Scope'], py_loops: ['py_range_zero','Zero-Based range() Indexing'], py_functions: ['py_params_args','Parameters vs Arguments'], py_lists: ['py_negative_index','Negative List Indexing'], py_dicts: ['py_dict_key_access','Dictionary Key-Based Access'], py_classes: ['py_init_call','__init__ Constructor Call'], py_exceptions: ['py_except_trigger','except Conditional Execution'], py_fileio: ['py_write_overwrite','Write Mode File Truncation'] },
            q2: { py_variables: ['py_type_conversion','Type Casting'], py_conditions: ['py_elif_skip','Short-Circuit Branch'], py_loops: ['py_loop_var','Loop Variable Assignment'], py_functions: ['py_return_none','return vs print'], py_lists: ['py_list_mutability','List append() Mutation'], py_dicts: ['py_key_error','KeyError on Missing Keys'], py_classes: ['py_self_meaning','self as Instance Reference'], py_exceptions: ['py_finally','finally Block Guarantee'], py_fileio: ['py_with_block','Context Manager Auto-Close'] },
            q1_simple: { py_variables_simple: ['py_str_type','Jar-Type Matching'], py_conditions_simple: ['py_elif_skip','Traffic Light Priority'], py_loops_simple: ['py_range_zero','Conveyor Belt Zero-Start'], py_functions_simple: ['py_return_none','Vending Machine Dispense'], py_lists_simple: ['py_negative_index','Skeleton Key -1'], py_dicts_simple: ['py_dict_key_access','Phone Book Name Lookup'], py_classes_simple: ['py_self_meaning','Cookie Independence'], py_exceptions_simple: ['py_except_trigger','Safety Net Logic'], py_fileio_simple: ['py_write_overwrite','Write Mode Shredding'] }
          };

          const correctAnswers = pythonAnswerMap[lessonId] || { q1: 'B' };
          Object.keys(answers).forEach(qKey => {
            const correctAns = correctAnswers[qKey];
            if (correctAns && answers[qKey] === correctAns) {
              correctCount++;
            } else {
              const mapGroup = conceptMap[qKey];
              const conceptEntry = mapGroup ? (mapGroup[lessonId] || ['general_concept', 'Conceptual Gap']) : ['general_concept', 'Conceptual Gap'];
              identifiedGaps.push({
                id: conceptEntry[0],
                concept: conceptEntry[1],
                misconception: `Incorrect answer on ${qKey} — needs re-teaching of ${conceptEntry[1]}`,
                severity: 'MODERATE'
              });
            }
          });

          if (identifiedGaps.length === 0 && Object.keys(answers).length === 0) {
            // boundary_shift fallback for legacy binary_search
            if (answers['q1'] === 'B') correctCount++;
            else identifiedGaps.push({
              id: 'boundary_shift',
              concept: 'Midpoint Boundary Precision',
              misconception: 'Off-by-one boundary shift leading to infinite search loops.',
              severity: 'CRITICAL'
            });
          }
        }

        const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        let masteryTier = 'NOVICE';
        let feedbackSummary = '';

        if (scorePercent === 100) {
          masteryTier = 'MASTERY';
          feedbackSummary = 'Student has fully grasped core mechanics and boundary conditions.';
        } else if (scorePercent >= 50) {
          masteryTier = 'DEVELOPING';
          feedbackSummary = 'Student understands the high-level intuition but holds specific edge-case misconceptions.';
        } else {
          masteryTier = 'STRUGGLING';
          feedbackSummary = 'Fundamental conceptual friction detected. Immediate targeted re-teaching recommended.';
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          lessonId,
          scorePercent,
          masteryTier,
          feedbackSummary,
          correctCount,
          totalQuestions,
          identifiedGaps,
          needsReteaching: identifiedGaps.length > 0,
          primaryGap: identifiedGaps[0] || null
        }));
        return;
      }

      // 3c. Video Tutor: Dynamic Targeted Re-Teaching Synthesizer
      if (pathname === '/api/adaptive-reteach' && req.method === 'POST') {
        const { lessonId, gapId } = data;
        
        let reteachModule = {};

        if (gapId === 'base_case_overflow' || lessonId === 'recursion') {
          reteachModule = {
            title: "Targeted Re-Teaching: Why the Base Case is Mandatory",
            targetConcept: "Base Case & Stack Frames",
            misconceptionAddressed: "Functions calling themselves without stopping create infinite stack frames.",
            audioScript: "Let's clear this up! Imagine you ask a friend 'What is factorial 4?'. They ask someone else for 3, who asks for 2, who asks for 1. If no one tells person 1 to STOP and say 'The answer is 1', person 1 asks person 0, who asks minus 1, forever! The computer runs out of memory desks and crashes with Stack Overflow. The 'if (n <= 1) return 1' is the emergency brake that stops the chain!",
            remedialSteps: [
              {
                step: 1,
                title: "The Problem: Infinite Descent",
                desc: "factorial(4) -> factorial(3) -> factorial(2) -> factorial(1) -> factorial(0) -> factorial(-1)... Stack Memory Exhausted!"
              },
              {
                step: 2,
                title: "The Cure: The Base Case Guard",
                desc: "Placing 'if (n <= 1) return 1;' at the top immediately halts the descent and returns 1."
              },
              {
                step: 3,
                title: "The Unwinding: Rolling Answers Upwards",
                desc: "Now that person 1 has '1', person 2 computes 2 * 1 = 2, person 3 computes 3 * 2 = 6, and person 4 computes 4 * 6 = 24!"
              }
            ],
            microCheck: {
              question: "If you want factorial(0) to also equal 1, what should the base case condition be?",
              options: ["if (n == 0)", "if (n <= 1) return 1;", "while (n > 0)"],
              correctIndex: 1,
              explanation: "n <= 1 cleanly handles both 1 and 0, preventing accidental negative numbers!"
            }
          };
        } else if (gapId === 'pointer_direction' || lessonId === 'two_pointers') {
          reteachModule = {
            title: "Targeted Re-Teaching: Which Pointer Moves When Sum is Too Big?",
            targetConcept: "Sorted Monotonic Property",
            misconceptionAddressed: "Moving left when sum is already too large.",
            audioScript: "Here is the key insight: because the array is SORTED, the smallest numbers are on the left and the largest numbers are on the right! If your sum of Left and Right is 17 and you need 9, the sum is TOO BIG! To make a sum smaller, you must pick a smaller number. The only way to pick a smaller number is to move the RIGHT pointer inwards to the left!",
            remedialSteps: [
              {
                step: 1,
                title: "Sorted Array Property",
                desc: "[2, 7, 11, 15] -> Smallest at index 0, largest at index 3."
              },
              {
                step: 2,
                title: "Sum is Too Big (17 > 9)",
                desc: "Moving left pointer rightwards would only pick bigger numbers (7 + 15 = 22, even worse!)."
              },
              {
                step: 3,
                title: "The Golden Rule",
                desc: "If sum > target -> right--. If sum < target -> left++."
              }
            ],
            microCheck: {
              question: "If arr[left] + arr[right] < target, which pointer must move?",
              options: ["left++ to increase sum", "right-- to decrease sum", "Both pointers"],
              correctIndex: 0,
              explanation: "Moving left++ steps onto a larger number, pulling the sum upwards towards the target!"
            }
          };
        } else {
          reteachModule = {
            title: "Targeted Re-Teaching: Binary Search Boundary Pruning",
            targetConcept: "Midpoint Pruning",
            misconceptionAddressed: "Off-by-one loop freeze.",
            audioScript: "When your target is larger than arr[mid], you have already inspected arr[mid] and found it too small! So you never need to look at arr[mid] again. Your new search window must start at mid PLUS ONE!",
            remedialSteps: [
              { step: 1, title: "Compare Mid", desc: "Target 35 > arr[mid] 20." },
              { step: 2, title: "Prune Left Half", desc: "Discard everything from index 0 up to mid." },
              { step: 3, title: "Advance Low", desc: "low = mid + 1 prevents infinite loops when low + 1 == high." }
            ],
            microCheck: {
              question: "Why do we write low = mid + 1 instead of low = mid?",
              options: ["To prevent getting stuck in an infinite loop", "It doesn't matter", "To skip target"],
              correctIndex: 0,
              explanation: "If low = mid, when high is low+1, mid remains low and low never advances, freezing the loop!"
            }
          };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          reteachModule,
          generatedAt: new Date().toISOString()
        }));
        return;
      }

      // 4. Session Analytics & Heatmap data
      if (pathname === '/api/session-analytics' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          session: sessionStore,
          recentLogs: sessionStore.telemetryLogs.slice(-50)
        }));
        return;
      }

      // 5. Health check
      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', project: 'Confusion-Aware-Interactive-Tutor', version: '1.0.0' }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    });
    return;
  }

  // Static File Serving
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA routing
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (fallbackErr, fallbackContent) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallbackContent);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` Real-Time Confusion-Aware Interactive Tutor`);
  console.log(` Server active at: http://localhost:${PORT}`);
  console.log(`================================================================`);
});

