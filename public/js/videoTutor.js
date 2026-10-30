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
    this.redirectTimer = null;
    this.redirectCountdown = 4;
    this.mouthOpen = false;
    this.videoEngine = null; // CanvasVideoEngine instance — initialized after render()
    this._speechKeepAlive = null; // interval handle for Chrome speech keep-alive fix

    // Lessons catalog with Paired Teaching Strategies
    // Demonstrating Hurdle 52: "Change the Teaching, Not the Words"
    this.lessons = [
      // 0. FEATURED: Peer-to-Peer Knowledge Exchange (Collaborative Problem Solving & Review)
      {
        id: "peer_knowledge_exchange",
        strategyType: "STANDARD",
        pairedSimplerId: "peer_knowledge_exchange_simple",
        strategyBadge: "🤝 Peer Exchange Track: Collaborative Mastery",
        title: "Lesson: Peer-to-Peer Knowledge Exchange",
        subtitle: "How peer teaching, code reviews, and swapping mental models creates collective mastery",
        category: "Collaborative Learning & Peer Exchange",
        videoAvatar: "👩‍🏫 Professor Ada & Peer Mentors",
        durationSec: 80,
        timeline: [
          { time: 0, title: "The Feynman Technique: Teaching to Learn", slideText: "Explaining code to a peer forces you to articulate implicit assumptions and instantly exposes hidden gaps." },
          { time: 20, title: "The Decentralized Peer Network", slideText: "Learners exchange mental models, edge-case tests, and optimization strategies in real time." },
          { time: 40, title: "Checkpoint 1: The Teaching Paradox", isCheckpoint: true, checkpointId: "q1_peer" },
          { time: 55, title: "Collaborative Debugging & Edge Cases", slideText: "Reviewing peer code trains you to anticipate runtime crashes before running the compiler." },
          { time: 70, title: "Checkpoint 2: Actionable Peer Feedback", isCheckpoint: true, checkpointId: "q2_peer" },
          { time: 75, title: "Summary: Collective Intelligence", slideText: "Two minds conquer debugging twice as fast. Learn, explain, critique, master!" }
        ],
        narration: [
          "Welcome to our session on Peer-to-Peer Knowledge Exchange! Learning science shows that the single most effective way to master algorithms is to teach them to another person.",
          "In a peer network, every learner brings a distinct perspective. One student shares an intuitive visual analogy, while another spots an asymptotic optimization.",
          "When you review a peer's solution, you test boundary conditions together. This collaborative debugging builds deep metacognitive problem solving skills.",
          "By trading insights and feedback, the entire group levels up together through decentralized collective intelligence."
        ],
        questions: {
          q1_peer: {
            title: "In-Video Checkpoint 1 (Time 0:40)",
            question: "According to the Feynman Technique, why does explaining code to a peer produce deeper understanding than re-reading documentation alone?",
            options: [
              { key: "A", text: "Because your peer will always fix the code for you" },
              { key: "B", text: "It forces you to articulate your mental model, which immediately exposes any incomplete logic or hidden gaps", isCorrect: true },
              { key: "C", text: "Because documentation is always wrong" }
            ],
            gapId: "peer_feynman_articulation",
            gapConcept: "Peer Articulation & Self-Diagnosis"
          },
          q2_peer: {
            title: "In-Video Checkpoint 2 (Time 1:10)",
            question: "When conducting a peer code review on an algorithm that fails on large test cases, which feedback is most constructive?",
            options: [
              { key: "A", text: "Guide the peer to analyze the time complexity of their nested loops and suggest an O(N) single-pass approach", isCorrect: true },
              { key: "B", text: "Tell them their code is broken and rewrite it yourself" },
              { key: "C", text: "Advise them to ignore large inputs since small inputs work" }
            ],
            gapId: "peer_review_constructive",
            gapConcept: "Constructive Algorithmic Critique"
          }
        }
      },

      // 0B. SIMPLIFIED TRACK: Study Buddy Knowledge Swap
      {
        id: "peer_knowledge_exchange_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "peer_knowledge_exchange",
        strategyBadge: "💡 Simpler Track: Study Buddy Knowledge Swap",
        title: "Peer Exchange (Simpler): Study Buddy Knowledge Swap",
        subtitle: "How talking through a problem with a friend makes hard code feel easy",
        category: "Collaborative Learning (Simpler Track)",
        videoAvatar: "🤝 Study Buddy Sam",
        durationSec: 50,
        timeline: [
          { time: 0, title: "Rubber Ducking & Talking to a Friend", slideText: "Just explaining your thought process out loud to a friend often sparks the solution before you even finish talking." },
          { time: 18, title: "Swapping Mental Metaphors", slideText: "If one friend thinks in math formulas and the other thinks in Russian Dolls, both gain a superpower." },
          { time: 35, title: "Checkpoint: The Two-Brain Advantage", isCheckpoint: true, checkpointId: "q1_peer_simple" },
          { time: 42, title: "Summary: Nobody Learns Alone", slideText: "Ask questions, share your mental models, and celebrate breakthroughs together!" }
        ],
        narration: [
          "Hey there! Have you ever been totally stuck on a puzzle, and the moment you explained it to a friend, the answer popped right into your head?",
          "That is the power of peer exchange! When two friends swap their unique mental pictures, complex problems become simple games."
        ],
        questions: {
          q1_peer_simple: {
            title: "Simpler Peer Checkpoint",
            question: "Why does explaining a problem to a study buddy help you find your own mistakes?",
            options: [
              { key: "A", text: "Talking out loud slows down your thinking and lets your brain spot errors it missed when silently staring at the screen", isCorrect: true },
              { key: "B", text: "Because your friend does all the homework" },
              { key: "C", text: "It only helps if your friend is a professional programmer" }
            ],
            gapId: "peer_talking_clarity",
            gapConcept: "Verbalizing Thought Process"
          }
        }
      },

      // 1. STANDARD TRACK: Recursion (Abstract Code & Memory Stack Frames)
      {
        id: "recursion",
        strategyType: "STANDARD",
        pairedSimplerId: "recursion_simplified",
        strategyBadge: "🎓 Standard Track: Code & Call Stack",
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

      // 1B. SIMPLIFIED TRACK: Russian Nesting Dolls Physical Analogy (Zero Code Jargon)
      {
        id: "recursion_simplified",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "recursion",
        strategyBadge: "🎨 Simpler Visual Track: Russian Nesting Dolls",
        title: "Lesson 1B (Simpler): The Russian Nesting Dolls Analogy",
        subtitle: "A physical toy demonstration for students who found the code explanation confusing",
        category: "Visual Intuition (Simpler Track)",
        videoAvatar: "🎨 Visual Coach Maya",
        durationSec: 60,
        timeline: [
          { time: 0, title: "Why Big Problems Hide Inside Little Dolls", slideText: "Forget code and memory stacks. Imagine a set of wooden Russian nesting dolls on a table!" },
          { time: 18, title: "Opening Doll 4 -> Doll 3 -> Doll 2...", slideText: "Each doll you open reveals another smaller doll waiting inside." },
          { time: 32, title: "Checkpoint: The Solid Center Doll", isCheckpoint: true, checkpointId: "q1_simple" },
          { time: 45, title: "Closing Dolls & Passing the Answer", slideText: "Once the baby doll returns a number, every outer doll can close and multiply!" }
        ],
        narration: [
          "Hey there! Let's switch teaching strategies completely. Forget complex code syntax and memory frames.",
          "Think of recursion like Russian nesting dolls! You open Doll 4, and inside is Doll 3. But what if every single doll opened to another doll forever? The table would collapse under infinite dolls!",
          "That's why the center-most solid baby doll is so crucial. Let's see if you can spot why in this simple checkpoint!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Visual Checkpoint (Intuition Check)",
            question: "To stop opening dolls forever, what MUST be inside the very smallest doll at the center?",
            options: [
              { key: "A", text: "Another infinite hollow doll that opens again" },
              { key: "B", text: "A solid wooden baby doll that CANNOT be opened further (The Base Case!)", isCorrect: true },
              { key: "C", text: "Nothing at all, keep opening phantom dolls" }
            ],
            gapId: "base_case_overflow",
            gapConcept: "Physical Base Case Stopping Point"
          }
        }
      },

      // 2. STANDARD TRACK: Two-Pointer Technique
      {
        id: "two_pointers",
        strategyType: "STANDARD",
        pairedSimplerId: "two_pointers_simplified",
        strategyBadge: "🎓 Standard Track: Two-Pointer Indices",
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

      // 2B. SIMPLIFIED TRACK: Sliding Ruler Clamps (Physical Squeeze)
      {
        id: "two_pointers_simplified",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "two_pointers",
        strategyBadge: "🛠️ Simpler Visual Track: Sliding Ruler Clamps",
        title: "Lesson 2B (Simpler): The Sliding Ruler Clamps",
        subtitle: "Two fingers squeezing a wooden ruler to find target 9 without algebra",
        category: "Visual Intuition (Simpler Track)",
        videoAvatar: "🛠️ Coach Ben",
        durationSec: 60,
        timeline: [
          { time: 0, title: "Two Fingers on a Number Line", slideText: "Imagine a wooden ruler marked [2, 7, 11, 15]. Smallest on the left, largest on the right." },
          { time: 20, title: "When the Sum is Too Heavy", slideText: "Fingers at 2 and 15 give 17. That's too heavy for target 9!" },
          { time: 35, title: "Checkpoint: Squeezing the Clamps", isCheckpoint: true, checkpointId: "q1_simple" },
          { time: 48, title: "The Target Click!", slideText: "Moving the right finger from 15 to 7 gives 2 + 7 = 9. Perfect match!" }
        ],
        narration: [
          "Let's drop the pointer terminology and look at this physically. Put two fingers on a wooden ruler at 2 and 15.",
          "Your target is 9, but 2 plus 15 is 17. It's way too big! Since numbers get smaller to the left, which finger would you slide to make the sum lighter?"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Visual Checkpoint (Ruler Intuition)",
            question: "Your fingers are at 2 and 15 (sum 17, target 9). To make the sum smaller on a sorted ruler, which finger do you slide?",
            options: [
              { key: "A", text: "Slide your left finger rightward toward bigger numbers (makes it even heavier!)" },
              { key: "B", text: "Slide your right finger leftward from 15 toward smaller numbers (makes the sum lighter)", isCorrect: true },
              { key: "C", text: "Don't slide anything" }
            ],
            gapId: "pointer_direction",
            gapConcept: "Ruler Clamp Squeeze Intuition"
          }
        }
      },

      // 3. STANDARD TRACK: Binary Search
      {
        id: "binary_search",
        strategyType: "STANDARD",
        pairedSimplerId: "binary_search_simplified",
        strategyBadge: "🎓 Standard Track: O(log N) Divide & Conquer",
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
      },

      // 3B. SIMPLIFIED TRACK: 20-Questions Card Game
      {
        id: "binary_search_simplified",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "binary_search",
        strategyBadge: "🃏 Simpler Visual Track: High-Low Card Game",
        title: "Lesson 3B (Simpler): The High-Low Secret Card Game",
        subtitle: "Tossing half the deck into the recycling bin with a single question",
        category: "Visual Intuition (Simpler Track)",
        videoAvatar: "🃏 Game Master Sam",
        durationSec: 60,
        timeline: [
          { time: 0, title: "Guessing a Secret Card from 1 to 100", slideText: "Instead of math formulas, imagine playing a high-low guessing game with playing cards." },
          { time: 20, title: "Why You Should Always Guess 50 First!", slideText: "Guessing the middle immediately cuts the deck into two equal halves." },
          { time: 35, title: "Checkpoint: Tossing the Useless Cards", isCheckpoint: true, checkpointId: "q1_simple" },
          { time: 50, title: "Winning in Just 7 Guesses", slideText: "100 -> 50 -> 25 -> 12 -> 6 -> 3 -> 1. Guaranteed victory!" }
        ],
        narration: [
          "Welcome to the High-Low game! You have 100 cards numbered 1 to 100. I pick a secret card.",
          "You guess 50. I say: 'MY SECRET CARD IS HIGHER!' Instantly, you don't even need to look at cards 1 through 50—you throw them all away!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Visual Checkpoint (Game Intuition)",
            question: "You guess 50 on cards 1-100, and the game host yells 'HIGHER!'. Which pile can you immediately throw away?",
            options: [
              { key: "A", text: "Cards 1 through 50 (Throw away the entire lower half including 50!)", isCorrect: true },
              { key: "B", text: "Cards 51 through 100" },
              { key: "C", text: "Keep all cards and guess randomly" }
            ],
            gapId: "boundary_shift",
            gapConcept: "Card Pile Elimination Intuition"
          }
        }
      },

      // =====================================================================
      // 🐍 FULL PYTHON COURSE — 9 Lessons (Standard + Simplified Pairs)
      // =====================================================================

      // PY-1 STANDARD: Variables & Data Types
      {
        id: "py_variables",
        strategyType: "STANDARD",
        pairedSimplerId: "py_variables_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 1: Variables & Data Types",
        subtitle: "Storing numbers, text, and True/False values in named memory boxes",
        category: "Python — Full Course",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 75,
        timeline: [
          { time: 0, title: "What is a Variable?", slideText: "A variable is a named label that points to a value stored in memory. x = 10 means 'label x points to the number 10'." },
          { time: 18, title: "The 4 Core Data Types", slideText: "int (whole numbers), float (decimals), str (text in quotes), bool (True or False)." },
          { time: 38, title: "Checkpoint 1: Type Identification", isCheckpoint: true, checkpointId: "q1" },
          { time: 52, title: "type() and Dynamic Typing", slideText: "Python detects types automatically. type(42) returns <class 'int'>. You can re-assign any variable to any type!" },
          { time: 65, title: "Checkpoint 2: Type Conversion", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Welcome to the Python course! Today we start with the most fundamental concept — variables. Think of a variable as a sticky label on a memory box.",
          "Python has 4 core data types. Numbers without decimals are int. Numbers with decimals are float. Text wrapped in quotes is str. And True or False values are bool!"
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: Type Check",
            question: "What is the data type of the value produced by: name = 'Alice'  ?",
            options: [
              { key: "A", text: "int — because Alice is a name" },
              { key: "B", text: "str — because 'Alice' is wrapped in quotes making it a string", isCorrect: true },
              { key: "C", text: "bool — because it stores a label" }
            ],
            gapId: "py_str_type",
            gapConcept: "String Data Type Recognition"
          },
          q2: {
            title: "Checkpoint 2: Type Conversion",
            question: "What does int('42') do in Python?",
            options: [
              { key: "A", text: "Crashes with a TypeError" },
              { key: "B", text: "Converts the string '42' into the integer 42 so you can do math with it", isCorrect: true },
              { key: "C", text: "Returns the word 'forty-two'" }
            ],
            gapId: "py_type_conversion",
            gapConcept: "Type Casting & Conversion"
          }
        }
      },
      // PY-1 SIMPLIFIED: Labelled Jars Analogy
      {
        id: "py_variables_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_variables",
        strategyBadge: "🫙 Simpler Track: Labelled Kitchen Jars",
        title: "🐍 Python 1B (Simpler): Kitchen Jar Labels",
        subtitle: "Variables are sticky labels on jars — the jar holds the value, the label is the name",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🎨 Visual Coach Maya",
        durationSec: 55,
        timeline: [
          { time: 0, title: "Imagine 4 Jars on a Kitchen Shelf", slideText: "One jar holds sugar (numbers). One holds honey (decimals). One holds a name tag (text). One holds a light switch (True/False)." },
          { time: 20, title: "The Label IS the Variable Name", slideText: "Writing x = 10 is like sticking a label 'x' on the jar that contains the number 10." },
          { time: 35, title: "Checkpoint: Which Jar?", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Forget code for a moment. Imagine your kitchen counter has 4 jars. One jar holds sugar (whole numbers), one holds honey (decimal numbers), one holds a name tag (text), and one holds a light switch (True or False).",
          "When you write name = 'Alice' in Python, you are simply sticking a label that says 'name' on the jar that contains the text Alice."
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Kitchen Jars",
            question: "If you write age = 25 in Python, which jar are you filling?",
            options: [
              { key: "A", text: "The honey jar (decimals) because 25 is a measurement" },
              { key: "B", text: "The sugar jar (whole numbers / int) because 25 is a whole number with no decimal", isCorrect: true },
              { key: "C", text: "The name tag jar (text) because age is a word" }
            ],
            gapId: "py_str_type",
            gapConcept: "Matching Values to Jar Types"
          }
        }
      },

      // PY-2 STANDARD: if/else Conditions
      {
        id: "py_conditions",
        strategyType: "STANDARD",
        pairedSimplerId: "py_conditions_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 2: if / elif / else Conditions",
        subtitle: "Making decisions in code based on True or False tests",
        category: "Python — Full Course",
        videoAvatar: "👨‍🏫 Dr. Turing",
        durationSec: 80,
        timeline: [
          { time: 0, title: "Boolean Tests & Comparisons", slideText: "5 > 3 is True. 'cat' == 'dog' is False. These boolean tests power all if/else decisions." },
          { time: 22, title: "The if / elif / else Chain", slideText: "Python checks conditions top-to-bottom. The first True branch runs. All others are skipped." },
          { time: 42, title: "Checkpoint 1: Indentation Rule", isCheckpoint: true, checkpointId: "q1" },
          { time: 58, title: "Nested Conditions", slideText: "You can place if statements inside other if statements to test multiple conditions at once." },
          { time: 70, title: "Checkpoint 2: elif Logic", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Conditions are how Python makes decisions. Every if statement evaluates a boolean test — either True or False — and executes the matching block.",
          "Python uses indentation (4 spaces) instead of curly braces. If you forget to indent the code under an if, Python raises an IndentationError immediately!"
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: Indentation",
            question: "In Python, what happens if you write the code block under an 'if' statement with NO indentation?",
            options: [
              { key: "A", text: "Python ignores the spacing and runs it anyway" },
              { key: "B", text: "Python raises an IndentationError because indentation defines the code block scope", isCorrect: true },
              { key: "C", text: "The if statement becomes an else automatically" }
            ],
            gapId: "py_indentation",
            gapConcept: "Python Indentation & Block Scope"
          },
          q2: {
            title: "Checkpoint 2: elif Logic",
            question: "If the 'if' condition is True, does Python also check the 'elif' condition below it?",
            options: [
              { key: "A", text: "Yes — Python always checks every condition from top to bottom" },
              { key: "B", text: "No — once any branch is True, all remaining elif/else branches are skipped entirely", isCorrect: true },
              { key: "C", text: "Only if the elif uses a different variable" }
            ],
            gapId: "py_elif_skip",
            gapConcept: "Short-Circuit Branch Evaluation"
          }
        }
      },
      // PY-2 SIMPLIFIED: Traffic Lights Analogy
      {
        id: "py_conditions_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_conditions",
        strategyBadge: "🚦 Simpler Track: Traffic Light Rules",
        title: "🐍 Python 2B (Simpler): The Traffic Light Decision",
        subtitle: "if/elif/else works exactly like a traffic light — top rule wins, rest are ignored",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🛠️ Coach Ben",
        durationSec: 55,
        timeline: [
          { time: 0, title: "A Traffic Light Has Priority Rules", slideText: "Red light = STOP. Green light = GO. You never check the green light if the red light is already on." },
          { time: 20, title: "if = Red Light (Highest Priority)", slideText: "Python's if is the red light. If it fires True, everything below (elif, else) is completely ignored." },
          { time: 35, title: "Checkpoint: Light Priority", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Forget code syntax. Think of a traffic light. Red means stop — it has the highest priority. Yellow means slow. Green means go only if nothing above triggered first.",
          "Python's if/elif/else works the same way. The FIRST True condition wins, and Python immediately ignores all the remaining lights below it."
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Traffic Light Priority",
            question: "The red light (if score >= 90) turns TRUE. Does Python also check the yellow light (elif score >= 70) below it?",
            options: [
              { key: "A", text: "Yes — Python checks every light every time no matter what" },
              { key: "B", text: "No — once the red light fires True, all lights below are completely skipped", isCorrect: true },
              { key: "C", text: "Only if the score is exactly 90" }
            ],
            gapId: "py_elif_skip",
            gapConcept: "Traffic Light Priority (if/elif Skip)"
          }
        }
      },

      // PY-3 STANDARD: for Loops & range()
      {
        id: "py_loops",
        strategyType: "STANDARD",
        pairedSimplerId: "py_loops_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 3: for Loops & range()",
        subtitle: "Repeating actions automatically without copy-pasting code",
        category: "Python — Full Course",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 80,
        timeline: [
          { time: 0, title: "Why We Need Loops", slideText: "Without loops, printing 1 to 100 means 100 separate print() lines. Loops let one block of code repeat automatically." },
          { time: 20, title: "for i in range(5)", slideText: "range(5) generates [0, 1, 2, 3, 4]. The loop variable 'i' takes each value in turn." },
          { time: 40, title: "Checkpoint 1: range() Values", isCheckpoint: true, checkpointId: "q1" },
          { time: 55, title: "Looping Over Lists", slideText: "for item in my_list: — iterates through every element in the list automatically!" },
          { time: 68, title: "Checkpoint 2: Loop Variable", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Loops are one of the most powerful tools in programming. Instead of writing the same code 100 times, you write it once and let the loop repeat it.",
          "range(5) doesn't give you 1 to 5! It gives 0 to 4. This trips up many beginners. Let's test your understanding right now."
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: range() Output",
            question: "What numbers does range(3) produce when used in a for loop?",
            options: [
              { key: "A", text: "1, 2, 3 (starts at 1, ends at 3)" },
              { key: "B", text: "0, 1, 2 (starts at 0, stops BEFORE 3)", isCorrect: true },
              { key: "C", text: "0, 1, 2, 3 (includes the end number 3)" }
            ],
            gapId: "py_range_zero",
            gapConcept: "Zero-Based range() Indexing"
          },
          q2: {
            title: "Checkpoint 2: Loop Variable",
            question: "In 'for fruit in ['apple','banana','cherry']:', what is the value of 'fruit' on the second iteration?",
            options: [
              { key: "A", text: "'apple'" },
              { key: "B", text: "'banana' — the loop variable takes the second list item on the 2nd pass", isCorrect: true },
              { key: "C", text: "1 — the index number of the second item" }
            ],
            gapId: "py_loop_var",
            gapConcept: "Loop Variable Assignment Each Iteration"
          }
        }
      },
      // PY-3 SIMPLIFIED: Conveyor Belt Analogy
      {
        id: "py_loops_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_loops",
        strategyBadge: "🏭 Simpler Track: Factory Conveyor Belt",
        title: "🐍 Python 3B (Simpler): The Factory Conveyor Belt",
        subtitle: "A for loop is a conveyor belt that picks up each item and hands it to a worker",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🎨 Visual Coach Maya",
        durationSec: 55,
        timeline: [
          { time: 0, title: "A Box Factory Has a Conveyor Belt", slideText: "Imagine boxes labelled 0, 1, 2, 3, 4 moving along a belt. A worker (your code) stamps each box as it arrives." },
          { time: 20, title: "range(5) = 5 Boxes Numbered 0 to 4", slideText: "The belt always starts at box 0. The LAST box is always one LESS than the number you give range()." },
          { time: 35, title: "Checkpoint: First Box Number", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Imagine a factory conveyor belt. You tell the belt 'send me 5 boxes'. It sends boxes numbered 0, 1, 2, 3, 4 — starting from ZERO, not one!",
          "Your code is the worker standing at the end of the belt. Every time a box arrives, your worker stamps it. When the belt is empty, the loop is done."
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Conveyor Belt",
            question: "You order range(3) boxes from the factory. What number is stamped on the very FIRST box that arrives?",
            options: [
              { key: "A", text: "1 — boxes are counted starting from 1 like in real life" },
              { key: "B", text: "0 — Python's factory always stamps the first box with 0, not 1", isCorrect: true },
              { key: "C", text: "3 — the number you passed to range()" }
            ],
            gapId: "py_range_zero",
            gapConcept: "Conveyor Belt Zero-Start Counting"
          }
        }
      },

      // PY-4 STANDARD: Functions & return
      {
        id: "py_functions",
        strategyType: "STANDARD",
        pairedSimplerId: "py_functions_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 4: Functions & return",
        subtitle: "Packaging reusable code blocks with def, parameters, and return values",
        category: "Python — Full Course",
        videoAvatar: "👨‍🏫 Dr. Turing",
        durationSec: 85,
        timeline: [
          { time: 0, title: "Why Define Functions?", slideText: "Without functions, the same logic repeats everywhere. A function is a named, reusable recipe." },
          { time: 20, title: "def, Parameters & Arguments", slideText: "def greet(name): defines a function. 'name' is the parameter. greet('Alice') passes 'Alice' as the argument." },
          { time: 42, title: "Checkpoint 1: Parameters vs Arguments", isCheckpoint: true, checkpointId: "q1" },
          { time: 58, title: "return Sends a Value Back", slideText: "Without return, a function gives back None. With return result, the caller receives the computed value." },
          { time: 72, title: "Checkpoint 2: return vs print", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "A function is a named recipe. You write it once with def, give it ingredients (parameters), and call it whenever you need that recipe executed.",
          "Many beginners confuse print() and return. print() shows a value on screen but discards it. return sends the value BACK to whoever called the function so it can be used in further calculations."
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: Parameters vs Arguments",
            question: "In 'def add(a, b): return a + b'  and calling  'add(3, 5)', what are 'a' and 'b' called?",
            options: [
              { key: "A", text: "Arguments — the names you use inside the function definition" },
              { key: "B", text: "Parameters — the placeholder names in def; 3 and 5 are the arguments passed at the call site", isCorrect: true },
              { key: "C", text: "Variables — because they change each time you call the function" }
            ],
            gapId: "py_params_args",
            gapConcept: "Parameters vs Arguments Distinction"
          },
          q2: {
            title: "Checkpoint 2: return vs print",
            question: "result = double(5)  where double() only uses print(n*2) inside but has NO return. What is stored in 'result'?",
            options: [
              { key: "A", text: "10 — because double() printed 10" },
              { key: "B", text: "None — because print() shows output but doesn't return a value; only return does", isCorrect: true },
              { key: "C", text: "5 — the original input" }
            ],
            gapId: "py_return_none",
            gapConcept: "return vs print — Value Propagation"
          }
        }
      },
      // PY-4 SIMPLIFIED: Vending Machine Analogy
      {
        id: "py_functions_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_functions",
        strategyBadge: "🥤 Simpler Track: Vending Machine",
        title: "🐍 Python 4B (Simpler): The Vending Machine",
        subtitle: "A function is a vending machine — you put coins in (arguments) and get a snack out (return value)",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🛠️ Coach Ben",
        durationSec: 55,
        timeline: [
          { time: 0, title: "A Vending Machine is a Function", slideText: "Insert coins (arguments) → machine runs its internal recipe → dispenses snack (return value)." },
          { time: 20, title: "print() = Display Screen Only", slideText: "A vending machine that SHOWS a snack on its screen but NEVER drops it is useless. That's what print() alone does." },
          { time: 35, title: "Checkpoint: Does It Dispense?", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Think of a function as a vending machine. You put coins in — those are your arguments. The machine does its work and dispenses a snack — that is your return value.",
          "Now imagine a broken vending machine that lights up the snack on its screen but NEVER drops it. That is exactly what using print() instead of return does — you see the answer but can never use it!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Vending Machine",
            question: "Your vending machine (function) uses print(snack) but has no return. You try to catch the snack: result = machine('coins'). What lands in your hand (result)?",
            options: [
              { key: "A", text: "The snack — because the machine displayed it on screen" },
              { key: "B", text: "Nothing (None) — the machine showed the snack but never dropped it out; only return dispenses", isCorrect: true },
              { key: "C", text: "'coins' — your original input comes back" }
            ],
            gapId: "py_return_none",
            gapConcept: "Vending Machine Dispensing (return) vs Display (print)"
          }
        }
      },

      // PY-5 STANDARD: Lists & List Methods
      {
        id: "py_lists",
        strategyType: "STANDARD",
        pairedSimplerId: "py_lists_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 5: Lists & List Methods",
        subtitle: "Ordered, mutable collections — append, pop, slicing, and indexing",
        category: "Python — Full Course",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 80,
        timeline: [
          { time: 0, title: "What is a List?", slideText: "A list is an ordered, mutable sequence: fruits = ['apple', 'banana', 'cherry']. Each item has an index starting at 0." },
          { time: 20, title: "Indexing & Negative Indexing", slideText: "fruits[0] → 'apple'. fruits[-1] → 'cherry' (last item). Negative indexes count from the right!" },
          { time: 38, title: "Checkpoint 1: Negative Index", isCheckpoint: true, checkpointId: "q1" },
          { time: 52, title: "append(), pop(), len()", slideText: "append() adds to end, pop() removes and returns last item, len() counts items." },
          { time: 65, title: "Checkpoint 2: List Mutation", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "A list in Python is like a numbered row of lockers. Locker zero holds the first item, locker one holds the second, and so on.",
          "Python also supports negative indexing — minus one always points to the LAST item. This is incredibly useful for grabbing the end of a list without knowing its length."
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: Negative Indexing",
            question: "Given nums = [10, 20, 30, 40, 50]. What does nums[-2] return?",
            options: [
              { key: "A", text: "10 — the item 2 positions from the start" },
              { key: "B", text: "40 — the item 2 positions from the END of the list", isCorrect: true },
              { key: "C", text: "An IndexError because negative indexes are not valid" }
            ],
            gapId: "py_negative_index",
            gapConcept: "Negative List Indexing"
          },
          q2: {
            title: "Checkpoint 2: append vs reassign",
            question: "After running: my_list = [1, 2, 3]  then  my_list.append(4), what does my_list contain?",
            options: [
              { key: "A", text: "[4] — append() replaces the list entirely" },
              { key: "B", text: "[1, 2, 3, 4] — append() adds 4 to the end of the EXISTING list in-place", isCorrect: true },
              { key: "C", text: "[1, 2, 3] — lists are immutable so append() has no effect" }
            ],
            gapId: "py_list_mutability",
            gapConcept: "List Mutability & append()"
          }
        }
      },
      // PY-5 SIMPLIFIED: Numbered Lockers Analogy
      {
        id: "py_lists_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_lists",
        strategyBadge: "🗄️ Simpler Track: Numbered School Lockers",
        title: "🐍 Python 5B (Simpler): Numbered School Lockers",
        subtitle: "A list is a hallway of lockers — each locker has a number starting from 0",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🎨 Visual Coach Maya",
        durationSec: 50,
        timeline: [
          { time: 0, title: "A Hallway of 5 Lockers", slideText: "Lockers are numbered 0, 1, 2, 3, 4. Locker 0 is first. There is NO locker -0." },
          { time: 18, title: "The Surprise: Counting from the Back!", slideText: "Special key -1 opens the LAST locker. Key -2 opens the second-to-last. It counts backwards!" },
          { time: 32, title: "Checkpoint: Which Locker Opens?", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Imagine a hallway with 5 lockers numbered 0, 1, 2, 3, 4. Python's list is exactly this hallway.",
          "Now here's a cool trick: you also have a SPECIAL skeleton key numbered -1. This key ALWAYS opens the very last locker, no matter how long the hallway is!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Locker Keys",
            question: "You have lockers: ['red', 'blue', 'green', 'yellow', 'purple']. Which colour is behind the -1 key?",
            options: [
              { key: "A", text: "'red' — the -1 key opens the first locker" },
              { key: "B", text: "'purple' — the -1 skeleton key always opens the LAST locker in the hallway", isCorrect: true },
              { key: "C", text: "Nothing — negative keys don't exist in Python" }
            ],
            gapId: "py_negative_index",
            gapConcept: "Skeleton Key -1 Opens Last Locker"
          }
        }
      },

      // PY-6 STANDARD: Dictionaries
      {
        id: "py_dicts",
        strategyType: "STANDARD",
        pairedSimplerId: "py_dicts_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 6: Dictionaries (Key-Value Pairs)",
        subtitle: "Fast lookups using named keys instead of numbered indexes",
        category: "Python — Full Course",
        videoAvatar: "👨‍🏫 Dr. Turing",
        durationSec: 80,
        timeline: [
          { time: 0, title: "What is a Dictionary?", slideText: "A dict maps unique keys to values: person = {'name': 'Alice', 'age': 25}. Keys are like labels, not numbers." },
          { time: 22, title: "Accessing, Adding & Updating", slideText: "person['name'] → 'Alice'. person['city'] = 'London' adds a new key. person['age'] = 26 updates." },
          { time: 42, title: "Checkpoint 1: Key Access", isCheckpoint: true, checkpointId: "q1" },
          { time: 56, title: "Looping: .keys(), .values(), .items()", slideText: "for key, val in person.items(): lets you loop through all key-value pairs simultaneously." },
          { time: 68, title: "Checkpoint 2: Missing Key Error", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "A Python dictionary is like a real-world dictionary. Instead of looking up by page number, you look up by WORD. The word is the key, and its definition is the value.",
          "A common bug: accessing a key that doesn't exist raises a KeyError. Use .get('key', default) to safely retrieve values without crashing!"
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: Dictionary Key Access",
            question: "Given: scores = {'Alice': 95, 'Bob': 82}. How do you get Alice's score?",
            options: [
              { key: "A", text: "scores[0] — Alice is the first entry so index 0" },
              { key: "B", text: "scores['Alice'] — dictionaries are accessed by their KEY, not by position", isCorrect: true },
              { key: "C", text: "scores.Alice — using dot notation like an object" }
            ],
            gapId: "py_dict_key_access",
            gapConcept: "Dictionary Key-Based Access"
          },
          q2: {
            title: "Checkpoint 2: Missing Key",
            question: "What happens when you access scores['Charlie'] but 'Charlie' is not in the dictionary?",
            options: [
              { key: "A", text: "Returns None automatically" },
              { key: "B", text: "Raises a KeyError — Python crashes because 'Charlie' key does not exist", isCorrect: true },
              { key: "C", text: "Returns 0 as the default score" }
            ],
            gapId: "py_key_error",
            gapConcept: "KeyError on Missing Dictionary Keys"
          }
        }
      },
      // PY-6 SIMPLIFIED: Phone Book Analogy
      {
        id: "py_dicts_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_dicts",
        strategyBadge: "📖 Simpler Track: Phone Book Lookup",
        title: "🐍 Python 6B (Simpler): The Phone Book",
        subtitle: "A dictionary is a phone book — you look up by NAME, not by page number",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🃏 Game Master Sam",
        durationSec: 50,
        timeline: [
          { time: 0, title: "A Phone Book vs a Numbered List", slideText: "You never look up 'Alice' by page 47. You search by NAME. That name is the KEY. The phone number is the VALUE." },
          { time: 20, title: "Missing Name = Torn Page", slideText: "Looking up a name that isn't in the book? The book falls open to a blank torn page — Python's KeyError!" },
          { time: 32, title: "Checkpoint: How to Look Up", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Imagine a phone book. To find Alice's number, you don't flip to page 47. You search for her NAME directly. The name is the KEY, and the phone number is the VALUE.",
          "Now what if Alice's page was torn out? You'd get a blank empty page — a confusing result. That is exactly what Python's KeyError feels like."
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Phone Book",
            question: "Your phone book (dictionary) has 'Alice: 555-1234'. How do you look up Alice's number?",
            options: [
              { key: "A", text: "book[0] — Alice is on the first page, so use index 0" },
              { key: "B", text: "book['Alice'] — you look up by the person's NAME (key) in a phone book", isCorrect: true },
              { key: "C", text: "book.first() — use the first() method to get the first entry" }
            ],
            gapId: "py_dict_key_access",
            gapConcept: "Phone Book Name-Based Lookup"
          }
        }
      },

      // PY-7 STANDARD: Classes & OOP
      {
        id: "py_classes",
        strategyType: "STANDARD",
        pairedSimplerId: "py_classes_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 7: Classes & Object-Oriented Programming",
        subtitle: "Creating custom object blueprints with __init__, attributes and methods",
        category: "Python — Full Course",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 90,
        timeline: [
          { time: 0, title: "What is a Class?", slideText: "A class is a blueprint. An object is a specific thing built from that blueprint. class Dog: is the blueprint, my_dog = Dog() is a real dog object." },
          { time: 25, title: "__init__ and self", slideText: "__init__ runs automatically when you create an object. 'self' refers to the specific object being built." },
          { time: 48, title: "Checkpoint 1: __init__ Purpose", isCheckpoint: true, checkpointId: "q1" },
          { time: 65, title: "Methods: Functions Inside Classes", slideText: "A method is just a function defined inside a class. It always takes 'self' as the first parameter." },
          { time: 78, title: "Checkpoint 2: self Parameter", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Object-Oriented Programming organises code around real-world objects. A class is the blueprint — like an architect's floor plan. An object is the actual house built from it.",
          "Every time you create a new object, Python automatically calls __init__ to set up the object's starting state. The 'self' parameter is Python's way of saying 'this specific object right here'."
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: __init__ Role",
            question: "When is the __init__ method called in Python?",
            options: [
              { key: "A", text: "Only when you explicitly call myObject.__init__()" },
              { key: "B", text: "Automatically every time you create a new instance with ClassName() — it initialises the object", isCorrect: true },
              { key: "C", text: "Once when the class definition is first loaded, shared across all objects" }
            ],
            gapId: "py_init_call",
            gapConcept: "__init__ Automatic Constructor Invocation"
          },
          q2: {
            title: "Checkpoint 2: self Parameter",
            question: "Why must every class method have 'self' as its first parameter?",
            options: [
              { key: "A", text: "It's just a Python convention — you can rename it to anything" },
              { key: "B", text: "self refers to the specific object instance calling the method, allowing it to access that object's own attributes", isCorrect: true },
              { key: "C", text: "self is the class itself, not any single instance" }
            ],
            gapId: "py_self_meaning",
            gapConcept: "self as Instance Reference"
          }
        }
      },
      // PY-7 SIMPLIFIED: Cookie Cutter Blueprint
      {
        id: "py_classes_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_classes",
        strategyBadge: "🍪 Simpler Track: Cookie Cutter & Cookies",
        title: "🐍 Python 7B (Simpler): Cookie Cutter Blueprint",
        subtitle: "A class is the cutter (blueprint); each cookie is a unique object made from it",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🎨 Visual Coach Maya",
        durationSec: 55,
        timeline: [
          { time: 0, title: "The Cookie Cutter = The Class", slideText: "One star-shaped cutter can make unlimited star cookies. The cutter is your class definition." },
          { time: 20, title: "Each Cookie = One Object Instance", slideText: "cookie1 = Cookie('chocolate') and cookie2 = Cookie('vanilla') are two separate objects from the same blueprint." },
          { time: 35, title: "Checkpoint: Cutter vs Cookie", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Forget __init__ and self for a moment. Imagine a star-shaped cookie cutter. The CUTTER is your class — it is the blueprint that defines what a star cookie looks like.",
          "Every time you press the cutter into dough and lift it, you get a NEW cookie object. Each cookie is separate — you can decorate them differently, and changing one doesn't affect the others!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Cutter vs Cookie",
            question: "You have a cookie cutter (class Dog) and you make: rex = Dog('Rex') and buddy = Dog('Buddy'). If you change rex's name, does buddy's name also change?",
            options: [
              { key: "A", text: "Yes — they share the same cutter so all cookies change together" },
              { key: "B", text: "No — rex and buddy are separate cookie objects. Changing one never affects the other", isCorrect: true },
              { key: "C", text: "Only if both dogs are the same breed" }
            ],
            gapId: "py_self_meaning",
            gapConcept: "Each Cookie/Object is Independent"
          }
        }
      },

      // PY-8 STANDARD: try/except Error Handling
      {
        id: "py_exceptions",
        strategyType: "STANDARD",
        pairedSimplerId: "py_exceptions_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 8: try / except Error Handling",
        subtitle: "Catching runtime crashes gracefully so your program keeps running",
        category: "Python — Full Course",
        videoAvatar: "👨‍🏫 Dr. Turing",
        durationSec: 75,
        timeline: [
          { time: 0, title: "Why Programs Crash", slideText: "Runtime errors (like dividing by 0 or wrong type) crash the entire program instantly without try/except." },
          { time: 20, title: "try / except Structure", slideText: "Code in the 'try' block is monitored. If an error occurs, Python jumps to 'except' instead of crashing." },
          { time: 38, title: "Checkpoint 1: except Execution", isCheckpoint: true, checkpointId: "q1" },
          { time: 55, title: "Specific Exception Types", slideText: "except ZeroDivisionError, except ValueError, except TypeError — catching specific errors is best practice." },
          { time: 68, title: "Checkpoint 2: finally Block", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Without try/except, a single bad input from a user can bring down your entire application. Error handling makes programs resilient.",
          "The finally block is special — it ALWAYS runs whether an error occurred or not. Use it for cleanup tasks like closing files or network connections."
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: When Does except Run?",
            question: "If no error occurs in the try block, does the except block run?",
            options: [
              { key: "A", text: "Yes — except always runs to double-check the try block" },
              { key: "B", text: "No — except only runs when the try block raises an exception", isCorrect: true },
              { key: "C", text: "Only if the try block contains a print() statement" }
            ],
            gapId: "py_except_trigger",
            gapConcept: "except Block Conditional Execution"
          },
          q2: {
            title: "Checkpoint 2: finally Block",
            question: "When does the 'finally' block execute?",
            options: [
              { key: "A", text: "Only when an exception was caught by except" },
              { key: "B", text: "Always — whether an exception occurred or not; it's guaranteed cleanup code", isCorrect: true },
              { key: "C", text: "Only when no exception occurred (opposite of except)" }
            ],
            gapId: "py_finally",
            gapConcept: "finally Block — Guaranteed Execution"
          }
        }
      },
      // PY-8 SIMPLIFIED: Safety Net Analogy
      {
        id: "py_exceptions_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_exceptions",
        strategyBadge: "🎪 Simpler Track: Circus Safety Net",
        title: "🐍 Python 8B (Simpler): The Circus Safety Net",
        subtitle: "try is the tightrope act; except is the safety net below it",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🃏 Game Master Sam",
        durationSec: 50,
        timeline: [
          { time: 0, title: "The Tightrope Act (try block)", slideText: "The acrobat (your code) walks the tightrope. If they slip (error), without a net the show is over — total crash!" },
          { time: 18, title: "The Safety Net (except block)", slideText: "Stretch a net below. Now if the acrobat slips, they land safely, dust off, and the show CONTINUES." },
          { time: 32, title: "Checkpoint: Does the Net Always Deploy?", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Picture a circus acrobat walking a tightrope. Without a safety net, one slip means a catastrophic crash — that's your program without try/except.",
          "Now stretch a safety net below the tightrope. If the acrobat slips, they land safely in the net, the crowd cheers, and the show continues. That safety net is your except block!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Safety Net Logic",
            question: "The acrobat (try block) walks the tightrope PERFECTLY without slipping. Does the safety net (except) deploy?",
            options: [
              { key: "A", text: "Yes — the net always deploys at the end of the act no matter what" },
              { key: "B", text: "No — the safety net only deploys if the acrobat SLIPS (an error occurs). Perfect acts skip the net entirely.", isCorrect: true },
              { key: "C", text: "The net deploys halfway through every act as a precaution" }
            ],
            gapId: "py_except_trigger",
            gapConcept: "Safety Net Only Catches Falls (Errors)"
          }
        }
      },

      // PY-9 STANDARD: File I/O
      {
        id: "py_fileio",
        strategyType: "STANDARD",
        pairedSimplerId: "py_fileio_simple",
        strategyBadge: "🐍 Python Standard Track",
        title: "🐍 Python 9: File Reading & Writing",
        subtitle: "Persisting data to disk using open(), read(), write() and with blocks",
        category: "Python — Full Course",
        videoAvatar: "👩‍🏫 Professor Ada",
        durationSec: 75,
        timeline: [
          { time: 0, title: "Why Save to Files?", slideText: "Variables disappear when your program ends. Files persist data between runs — for logs, configs, and results." },
          { time: 20, title: "open() Modes: r, w, a", slideText: "'r' = read only. 'w' = write (OVERWRITES existing content!). 'a' = append (adds to end)." },
          { time: 40, title: "Checkpoint 1: Mode Danger", isCheckpoint: true, checkpointId: "q1" },
          { time: 55, title: "with Statement (Context Manager)", slideText: "with open('file.txt', 'r') as f: automatically closes the file when done — no risk of file handle leaks." },
          { time: 68, title: "Checkpoint 2: with vs open", isCheckpoint: true, checkpointId: "q2" }
        ],
        narration: [
          "Files are how programs remember things after they shut down. Today we learn how Python reads from and writes to files — one of the most practical skills in programming.",
          "Warning: opening a file with mode 'w' DESTROYS all existing content immediately. Even if you write nothing, the file is wiped. Always double-check your mode before writing!"
        ],
        questions: {
          q1: {
            title: "Checkpoint 1: File Mode Danger",
            question: "You open an existing file with open('data.txt', 'w'). The file had 500 lines of important data. What happens to that data?",
            options: [
              { key: "A", text: "It is preserved — 'w' mode adds new content below the existing data" },
              { key: "B", text: "It is instantly wiped — 'w' mode truncates (destroys) existing content the moment the file is opened", isCorrect: true },
              { key: "C", text: "Python asks for confirmation before overwriting" }
            ],
            gapId: "py_write_overwrite",
            gapConcept: "'w' Mode Immediate File Truncation"
          },
          q2: {
            title: "Checkpoint 2: with Statement Benefit",
            question: "What is the main advantage of using 'with open(...) as f:' instead of f = open(...)?",
            options: [
              { key: "A", text: "It reads files 10x faster due to buffering" },
              { key: "B", text: "It automatically closes the file when the with block exits — even if an exception occurs inside", isCorrect: true },
              { key: "C", text: "It prevents other programs from reading the same file" }
            ],
            gapId: "py_with_block",
            gapConcept: "Context Manager Auto-Close Guarantee"
          }
        }
      },
      // PY-9 SIMPLIFIED: Filing Cabinet Analogy
      {
        id: "py_fileio_simple",
        strategyType: "SIMPLIFIED",
        pairedStandardId: "py_fileio",
        strategyBadge: "🗂️ Simpler Track: Office Filing Cabinet",
        title: "🐍 Python 9B (Simpler): The Office Filing Cabinet",
        subtitle: "Files are drawers in a cabinet — read opens a drawer, write EMPTIES and refills it",
        category: "Python — Visual Simpler Track",
        videoAvatar: "🎨 Visual Coach Maya",
        durationSec: 50,
        timeline: [
          { time: 0, title: "Your Filing Cabinet (the Hard Drive)", slideText: "When the office closes (program ends), your desk is cleared. Only the filing cabinet keeps records permanently." },
          { time: 18, title: "READ = Open Drawer & Peek Inside", slideText: "Mode 'r' is like opening a drawer and reading its contents. You don't change anything." },
          { time: 32, title: "Checkpoint: What Does WRITE Mode Do?", isCheckpoint: true, checkpointId: "q1_simple" }
        ],
        narration: [
          "Your desk is your program's memory — when you go home (program ends), everything on your desk vanishes. The filing cabinet is your hard drive — it keeps everything overnight.",
          "Opening a drawer to READ is safe — you just look inside. But WRITE mode is dangerous — it is like an office assistant who THROWS AWAY EVERYTHING in the drawer first before filing new papers!"
        ],
        questions: {
          q1_simple: {
            title: "Simpler Checkpoint: Write Mode Danger",
            question: "You hand the assistant the file 'reports.txt' and say 'write mode please'. The drawer had 3 years of reports. What does the assistant do FIRST?",
            options: [
              { key: "A", text: "Carefully moves the old reports to a backup drawer before writing new ones" },
              { key: "B", text: "Throws ALL 3 years of existing reports into the shredder FIRST, then files new papers — write mode empties everything!", isCorrect: true },
              { key: "C", text: "Reads the old reports and merges them with the new ones" }
            ],
            gapId: "py_write_overwrite",
            gapConcept: "Write Mode Shreds Old Content First"
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
    const isSimpler = lesson.strategyType === 'SIMPLIFIED';

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Video Tutor Banner Header -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-orange-950/70 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold border border-orange-500/30">
                🎥 AI Video Tutor & Diagnostic Studio
              </span>
              ${isSimpler 
                ? '<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1"><span>🎨</span> SIMPLER VISUAL STRATEGY (Hurdle 52)</span>' 
                : '<span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/40 flex items-center gap-1"><span>🎓</span> STANDARD CODE LECTURE</span>'}
              <span class="text-xs text-slate-400">• Theme 06: Human-AI Interactive Teaching</span>
            </div>
            <h2 class="text-lg md:text-xl font-bold text-white">${lesson.title}</h2>
            <p class="text-xs text-slate-300">${lesson.subtitle}</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Privacy Shield (Hint 3: Where does camera footage go?) -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 shadow" title="Hint 3: Facial emotion & gaze attention telemetry is processed 100% locally in browser memory. 0 bytes video uploaded.">
              <span class="text-emerald-400">🔒</span>
              <span><strong>Edge Privacy:</strong> 0 Bytes Video Uploaded</span>
            </div>

            <!-- Strategy Switch Button (Hurdle 52: Change the Teaching, Not the Words) -->
            <button id="btn-switch-strategy-toggle" class="px-3 py-1.5 rounded-lg ${isSimpler ? 'bg-indigo-950/90 hover:bg-indigo-900 border-indigo-600 text-indigo-200' : 'bg-orange-950/90 hover:bg-orange-900 border-orange-600 text-orange-200'} border text-xs font-bold transition flex items-center gap-1.5 shadow">
              <span>${isSimpler ? '🎓' : '🔄'}</span>
              <span>${isSimpler ? 'Switch to Standard Code Track' : 'Switch to Simpler Visual Track'}</span>
            </button>

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
        </div>

        <!-- Adaptive Strategy Banner when in Simpler Mode -->
        ${isSimpler ? `
          <div class="p-3.5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-600/70 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-200 shadow-xl animate-fadeIn">
            <div class="flex items-center gap-3">
              <span class="text-2xl">💡</span>
              <div>
                <strong class="text-emerald-400 text-xs uppercase tracking-wider block font-bold">
                  Hurdle 52 Active: "Change the Teaching, Not the Words"
                </strong>
                <span class="text-[11px] text-slate-300">
                  Because code and call stack explanations can cause cognitive friction, we switched strategies completely to intuitive physical objects and games!
                </span>
              </div>
            </div>
            <button id="btn-back-to-standard-banner" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition">
              Return to Code Lecture ➔
            </button>
          </div>
        ` : ''}

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
                      ${lesson.videoAvatar.includes('Ada') ? '👩‍🏫' : lesson.videoAvatar.includes('Maya') ? '🎨' : lesson.videoAvatar.includes('Ben') ? '🛠️' : lesson.videoAvatar.includes('Sam') ? '🃏' : '👨‍🏫'}
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

                <!-- Animated Canvas Video Player -->
                <canvas id="lesson-video-canvas" width="800" height="380" class="w-full" style="display:block; background:#0f172a; border-radius:8px; aspect-ratio:16/9; max-height:380px;"></canvas>

                <!-- Audio Waveform (shown when playing) -->
                <div id="audio-waveform-box" class="hidden flex items-center justify-center gap-1.5 h-6 mt-2">
                  <span class="w-1 bg-cyan-400 rounded-full animate-pulse h-3"></span>
                  <span class="w-1 bg-cyan-400 rounded-full animate-pulse h-6"></span>
                  <span class="w-1 bg-indigo-400 rounded-full animate-pulse h-4"></span>
                  <span class="w-1 bg-indigo-400 rounded-full animate-pulse h-5"></span>
                  <span class="w-1 bg-orange-400 rounded-full animate-pulse h-3"></span>
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
                    ${lesson.questions['q2'] ? `
                      <button id="btn-trigger-cp2" class="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 rounded flex items-center gap-1">
                        <span>📍</span> Test Checkpoint 2
                      </button>
                    ` : ''}
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

    // Checkpoint jump triggers — resolve first checkpoint key dynamically
    const lesson = this.lessons[this.currentLessonIndex];
    const qKeys = Object.keys(lesson.questions);
    document.getElementById('btn-trigger-cp1')?.addEventListener('click', () => {
      this.triggerCheckpoint(qKeys[0] || 'q1');
    });
    document.getElementById('btn-trigger-cp2')?.addEventListener('click', () => {
      this.triggerCheckpoint(qKeys[1] || 'q2');
    });

    // Start Re-teaching button
    document.getElementById('btn-start-reteach')?.addEventListener('click', () => {
      this.startTargetedReteaching();
    });

    // Hurdle 52: Strategy Switch Buttons
    document.getElementById('btn-switch-strategy-toggle')?.addEventListener('click', () => {
      this.switchStrategy();
    });
    document.getElementById('btn-back-to-standard-banner')?.addEventListener('click', () => {
      this.switchToStandardLesson();
    });

    // Initialize Canvas Video Engine after DOM is ready
    if (window.CanvasVideoEngine) {
      this.videoEngine = new CanvasVideoEngine('lesson-video-canvas');
      // Draw the title/idle frame immediately
      const currentLesson = this.lessons[this.currentLessonIndex];
      const initialSub = (currentLesson.narration && currentLesson.narration[0]) || currentLesson.timeline[0]?.slideText || currentLesson.title;
      this.videoEngine.setSubtitle(initialSub);
      this.videoEngine.start(currentLesson.id, 0);
      this.videoEngine.stop(); // pause immediately — shows idle frame with subtitle
    }

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
      if (this.videoEngine) this.videoEngine.resize();
    });
  }

  // Hurdle 52: "Change the Teaching, Not the Words" — Switch to paired simpler or standard lesson
  switchStrategy() {
    const lesson = this.lessons[this.currentLessonIndex];
    if (lesson.strategyType === 'SIMPLIFIED') {
      this.switchToStandardLesson();
    } else {
      this.switchToSimplerLesson();
    }
  }

  switchToSimplerLesson() {
    const lesson = this.lessons[this.currentLessonIndex];
    const simplerIndex = this.lessons.findIndex(l => l.id === lesson.pairedSimplerId);
    if (simplerIndex === -1) return;
    this.stopSpeaking();
    this.currentLessonIndex = simplerIndex;
    this.currentTimeSec = 0;
    this.isPlaying = false;
    this.answers = {};
    this.diagnosticReport = null;
    this.activeReteach = null;
    if (this.animationTimer) clearInterval(this.animationTimer);
    if (this.redirectTimer) clearInterval(this.redirectTimer);
    this.render();
    // Auto-narrate the switch rationale
    setTimeout(() => {
      const simplerLesson = this.lessons[this.currentLessonIndex];
      if (this.voiceEnabled) {
        this.speakText(`Switching to a simpler visual strategy. ${simplerLesson.narration[0]}`);
      }
    }, 400);
  }

  switchToStandardLesson() {
    const lesson = this.lessons[this.currentLessonIndex];
    const standardIndex = this.lessons.findIndex(l => l.id === lesson.pairedStandardId);
    if (standardIndex === -1) return;
    this.stopSpeaking();
    this.currentLessonIndex = standardIndex;
    this.currentTimeSec = 0;
    this.isPlaying = false;
    this.answers = {};
    this.diagnosticReport = null;
    this.activeReteach = null;
    if (this.animationTimer) clearInterval(this.animationTimer);
    if (this.redirectTimer) clearInterval(this.redirectTimer);
    this.render();
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

    // Start canvas video animation
    if (this.videoEngine) {
      this.videoEngine.start(lesson.id, this.currentTimeSec);
    }

    // Resolve initial narration text
    const initialStep = lesson.timeline.find(t => !t.isCheckpoint && this.currentTimeSec >= t.time);
    const initialText = (lesson.narration && lesson.narration[0]) || (initialStep && initialStep.slideText) || lesson.title;

    // Narrate starting chapter if at beginning
    if (this.currentTimeSec === 0) {
      if (this.videoEngine) this.videoEngine.setSubtitle(initialText);
      if (this.voiceEnabled) this.speakText(initialText);
    }

    // Timer loop for video progress — checkpoint keys are dynamic per lesson
    const qKeys = Object.keys(lesson.questions);
    const cp1Key = qKeys[0] || 'q1';
    const cp2Key = qKeys[1] || null;
    const cp1Timeline = lesson.timeline.find(t => t.isCheckpoint && t.checkpointId === cp1Key);
    const cp2Timeline = lesson.timeline.find(t => t.isCheckpoint && t.checkpointId === cp2Key);
    const cp1Time = cp1Timeline ? cp1Timeline.time : 40;
    const cp2Time = cp2Timeline ? cp2Timeline.time : 75;

    if (this.animationTimer) clearInterval(this.animationTimer);
    this.animationTimer = setInterval(() => {
      this.currentTimeSec += 1;
      this.updateVideoProgress();

      // Check for chapter narration triggers in the timeline
      const currentStep = lesson.timeline.find(t => t.time === this.currentTimeSec);
      if (currentStep && !currentStep.isCheckpoint) {
        const nonCheckpointSteps = lesson.timeline.filter(t => !t.isCheckpoint);
        const stepIdx = nonCheckpointSteps.indexOf(currentStep);
        const textToNarrate = (lesson.narration && lesson.narration[stepIdx]) || currentStep.slideText || currentStep.title;
        if (textToNarrate) {
          if (this.videoEngine) this.videoEngine.setSubtitle(textToNarrate);
          if (this.voiceEnabled) this.speakText(textToNarrate);
        }
      }

      // Sync canvas video engine to current time
      if (this.videoEngine) this.videoEngine.seekTo(this.currentTimeSec);

      // Trigger checkpoints at their configured timeline positions
      if (this.currentTimeSec === cp1Time && !this.answers[cp1Key]) {
        this.pause();
        this.triggerCheckpoint(cp1Key);
      } else if (cp2Key && this.currentTimeSec === cp2Time && !this.answers[cp2Key]) {
        this.pause();
        this.triggerCheckpoint(cp2Key);
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
    if (this.videoEngine) this.videoEngine.stop();

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
    if (this.videoEngine) this.videoEngine.seekTo(0);
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

    if (this.videoEngine) {
      this.videoEngine.setSubtitle(`📍 Checkpoint Question: ${questionData.title} — ${questionData.question}`);
    }

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
    const currentLesson = this.lessons[this.currentLessonIndex];
    const hasSimplerVersion = !!currentLesson.pairedSimplerId;

    const feedbackEl = document.getElementById('checkpoint-feedback');
    const resumeBtn = document.getElementById('btn-resume-video');
    const skipBtn = document.getElementById('btn-skip-checkpoint');

    if (feedbackEl) {
      feedbackEl.classList.remove('hidden');
      if (isCorrect) {
        feedbackEl.className = 'p-3 rounded-lg text-xs bg-emerald-950/80 border border-emerald-600 text-emerald-200 animate-fadeIn';
        feedbackEl.innerHTML = `🎉 <strong>Correct!</strong> Great job! You properly understand the ${questionData.gapConcept}.`;
        if (this.voiceEnabled) this.speakText("Correct answer! Excellent comprehension.");
      } else {
        // ── HURDLE 52: Wrong answer → Show Simpler Lesson Redirect Panel ──
        if (this.voiceEnabled) {
          this.speakText(`That wasn't quite right. Don't worry! I will now switch to a much simpler visual explanation designed specifically for this concept. No code required.`);
        }

        const simplerLesson = hasSimplerVersion
          ? this.lessons.find(l => l.id === currentLesson.pairedSimplerId)
          : null;

        if (hasSimplerVersion && simplerLesson) {
          // Show redirect countdown banner
          feedbackEl.className = 'rounded-xl text-xs space-y-3 bg-transparent border-0 p-0 animate-fadeIn';
          feedbackEl.innerHTML = `
            <div class="p-3.5 bg-red-950/80 border border-red-700 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">⚠️</span>
                <div>
                  <div class="font-bold text-red-300">Misconception detected: <em>${questionData.gapConcept}</em></div>
                  <div class="text-slate-300 text-[11px]">This concept needs a different teaching approach.</div>
                </div>
              </div>
            </div>
            <div class="p-3.5 bg-emerald-950/90 border-2 border-emerald-600 rounded-xl shadow-lg space-y-3">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">🔄</span>
                <div>
                  <div class="font-bold text-emerald-300 text-sm">Hurdle 52: Switching Teaching Strategy</div>
                  <div class="text-[11px] text-slate-300">Redirecting to: <strong class="text-white">${simplerLesson.title}</strong></div>
                  <div class="text-[11px] text-amber-300">${simplerLesson.strategyBadge}</div>
                </div>
              </div>
              <p class="text-[11px] text-slate-300 leading-relaxed">
                Instead of code and memory frames, we will use <strong class="text-white">${simplerLesson.subtitle}</strong> — a completely fresh way to understand the same idea.
              </p>
              <div class="flex items-center justify-between pt-1 border-t border-emerald-800/60">
                <div class="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <span>Auto-switching in</span>
                  <span id="redirect-countdown-num" class="font-mono text-white bg-emerald-700 px-2 py-0.5 rounded-lg shadow">4</span>
                  <span>seconds...</span>
                </div>
                <button id="btn-switch-now" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg transition flex items-center gap-1.5">
                  <span>⚡</span> Switch Now
                </button>
              </div>
            </div>
          `;

          // Wire immediate switch button
          document.getElementById('btn-switch-now')?.addEventListener('click', () => {
            if (this.redirectTimer) clearInterval(this.redirectTimer);
            this.switchToSimplerLesson();
          });

          // Auto-countdown and redirect
          this.redirectCountdown = 4;
          if (this.redirectTimer) clearInterval(this.redirectTimer);
          this.redirectTimer = setInterval(() => {
            this.redirectCountdown -= 1;
            const countEl = document.getElementById('redirect-countdown-num');
            if (countEl) countEl.textContent = this.redirectCountdown;
            if (this.redirectCountdown <= 0) {
              clearInterval(this.redirectTimer);
              this.switchToSimplerLesson();
            }
          }, 1000);

          // Hide the skip/resume buttons during redirect phase
          if (skipBtn) skipBtn.classList.add('hidden');
          if (resumeBtn) resumeBtn.classList.add('hidden');
          return; // Don't show normal resume button when redirecting
        } else {
          // No simpler version available — show standard re-teach message
          feedbackEl.className = 'p-3 rounded-lg text-xs bg-red-950/80 border border-red-600 text-red-200 animate-fadeIn';
          feedbackEl.innerHTML = `⚠️ <strong>Not quite!</strong> Misconception detected regarding <em>${questionData.gapConcept}</em>. The AI tutor will re-teach this exact topic after the lecture!`;
        }
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
    if (!('speechSynthesis' in window) || !this.voiceEnabled || !text) return;

    if (this.videoEngine) {
      this.videoEngine.setSubtitle(text);
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    // Clean text of emojis / symbols for cleaner SpeechSynthesis pronunciation
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🐍🪆❌✅]/gu, '').trim();
    if (!cleanText) return;

    // Split into clear sentence-sized chunks so each stays under 6-8 seconds
    const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    let chunkIndex = 0;

    const speakChunk = () => {
      if (chunkIndex >= sentences.length || !this.voiceEnabled) {
        const badge = document.getElementById('avatar-speaker-badge');
        if (badge) badge.classList.remove('ring-4', 'ring-cyan-400', 'animate-pulse');
        return;
      }

      const chunk = sentences[chunkIndex].trim();
      if (!chunk) {
        chunkIndex++;
        speakChunk();
        return;
      }

      const utt = new SpeechSynthesisUtterance(chunk);
      utt.rate = 1.0;
      utt.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) {
        const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('David')));
        if (preferred) utt.voice = preferred;
      }

      utt.onstart = () => {
        const badge = document.getElementById('avatar-speaker-badge');
        if (badge) badge.classList.add('ring-4', 'ring-cyan-400', 'animate-pulse');
        const waveform = document.getElementById('audio-waveform-box');
        if (waveform) waveform.classList.remove('hidden');
      };

      utt.onend = () => {
        chunkIndex++;
        speakChunk();
      };

      utt.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        chunkIndex++;
        speakChunk();
      };

      try {
        window.speechSynthesis.speak(utt);
      } catch (err) {}
    };

    // Small delay ensures previous cancellation completed in browser audio layer
    setTimeout(speakChunk, 60);
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
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

