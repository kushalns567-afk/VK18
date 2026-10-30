// ==============================================================================
// CANVAS ANIMATED VIDEO ENGINE — Full animated lecture "video" renderer
// Produces real-time animated video on HTML5 Canvas: code typing, diagrams,
// bouncing objects, colour transitions — no video files needed.
// ==============================================================================

class CanvasVideoEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.rafId = null;
    this.startTime = null;
    this.pausedAt = 0;
    this.isRunning = false;
    this.currentScene = null;
    this.sceneData = null;
    this.tick = 0;
    this.avatarMouth = 0;
    this.avatarBlink = false;
    this.blinkTimer = 0;
    this.particles = [];
    this.typedChars = 0;
    this.lastTypeTick = 0;
    this.typeSpeed = 2; // chars per frame
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    this.canvas.width = rect ? rect.width : 720;
    this.canvas.height = 380;
  }

  // ── SCENE DEFINITIONS per lesson id ──────────────────────────────────────
  getScenesForLesson(lessonId, timeSec) {
    // Returns scene config for a given time point
    const scenes = this.getLessonScenes(lessonId);
    let active = scenes[0];
    for (const s of scenes) {
      if (timeSec >= s.startSec) active = s;
    }
    return active;
  }

  getLessonScenes(lessonId) {
    // Each lesson has animated "scenes" tied to timeline seconds
    const base = {
      recursion: [
        { startSec: 0,  type: 'code_intro',   title: 'What is Recursion?', code: ['def factorial(n):', '    return n * factorial(n-1)', '', '# ⚠️  No base case!'], colors: ['#38BDF8','#F59E0B','#94A3B8','#EF4444'], analogy: '🪆 Russian Dolls', bg: '#0f172a' },
        { startSec: 20, type: 'stack_diagram', title: 'Call Stack Growing', frames: ['factorial(4)','factorial(3)','factorial(2)','factorial(1)'], bg: '#0f172a' },
        { startSec: 55, type: 'code_fix',      title: 'The Base Case Fix!', code: ['def factorial(n):', '    if n <= 1:', '        return 1  ✅ Base Case!', '    return n * factorial(n-1)'], colors: ['#38BDF8','#4ADE80','#4ADE80','#F59E0B'], bg: '#022c22' },
        { startSec: 85, type: 'summary',       title: 'Summary', points: ['1️⃣  Base Case → STOPS recursion', '2️⃣  Recursive Step → reduces n', '3️⃣  Unwinding → multiplies back up'], bg: '#1e1b4b' }
      ],
      py_variables: [
        { startSec: 0,  type: 'jars',          title: 'Python Data Types', jars: [{ label:'x = 42', type:'int', color:'#38BDF8', icon:'🔢' },{ label:'pi = 3.14', type:'float', color:'#A78BFA', icon:'🔣' },{ label:"name='Alice'", type:'str', color:'#F59E0B', icon:'📝' },{ label:'ok = True', type:'bool', color:'#4ADE80', icon:'💡' }], bg: '#0f172a' },
        { startSec: 25, type: 'code_intro',    title: 'Variables in Action', code: ['x = 10        # int', 'price = 9.99  # float', 'name = "Alice"  # str', 'active = True # bool', '', 'print(type(x)) # <class int>'], colors: ['#38BDF8','#A78BFA','#F59E0B','#4ADE80','#94A3B8','#E2E8F0'], bg: '#0f172a' },
        { startSec: 52, type: 'code_fix',      title: 'Type Conversion', code: ['age_str = "25"', 'age_int = int(age_str)', 'score = float("98.5")', '', 'print(age_int + 1)  # 26 ✅'], colors: ['#F59E0B','#38BDF8','#A78BFA','#94A3B8','#4ADE80'], bg: '#022c22' }
      ],
      py_conditions: [
        { startSec: 0,  type: 'traffic_light', title: 'if / elif / else', lights: [{ label:'if score >= 90', color:'#EF4444', state:'RED',   text:'STOP → A Grade' },{ label:'elif score >= 70', color:'#F59E0B', state:'YELLOW', text:'SLOW → B Grade' },{ label:'else', color:'#4ADE80', state:'GREEN', text:'GO → C Grade' }], bg: '#0f172a' },
        { startSec: 22, type: 'code_intro',    title: 'Python Conditions', code: ['score = 85', '', 'if score >= 90:', '    print("A Grade")  # skipped', 'elif score >= 70:',  '    print("B Grade")  # ✅ runs!', 'else:', '    print("C Grade")  # skipped'], colors: ['#38BDF8','#94A3B8','#EF4444','#94A3B8','#F59E0B','#4ADE80','#A78BFA','#94A3B8'], bg: '#0f172a' },
        { startSec: 58, type: 'code_fix',      title: 'Indentation Matters!', code: ['if True:', '    print("Correct ✅")  # 4 spaces', 'print("No indent = runs always")', '', '# IndentationError example:', 'if True:', 'print("CRASH! ❌")  # missing indent'], colors: ['#38BDF8','#4ADE80','#F59E0B','#94A3B8','#EF4444','#38BDF8','#EF4444'], bg: '#1e1b4b' }
      ],
      py_loops: [
        { startSec: 0,  type: 'conveyor',      title: 'The for Loop Conveyor Belt', boxes: ['0','1','2','3','4'], label:'range(5)', bg: '#0f172a' },
        { startSec: 20, type: 'code_intro',    title: 'for Loops in Python', code: ['# Count 0 to 4', 'for i in range(5):', '    print(i)', '', '# Loop over a list', 'fruits = ["apple","banana","cherry"]', 'for fruit in fruits:', '    print(fruit)'], colors: ['#94A3B8','#38BDF8','#4ADE80','#94A3B8','#94A3B8','#F59E0B','#38BDF8','#4ADE80'], bg: '#0f172a' },
        { startSec: 55, type: 'code_fix',      title: 'range() Cheat Sheet', code: ['range(5)       → 0,1,2,3,4', 'range(1, 6)    → 1,2,3,4,5', 'range(0,10,2)  → 0,2,4,6,8', '', 'len([10,20,30]) → 3  (3 items)'], colors: ['#38BDF8','#A78BFA','#F59E0B','#94A3B8','#4ADE80'], bg: '#022c22' }
      ],
      py_functions: [
        { startSec: 0,  type: 'vending',       title: 'Functions = Vending Machines', coins:'3 + 5', result:'8', bg: '#0f172a' },
        { startSec: 20, type: 'code_intro',    title: 'def, Parameters & return', code: ['def add(a, b):      # parameters', '    result = a + b', '    return result    # ✅ return!', '', 'total = add(3, 5)   # arguments', 'print(total)        # 8'], colors: ['#38BDF8','#A78BFA','#4ADE80','#94A3B8','#F59E0B','#4ADE80'], bg: '#0f172a' },
        { startSec: 58, type: 'comparison',    title: 'return vs print', left:{ label:'print() only', code:'def show(n):\n    print(n*2)', warning:'result = None!', color:'#EF4444' }, right:{ label:'return ✅', code:'def double(n):\n    return n*2', success:'result = 10 ✅', color:'#4ADE80' }, bg: '#022c22' }
      ],
      py_lists: [
        { startSec: 0,  type: 'lockers',       title: 'List = Numbered Lockers', items:['apple','banana','cherry','date','elderberry'], highlight: 0, bg: '#0f172a' },
        { startSec: 20, type: 'code_intro',    title: 'List Indexing', code: ['fruits = ["apple","banana","cherry"]', '', 'fruits[0]   # "apple"', 'fruits[-1]  # "cherry" (last!)', 'fruits[-2]  # "banana"', '', 'fruits.append("date")', 'fruits.pop()    # removes "date"'], colors: ['#F59E0B','#94A3B8','#38BDF8','#4ADE80','#A78BFA','#94A3B8','#F59E0B','#EF4444'], bg: '#0f172a' },
        { startSec: 52, type: 'lockers',       title: 'Negative Index = Skeleton Key', items:['apple','banana','cherry','date','elderberry'], highlight: -1, bg: '#1e1b4b' }
      ],
      py_dicts: [
        { startSec: 0,  type: 'phonebook',     title: 'Dictionary = Phone Book', entries:[{name:'Alice',num:'555-1234'},{name:'Bob',num:'555-5678'},{name:'Charlie',num:'???'}], bg: '#0f172a' },
        { startSec: 22, type: 'code_intro',    title: 'Dictionary Access', code: ['person = {', '    "name": "Alice",', '    "age": 25,', '    "city": "London"', '}', '', 'person["name"]  # "Alice" ✅', 'person["job"]   # KeyError! ❌'], colors: ['#F59E0B','#38BDF8','#A78BFA','#4ADE80','#F59E0B','#94A3B8','#4ADE80','#EF4444'], bg: '#0f172a' },
        { startSec: 56, type: 'code_fix',      title: 'Safe Key Access (.get)', code: ['# SAFE — no crash:', 'job = person.get("job", "unknown")', '# Returns "unknown" if key missing ✅', '', '# Loop all entries:', 'for key, val in person.items():', '    print(f"{key}: {val}")'], colors: ['#94A3B8','#4ADE80','#4ADE80','#94A3B8','#94A3B8','#38BDF8','#E2E8F0'], bg: '#022c22' }
      ],
      py_classes: [
        { startSec: 0,  type: 'blueprint',     title: 'Class = Blueprint', cutter:'🍪 Cookie Cutter (Class Dog)', cookies:['rex 🐕','buddy 🐶','luna 🐩'], bg: '#0f172a' },
        { startSec: 25, type: 'code_intro',    title: '__init__ & self', code: ['class Dog:', '    def __init__(self, name):', '        self.name = name  # attribute', '', '    def bark(self):', '        print(f"{self.name} says: Woof!")', '', 'rex = Dog("Rex")', 'rex.bark()  # Rex says: Woof!'], colors: ['#38BDF8','#A78BFA','#F59E0B','#94A3B8','#38BDF8','#4ADE80','#94A3B8','#F59E0B','#4ADE80'], bg: '#0f172a' },
        { startSec: 65, type: 'code_fix',      title: 'Each Object is Independent', code: ['rex = Dog("Rex")', 'buddy = Dog("Buddy")', '', 'rex.name = "MAX"  # changes rex only', 'print(buddy.name)  # "Buddy" ✅'], colors: ['#38BDF8','#A78BFA','#94A3B8','#F59E0B','#4ADE80'], bg: '#022c22' }
      ],
      py_exceptions: [
        { startSec: 0,  type: 'safetynet',     title: 'try / except Safety Net', tightrope:true, bg: '#0f172a' },
        { startSec: 20, type: 'code_intro',    title: 'try / except Structure', code: ['try:', '    x = int(input("Enter number: "))', '    result = 10 / x', '    print(result)', 'except ZeroDivisionError:', '    print("Cannot divide by 0! ❌")', 'except ValueError:', '    print("Please enter a number! ❌")', 'finally:', '    print("Done! ✅ (always runs)")'], colors: ['#38BDF8','#F59E0B','#A78BFA','#4ADE80','#EF4444','#EF4444','#EF4444','#EF4444','#94A3B8','#4ADE80'], bg: '#0f172a' },
        { startSec: 55, type: 'code_fix',      title: 'finally Always Runs', code: ['# finally = guaranteed cleanup', 'try:', '    f = open("data.txt", "r")', '    content = f.read()', 'except FileNotFoundError:', '    print("File missing ❌")', 'finally:', '    f.close()  # ALWAYS closes file ✅'], colors: ['#94A3B8','#38BDF8','#F59E0B','#4ADE80','#EF4444','#EF4444','#94A3B8','#4ADE80'], bg: '#022c22' }
      ],
      py_fileio: [
        { startSec: 0,  type: 'cabinet',       title: 'Files = Filing Cabinet', modes:[{m:'r',label:'READ',color:'#38BDF8',icon:'📖'},{m:'w',label:'WRITE (⚠️ WIPES!)',color:'#EF4444',icon:'🗑️'},{m:'a',label:'APPEND',color:'#4ADE80',icon:'➕'}], bg: '#0f172a' },
        { startSec: 20, type: 'code_intro',    title: 'Reading & Writing Files', code: ['# WRITE (overwrites existing!)', 'with open("notes.txt", "w") as f:', '    f.write("Hello World!\\n")', '', '# READ', 'with open("notes.txt", "r") as f:', '    content = f.read()', '    print(content)  # Hello World!'], colors: ['#94A3B8','#EF4444','#F59E0B','#94A3B8','#94A3B8','#38BDF8','#A78BFA','#4ADE80'], bg: '#0f172a' },
        { startSec: 55, type: 'code_fix',      title: 'with = Auto-Close ✅', code: ['# with → auto-closes safely:', 'with open("data.txt", "a") as f:', '    f.write("New line\\n") # append', '', '# NEVER forget to close otherwise:', 'f = open("data.txt", "r")', '# ... if crash here, file stays open! ❌'], colors: ['#94A3B8','#4ADE80','#F59E0B','#94A3B8','#94A3B8','#EF4444','#EF4444'], bg: '#022c22' }
      ],
      // Simplified tracks use visual analogy scenes
      recursion_simplified: [
        { startSec: 0,  type: 'dolls_anim',    title: 'Russian Nesting Dolls', count: 5, bg: '#0f172a' },
        { startSec: 18, type: 'summary',        title: 'Mapping Dolls → Code', points: ['🪆 Opening doll 4 = factorial(4)', '🪆 Opening doll 3 = factorial(3)', '🪆 Opening doll 2 = factorial(2)', '🔴 Solid baby doll = Base Case!', '✅  return 1 → stops the opening'], bg: '#1e1b4b' }
      ],
      py_variables_simple: [
        { startSec: 0,  type: 'jars',          title: 'Kitchen Jars (Simpler)', jars: [{ label:'sugar: 42', type:'int (whole)', color:'#38BDF8', icon:'🫙' },{ label:'honey: 3.14', type:'float (decimal)', color:'#F59E0B', icon:'🍯' },{ label:'tag: "Alice"', type:'str (text)', color:'#A78BFA', icon:'🏷️' },{ label:'switch: True', type:'bool', color:'#4ADE80', icon:'💡' }], bg: '#0f172a' },
        { startSec: 20, type: 'summary',        title: 'Label = Variable Name', points: ['🫙 x = 10 → "x" label on the sugar jar', '🏷️ name = "Alice" → label on the tag jar', '💡 active = True → label on the switch jar', '✅ Python picks the right jar automatically!'], bg: '#022c22' }
      ]
    };
    // For lessons without defined scenes, generate a default code scene
    if (!base[lessonId]) {
      base[lessonId] = [{ startSec: 0, type: 'code_intro', title: 'Interactive Lesson', code: ['# Python Lesson', '# Watch and learn!', 'print("Ready to code!")'], colors: ['#94A3B8','#94A3B8','#4ADE80'], bg: '#0f172a' }];
    }
    return base[lessonId];
  }

  // ── MAIN RENDER LOOP ──────────────────────────────────────────────────────
  start(lessonId, timeSec) {
    this.lessonId = lessonId;
    this.isRunning = true;
    this.startTime = performance.now() - (timeSec * 1000);
    this.tick = 0;
    this.typedChars = 0;
    this.particles = [];
    this.resize();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._frame();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  seekTo(timeSec) {
    this.startTime = performance.now() - (timeSec * 1000);
    this.typedChars = 0;
  }

  _frame() {
    if (!this.isRunning || !this.ctx) return;
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.tick++;
    this.blinkTimer++;
    if (this.blinkTimer > 180) { this.avatarBlink = true; if (this.blinkTimer > 190) { this.avatarBlink = false; this.blinkTimer = 0; } }

    const scene = this.getScenesForLesson(this.lessonId, elapsed);
    this._renderScene(scene, elapsed);

    this.rafId = requestAnimationFrame(() => this._frame());
  }

  _renderScene(scene, t) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Background
    ctx.fillStyle = scene.bg || '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Render by scene type
    switch (scene.type) {
      case 'code_intro':
      case 'code_fix':   this._renderCodeScene(scene, t, W, H); break;
      case 'stack_diagram': this._renderStackDiagram(scene, t, W, H); break;
      case 'jars':       this._renderJars(scene, t, W, H); break;
      case 'traffic_light': this._renderTrafficLight(scene, t, W, H); break;
      case 'conveyor':   this._renderConveyor(scene, t, W, H); break;
      case 'vending':    this._renderVending(scene, t, W, H); break;
      case 'lockers':    this._renderLockers(scene, t, W, H); break;
      case 'phonebook':  this._renderPhonebook(scene, t, W, H); break;
      case 'blueprint':  this._renderBlueprint(scene, t, W, H); break;
      case 'safetynet':  this._renderSafetyNet(scene, t, W, H); break;
      case 'cabinet':    this._renderCabinet(scene, t, W, H); break;
      case 'comparison': this._renderComparison(scene, t, W, H); break;
      case 'dolls_anim': this._renderDolls(scene, t, W, H); break;
      case 'summary':    this._renderSummary(scene, t, W, H); break;
      default:           this._renderCodeScene(scene, t, W, H);
    }

    // Floating particles
    this._updateParticles(ctx, W, H, scene.bg);

    // Talking avatar bottom-left
    this._renderAvatar(ctx, W, H);

    // Top title bar
    this._renderTitleBar(ctx, scene.title, W);

    // Scanline overlay (CRT feel)
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, y, W, 2);
    }
  }

  // ── CODE TYPING SCENE ────────────────────────────────────────────────────
  _renderCodeScene(scene, t, W, H) {
    const ctx = this.ctx;
    const lines = scene.code || [];
    const colors = scene.colors || [];
    const lineH = 22;
    const startX = Math.floor(W * 0.08);
    const startY = 90;
    const boxH = lines.length * lineH + 30;
    const boxW = Math.floor(W * 0.84);

    // Code editor box
    this._roundRect(ctx, startX - 10, startY - 15, boxW, boxH, 10, '#1e293b', '#334155', 1.5);

    // Line numbers gutter
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(startX - 10, startY - 15, 32, boxH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(startX + 22, startY - 15); ctx.lineTo(startX + 22, startY - 15 + boxH); ctx.stroke();

    const totalChars = lines.join('\n').length;
    const charsPerSec = Math.max(12, totalChars / 6);
    this.typedChars = Math.min(totalChars, Math.floor(t * charsPerSec));

    let charCount = 0;
    lines.forEach((line, i) => {
      const lineColor = colors[i] || '#E2E8F0';
      const y = startY + i * lineH;

      // Line number
      ctx.font = '11px monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(String(i + 1), startX - 6, y);

      // Code text (typed effect)
      const charsForThisLine = Math.max(0, this.typedChars - charCount);
      const displayLine = line.substring(0, charsForThisLine);
      ctx.font = '13px monospace';
      ctx.fillStyle = lineColor;
      ctx.fillText(displayLine, startX + 28, y);

      // Blinking cursor on current typing line
      if (charsForThisLine > 0 && charsForThisLine < line.length && Math.floor(t * 2) % 2 === 0) {
        const measured = ctx.measureText(displayLine).width;
        ctx.fillStyle = '#F97316';
        ctx.fillRect(startX + 28 + measured, y - 13, 2, 15);
      }

      charCount += line.length + 1;
    });

    // Spawn code particles as chars appear
    if (this.typedChars < totalChars && this.tick % 8 === 0) {
      this.particles.push({ x: startX + 120 + Math.random() * 200, y: startY + Math.random() * boxH, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 1.5, life: 40, color: colors[Math.floor(Math.random() * colors.length)] || '#38BDF8', size: 3 + Math.random() * 3 });
    }
  }

  // ── STACK DIAGRAM SCENE ──────────────────────────────────────────────────
  _renderStackDiagram(scene, t, W, H) {
    const ctx = this.ctx;
    const frames = scene.frames || [];
    const visibleFrames = Math.min(frames.length, Math.floor(t * 0.8) + 1);
    const fH = 52, fW = Math.floor(W * 0.55);
    const startX = Math.floor((W - fW) / 2);
    const baseY = H - 70;

    // Stack label
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('📚 CALL STACK (grows upward)', startX, baseY + 30);

    for (let i = 0; i < visibleFrames; i++) {
      const y = baseY - (i + 1) * (fH + 6);
      const progress = Math.min(1, (t * 0.8 - i) * 2);
      const alpha = progress;
      const isTop = i === visibleFrames - 1;

      ctx.globalAlpha = alpha;
      this._roundRect(ctx, startX, y, fW, fH, 8,
        isTop ? '#1e3a5f' : '#1e293b',
        isTop ? '#38BDF8' : '#334155', isTop ? 2 : 1);

      ctx.font = `bold 14px monospace`;
      ctx.fillStyle = isTop ? '#38BDF8' : '#94A3B8';
      ctx.fillText(`  ${frames[i]}`, startX + 14, y + 22);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = isTop ? '#F97316' : '#475569';
      ctx.fillText(isTop ? '  ▶ Currently executing...' : '  ⏳ waiting for result...', startX + 14, y + 40);
      ctx.globalAlpha = 1;
    }

    // Overflow warning when all frames visible
    if (visibleFrames >= frames.length && Math.floor(t * 2) % 2 === 0) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#EF4444';
      ctx.fillText('⚠️  Stack Overflow!  MaxCallStack Exceeded', startX, baseY - frames.length * (fH + 6) - 20);
    }
  }

  // ── JARS (Variables) ─────────────────────────────────────────────────────
  _renderJars(scene, t, W, H) {
    const ctx = this.ctx;
    const jars = scene.jars || [];
    const jarW = Math.floor((W - 60) / jars.length);
    const startX = 30;
    const jarH = 110, jarY = Math.floor(H / 2) - 30;

    jars.forEach((jar, i) => {
      const x = startX + i * jarW;
      const bounce = Math.sin(t * 2 + i * 1.2) * 6;
      const fade = Math.min(1, t - i * 0.4);
      ctx.globalAlpha = Math.max(0, fade);

      // Jar body
      this._roundRect(ctx, x + 8, jarY + bounce, jarW - 20, jarH, 14, jar.color + '33', jar.color, 2.5);

      // Icon
      ctx.font = '28px serif';
      ctx.fillText(jar.icon, x + Math.floor(jarW / 2) - 14, jarY + 42 + bounce);

      // Type label
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = jar.color;
      ctx.textAlign = 'center';
      ctx.fillText(jar.type, x + Math.floor(jarW / 2), jarY + 70 + bounce);

      // Code label below jar
      ctx.font = '10px monospace';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(jar.label, x + Math.floor(jarW / 2), jarY + jarH + 20 + bounce);

      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });
  }

  // ── TRAFFIC LIGHT ────────────────────────────────────────────────────────
  _renderTrafficLight(scene, t, W, H) {
    const ctx = this.ctx;
    const lights = scene.lights || [];
    const poleX = Math.floor(W * 0.22), poleW = 70;
    const lightR = 22;

    // Pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(poleX + Math.floor(poleW / 2) - 6, 60, 12, H - 100);

    // Housing
    this._roundRect(ctx, poleX, 60, poleW, lights.length * 68 + 20, 14, '#1e293b', '#475569', 2);

    lights.forEach((light, i) => {
      const active = Math.floor(t * 0.5) % lights.length === i || (t > 3 && i === 0);
      const cy = 100 + i * 68;
      const cx = poleX + Math.floor(poleW / 2);
      const glow = active ? 0.9 : 0.15;

      ctx.shadowBlur = active ? 25 : 0;
      ctx.shadowColor = light.color;
      ctx.beginPath();
      ctx.arc(cx, cy, lightR, 0, Math.PI * 2);
      ctx.fillStyle = light.color + (active ? 'FF' : '30');
      ctx.fill();
      ctx.strokeStyle = light.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label to the right
      const labelX = poleX + poleW + 18;
      const fade = Math.min(1, t - i * 0.8);
      ctx.globalAlpha = Math.max(0, fade);

      this._roundRect(ctx, labelX, cy - 30, Math.floor(W * 0.55), 60, 8, '#1e293b', active ? light.color : '#334155', active ? 2 : 1);
      ctx.font = `bold 12px monospace`;
      ctx.fillStyle = active ? light.color : '#64748B';
      ctx.fillText(light.label, labelX + 10, cy - 8);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = active ? '#E2E8F0' : '#475569';
      ctx.fillText(light.text, labelX + 10, cy + 14);
      ctx.globalAlpha = 1;
    });
  }

  // ── CONVEYOR BELT (Loops) ────────────────────────────────────────────────
  _renderConveyor(scene, t, W, H) {
    const ctx = this.ctx;
    const boxes = scene.boxes || ['0','1','2','3','4'];
    const beltY = Math.floor(H * 0.55), beltH = 18;
    const boxSize = 54;
    const speed = 48; // px per second
    const totalW = W + boxes.length * (boxSize + 16);

    // Belt surface
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, beltY, W, beltH);
    // Belt ridges
    for (let x = (t * speed * 0.5) % 30; x < W; x += 30) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, beltY, 4, beltH);
    }

    // Belt rollers
    [0, W - 30].forEach(rx => {
      ctx.beginPath();
      ctx.arc(rx + 15, beltY + 9, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#64748B';
      ctx.fill();
    });

    // Moving boxes
    boxes.forEach((box, i) => {
      const offset = (t * speed - i * (boxSize + 16));
      const bx = offset % (W + boxSize + 16) - (boxSize + 16);
      if (bx < -boxSize || bx > W) return;

      const atWorker = bx > W - 140 && bx < W - 90;
      this._roundRect(ctx, bx, beltY - boxSize - 4, boxSize, boxSize, 8,
        atWorker ? '#1e3a5f' : '#1e293b',
        atWorker ? '#38BDF8' : '#F59E0B', atWorker ? 2.5 : 1.5);

      ctx.font = `bold 20px monospace`;
      ctx.fillStyle = atWorker ? '#38BDF8' : '#F59E0B';
      ctx.textAlign = 'center';
      ctx.fillText(box, bx + boxSize / 2, beltY - boxSize / 2 + 8);
      ctx.textAlign = 'left';
    });

    // Worker (right side)
    ctx.font = '36px serif';
    ctx.fillText('🧑‍🏭', W - 65, beltY - 10);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('your code', W - 68, beltY - 48);

    // Label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(`for i in range(${boxes.length}):`, 20, beltY + 45);
    ctx.fillStyle = '#4ADE80';
    ctx.fillText(`    print(i)  # 0,1,2,3,4`, 20, beltY + 65);
  }

  // ── VENDING MACHINE (Functions) ──────────────────────────────────────────
  _renderVending(scene, t, W, H) {
    const ctx = this.ctx;
    const mx = Math.floor(W / 2) - 80, mw = 160, mh = 240, my = 50;

    // Machine body
    this._roundRect(ctx, mx, my, mw, mh, 16, '#1e293b', '#38BDF8', 2.5);

    // Screen
    this._roundRect(ctx, mx + 14, my + 14, mw - 28, 60, 8, '#0f172a', '#334155', 1);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'center';
    ctx.fillText('def add(a, b):', mx + mw / 2, my + 38);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#4ADE80';
    ctx.fillText('return a + b', mx + mw / 2, my + 58);

    // Coin slot
    ctx.fillStyle = '#334155';
    ctx.fillRect(mx + mw - 22, my + 80, 10, 4);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('coins in', mx + mw - 56, my + 84);

    // Animated coin
    const coinY = my + 80 + Math.max(0, Math.min(30, (t % 3 - 0.5) * 30));
    if (t % 3 < 1.5) {
      ctx.beginPath();
      ctx.arc(mx + mw - 17, coinY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.font = '8px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('3,5', mx + mw - 22, coinY + 3);
    }

    // Output slot
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(mx + 14, my + mh - 50, mw - 28, 30);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx + 14, my + mh - 50, mw - 28, 30);

    if (t > 1.5) {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#4ADE80';
      ctx.fillText(`8 ✅`, mx + mw / 2, my + mh - 30);
    }

    // Labels
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#F97316';
    ctx.fillText('Arguments: 3, 5', mx + mw / 2, my + mh + 24);
    ctx.fillStyle = '#4ADE80';
    ctx.fillText('return value: 8', mx + mw / 2, my + mh + 44);
    ctx.textAlign = 'left';
  }

  // ── LOCKERS (Lists) ───────────────────────────────────────────────────────
  _renderLockers(scene, t, W, H) {
    const ctx = this.ctx;
    const items = scene.items || [];
    const highlight = scene.highlight || 0;
    const hIdx = highlight < 0 ? items.length + highlight : highlight;
    const lw = Math.min(100, Math.floor((W - 60) / items.length));
    const startX = Math.floor((W - items.length * lw) / 2);
    const ly = 100, lh = 160;

    items.forEach((item, i) => {
      const isHL = i === hIdx;
      const fade = Math.min(1, t - i * 0.25);
      ctx.globalAlpha = Math.max(0, fade);
      const x = startX + i * lw;

      this._roundRect(ctx, x + 4, ly, lw - 8, lh, 8,
        isHL ? '#1e3a5f' : '#1e293b',
        isHL ? '#38BDF8' : '#475569', isHL ? 2.5 : 1);

      // Index label above
      ctx.font = `bold 14px monospace`;
      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'center';
      ctx.fillText(String(i), x + lw / 2, ly - 8);

      // Negative index
      ctx.font = '10px monospace';
      ctx.fillStyle = '#A78BFA';
      ctx.fillText(`-${items.length - i}`, x + lw / 2, ly - 22);

      // Handle icon
      ctx.font = '18px serif';
      ctx.fillText('🔑', x + lw / 2 - 9, ly + 30);

      // Content
      ctx.font = isHL ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillStyle = isHL ? '#38BDF8' : '#94A3B8';
      const display = item.length > 7 ? item.slice(0, 6) + '..' : item;
      ctx.fillText(display, x + lw / 2, ly + 60);

      if (isHL) {
        // Highlight glow
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#38BDF8';
        ctx.beginPath();
        ctx.arc(x + lw / 2, ly + 30, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56,189,248,0.15)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });

    // Selected item label
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'center';
    const negLabel = highlight < 0 ? `[${highlight}]` : `[${highlight}]`;
    ctx.fillText(`list${negLabel} = "${items[hIdx]}"  ✅`, W / 2, ly + lh + 36);
    ctx.textAlign = 'left';
  }

  // ── PHONE BOOK (Dicts) ───────────────────────────────────────────────────
  _renderPhonebook(scene, t, W, H) {
    const ctx = this.ctx;
    const entries = scene.entries || [];
    const bookX = Math.floor(W * 0.1), bookW = Math.floor(W * 0.8);
    const lineH = 50, startY = 80;

    // Book cover
    this._roundRect(ctx, bookX, startY - 30, bookW, entries.length * lineH + 70, 12, '#1e293b', '#F59E0B', 2);

    ctx.font = 'bold 14px serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('📖  Python Dictionary Phone Book', bookX + bookW / 2, startY - 8);
    ctx.textAlign = 'left';

    entries.forEach((e, i) => {
      const y = startY + 10 + i * lineH;
      const fade = Math.min(1, t - i * 0.5);
      ctx.globalAlpha = Math.max(0, fade);
      const isMissing = e.num === '???';

      ctx.fillStyle = isMissing ? '#EF4444' + '20' : '#ffffff08';
      ctx.fillRect(bookX + 12, y - 6, bookW - 24, lineH - 6);

      ctx.font = `bold 13px sans-serif`;
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`"${e.name}"`, bookX + 22, y + 16);
      ctx.font = '11px monospace';
      ctx.fillStyle = isMissing ? '#EF4444' : '#4ADE80';
      ctx.fillText(isMissing ? '⚠️  KeyError! Key not found' : e.num, bookX + bookW - 200, y + 16);

      ctx.globalAlpha = 1;
    });

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Access with: scores["Alice"]   NOT scores[0]', bookX + 12, startY + entries.length * lineH + 28);
  }

  // ── CLASS BLUEPRINT ───────────────────────────────────────────────────────
  _renderBlueprint(scene, t, W, H) {
    const ctx = this.ctx;
    const cookies = scene.cookies || [];
    const cutterX = Math.floor(W / 2) - 60;

    // Blueprint (cutter)
    ctx.setLineDash([6, 3]);
    this._roundRect(ctx, cutterX, 40, 120, 100, 12, 'rgba(56,189,248,0.08)', '#38BDF8', 2);
    ctx.setLineDash([]);
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', cutterX + 60, 102);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(scene.cutter, cutterX + 60, 160);

    // Arrows and cookie objects
    cookies.forEach((cookie, i) => {
      const cx = 50 + i * Math.floor((W - 100) / cookies.length);
      const cy = H - 100;
      const fade = Math.min(1, t - i * 0.5 - 0.5);
      ctx.globalAlpha = Math.max(0, fade);

      // Arrow from cutter to cookie
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(cutterX + 60, 175);
      ctx.lineTo(cx, cy - 44);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cookie
      this._roundRect(ctx, cx - 40, cy - 40, 80, 70, 10, '#1e293b', '#F59E0B', 1.5);
      ctx.font = '22px serif';
      ctx.fillText(cookie, cx, cy - 4);

      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'left';
  }

  // ── SAFETY NET (Exceptions) ──────────────────────────────────────────────
  _renderSafetyNet(scene, t, W, H) {
    const ctx = this.ctx;

    // Rope
    const ropeY = Math.floor(H * 0.28);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, ropeY);
    ctx.lineTo(W - 20, ropeY);
    ctx.stroke();

    // Net
    const netY = Math.floor(H * 0.65);
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    for (let x = 20; x < W - 20; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, netY); ctx.lineTo(x - 15, netY + 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, netY); ctx.lineTo(x + 15, netY + 60); ctx.stroke();
    }
    for (let y = 0; y <= 2; y++) {
      ctx.beginPath(); ctx.moveTo(20, netY + y * 30); ctx.lineTo(W - 20, netY + y * 30); ctx.stroke();
    }

    // Acrobat
    const bounce = t < 2 ? 0 : Math.max(netY - 50 - ropeY - 40, Math.min(netY - 50, (netY - 50) - (H * 0.4) * Math.exp(-(t - 2) * 1.5) * Math.abs(Math.sin((t - 2) * 6))));
    const acrobatY = t < 2 ? ropeY - 30 + Math.sin(t * 3) * 8 : bounce;

    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤸', W / 2, acrobatY);

    // Labels
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('try block = Tightrope', W / 2, ropeY - 14);
    ctx.fillStyle = '#4ADE80';
    ctx.fillText('except block = Safety Net', W / 2, netY - 14);

    if (t > 2) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#4ADE80';
      ctx.fillText('Caught safely! Show continues. ✅', W / 2, netY + 84);
    }
    ctx.textAlign = 'left';
  }

  // ── FILE CABINET (File I/O) ───────────────────────────────────────────────
  _renderCabinet(scene, t, W, H) {
    const ctx = this.ctx;
    const modes = scene.modes || [];
    const cabX = Math.floor(W * 0.06), cabW = 130, cabH = modes.length * 68 + 30;
    const labX = cabX + cabW + 30;

    // Cabinet body
    this._roundRect(ctx, cabX, 60, cabW, cabH, 10, '#1e293b', '#475569', 2);

    modes.forEach((mode, i) => {
      const drawerY = 80 + i * 68;
      const open = Math.floor(t * 0.6) === i && t > 0.5;
      const fade = Math.min(1, t - i * 0.5);
      ctx.globalAlpha = Math.max(0, fade);

      this._roundRect(ctx, cabX + 10, drawerY, cabW - 20, 56, 6, open ? mode.color + '22' : '#0f172a', mode.color, open ? 2 : 1);

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = mode.color;
      ctx.textAlign = 'center';
      ctx.fillText(`"${mode.m}"`, cabX + cabW / 2, drawerY + 24);
      ctx.font = '10px sans-serif';
      ctx.fillText(mode.label, cabX + cabW / 2, drawerY + 42);
      ctx.font = '20px serif';
      ctx.fillText(mode.icon, labX + 10, drawerY + 30);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'left';
      const desc = { r:'open("file","r")  → read only, safe', w:'open("file","w")  → WIPES FIRST ⚠️', a:'open("file","a")  → adds to end ✅' };
      ctx.fillText(desc[mode.m] || '', labX + 40, drawerY + 30);
      ctx.globalAlpha = 1;
    });

    ctx.textAlign = 'left';
  }

  // ── COMPARISON (return vs print) ──────────────────────────────────────────
  _renderComparison(scene, t, W, H) {
    const ctx = this.ctx;
    const { left, right } = scene;
    const hw = Math.floor(W / 2) - 20;

    [left, right].forEach((side, idx) => {
      const x = idx === 0 ? 10 : Math.floor(W / 2) + 10;
      const fade = Math.min(1, t - idx * 0.5);
      ctx.globalAlpha = Math.max(0, fade);
      this._roundRect(ctx, x, 60, hw, H - 100, 12, idx === 0 ? '#1a0a0a' : '#021a0a', side.color, 2);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = side.color;
      ctx.textAlign = 'center';
      ctx.fillText(side.label, x + hw / 2, 88);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#E2E8F0';
      side.code.split('\n').forEach((line, j) => ctx.fillText(line, x + hw / 2, 115 + j * 20));
      const resultLabel = idx === 0 ? (side.warning || '') : (side.success || '');
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = side.color;
      ctx.fillText(resultLabel, x + hw / 2, H - 60);
      ctx.globalAlpha = 1;
    });

    // Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.floor(W / 2), 60);
    ctx.lineTo(Math.floor(W / 2), H - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'left';
  }

  // ── DOLLS ANIMATION ───────────────────────────────────────────────────────
  _renderDolls(scene, t, W, H) {
    const ctx = this.ctx;
    const count = scene.count || 5;
    const cx = Math.floor(W / 2);
    const baseY = H - 60;
    const colors = ['#38BDF8','#A78BFA','#F59E0B','#4ADE80','#EF4444'];

    for (let i = 0; i < count; i++) {
      const visible = i <= Math.floor(t * 0.7);
      if (!visible) continue;
      const size = 80 - i * 12;
      const y = baseY - i * 22;
      const bounce = Math.sin(t * 2 + i * 0.5) * 4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[i];
      ctx.beginPath();
      ctx.ellipse(cx, y + bounce, size * 0.45, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors[i] + '33';
      ctx.fill();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = `${14 - i}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(i === count - 1 ? '🔴 STOP' : `🪆 level ${i + 1}`, cx, y + bounce + 6);
      ctx.font = `bold ${11 - i}px monospace`;
      ctx.fillStyle = colors[i];
      ctx.fillText(`factorial(${count - i})`, cx, y + bounce - size * 0.35);
    }
    ctx.textAlign = 'left';
  }

  // ── SUMMARY SCREEN ────────────────────────────────────────────────────────
  _renderSummary(scene, t, W, H) {
    const ctx = this.ctx;
    const points = scene.points || [];
    const boxX = Math.floor(W * 0.08), boxW = Math.floor(W * 0.84);

    this._roundRect(ctx, boxX, 65, boxW, points.length * 44 + 30, 14, '#0f172a', '#334155', 1.5);

    points.forEach((pt, i) => {
      const fade = Math.min(1, t * 1.2 - i * 0.5);
      ctx.globalAlpha = Math.max(0, fade);
      const y = 100 + i * 44;
      // Bullet line
      ctx.fillStyle = i % 2 === 0 ? 'rgba(56,189,248,0.06)' : 'transparent';
      ctx.fillRect(boxX, y - 16, boxW, 38);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(pt, boxX + 18, y + 8);
      ctx.globalAlpha = 1;
    });
  }

  // ── AVATAR ───────────────────────────────────────────────────────────────
  _renderAvatar(ctx, W, H) {
    const ax = 14, ay = H - 72, ar = 28;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#38BDF8';
    ctx.beginPath();
    ctx.arc(ax + ar, ay + ar, ar, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a5f';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(ax + ar - 8, ay + ar - 6, 5, this.avatarBlink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax + ar + 8, ay + ar - 6, 5, this.avatarBlink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(ax + ar - 8, ay + ar - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ax + ar + 8, ay + ar - 6, 2.5, 0, Math.PI * 2); ctx.fill();

    // Mouth (animates with speech)
    const mouthH = 3 + Math.abs(Math.sin(this.tick * 0.18)) * 6;
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(ax + ar, ay + ar + 10, 8, mouthH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('AI Tutor', ax, ay + ar * 2 + 8);
  }

  // ── TITLE BAR ────────────────────────────────────────────────────────────
  _renderTitleBar(ctx, title, W) {
    ctx.fillStyle = 'rgba(15,23,42,0.88)';
    ctx.fillRect(0, 0, W, 46);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(W, 46); ctx.stroke();

    // Dot indicators
    [[10, '#EF4444'], [28, '#F59E0B'], [46, '#4ADE80']].forEach(([x, c]) => {
      ctx.beginPath(); ctx.arc(x, 22, 7, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
    });

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.textAlign = 'center';
    ctx.fillText(title || '', W / 2, 27);
    ctx.textAlign = 'left';
  }

  // ── PARTICLES ────────────────────────────────────────────────────────────
  _updateParticles(ctx, W, H, bg) {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      ctx.globalAlpha = p.life / 40;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  // ── UTILITY: Rounded Rect ─────────────────────────────────────────────────
  _roundRect(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
}

window.CanvasVideoEngine = CanvasVideoEngine;

