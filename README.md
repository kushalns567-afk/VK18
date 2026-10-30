# Real-Time Confusion-Aware Interactive Tutor 🚀

**Hackathon:** AFTERHOURS 1.0 — Code Beyond the Clock  
**Organizers:** AWS Student Builder Group DBIT • Don Bosco Institute of Technology, Bengaluru  
**Theme 06:** Computational Creativity & Human-AI Interaction  
**Team Name:** VK 18  
**Team ID:** AH-52  
**Team Members:**
- **Madhu N**
- **Nageshwari BS**
- **Pavan K**
- **Kushal NS**

---

## 🌟 Overview & Problem Statement (Slide 2 & 3)

Current e-learning platforms for programming and STEM present rigid, static content that cannot sense learner struggle in real time. Students enter silent cognitive overload, repeatedly deleting code or staring in paralysis, only to fail assessments or abandon courses (80%+ drop-out rate).

### The Solution:
A **privacy-preserving, telemetry-instrumented workspace** that calculates real-time **Cognitive Friction (0–100%)** from typing cadence, burst deletions, idle dwell, and error loops. When unproductive struggle is diagnosed with sub-300ms latency, the **Socratic AI Tutor** intervenes dynamically with **relatable visual analogies** (Theme 06: Computational Creativity).

---

## 🏗️ Architecture & Data Flow (Slide 4)

```
[React Web IDE / Canvas] 
       │ (Keystroke & Dwell Telemetry Stream)
       ▼
[Confusion Diagnostic Engine]
       │ (Cognitive Friction Threshold >= 65%)
       ▼
[AWS Bedrock / LLM (Claude 3.5 Sonnet / Llama 3)]
       │ (Step-by-Step Socratic Metaphors)
       ▼
[Interactive Visual Analogy UI (Russian Dolls, Lockers, Phonebook)]
```

### Tech Stack:
- **Frontend:** React, Tailwind CSS, Custom Monaco-Style Telemetry Editor, Canvas Sparkline HUD.
- **Backend & Cloud:** Node.js, REST API endpoints (`/api/telemetry`, `/api/diagnose`, `/api/bedrock-tutor`, `/api/session-analytics`), AWS Bedrock architecture.
- **Privacy Model:** 100% webcam-free and audio-free; tracks only typing cadence and interaction deltas.

---

## 🚀 Key Features Implemented (Slide 5)

1. **Telemetry-Instrumented Workspace:**
   - Real-time typing velocity (WPM).
   - Burst deletions & backspace ratio tracker.
   - Per-line idle dwell timer (detecting freeze vs. productive thinking).
   - Compilation error loop counter.

2. **Real-Time Confusion Scoring Engine:**
   - Evaluates cognitive friction index (0–100%) with **sub-300ms SLA**.
   - **Flow State (0–34%):** Uninterrupted flow.
   - **Active Thinking (35–64%):** Constructive pause; tutor observes passively.
   - **Confusion Trigger (65–100%):** Proactive Socratic intervention.

3. **Dynamic Socratic Intervention Drawer:**
   - Powered by AWS Bedrock (Claude 3.5 Sonnet / Llama 3).
   - 4-level progressive scaffolding ladder:
     1. *Creative Metaphor* (Russian Dolls, School Lockers, Phonebook).
     2. *Socratic Guiding Question* (nudges rather than spoiling answers).
     3. *Interactive Sandbox* (clickable step-by-step visual animation).
     4. *Minimal Code Scout* (syntax nudge).

4. **🎥 Interactive Video Tutor & Adaptive Studio (New):**
   - **Interactive Video Lectures with Speech Narration:** Features animated AI Tutors (Professor Ada & Dr. Turing) with speech synthesis (`window.speechSynthesis`), visual chapter timelines, and synchronized presentation boards.
   - **In-Video Checkpoint Questions:** Video automatically pauses at key intervals (e.g. 0:40, 1:15) to ask conceptual questions before proceeding.
   - **Understanding Level Diagnostics:** Evaluates student answers, calculates comprehension scores (0–100%), and classifies mastery tiers (`MASTERY`, `DEVELOPING`, `STRUGGLING`).
   - **Targeted Adaptive Re-Teaching:** Automatically identifies the exact concept or edge-case the student failed to understand (e.g., Base Case omission, stack unwinding, pointer shift inversion) and launches a customized micro-lesson with visual explanations and audio narration to re-teach that exact blindspot.
   - **Direct IDE Integration:** Once re-taught, the student can click "Apply & Solve in IDE" to put their new mental model into practice immediately!

5. **Live Telemetry & Learning Heatmap Dashboard:**
   - Live Canvas sparkline plotting friction over time.
   - Line-by-line struggle hotspot heatmap.
   - Session telemetry log and cognitive load distribution.

5. **Pitch Deck Presentation Viewer (Slides 1–5):**
   - Exact recreation of all 5 hackathon presentation slides built directly into the web app for judging convenience.

6. **Fast Judge Demo Bar:**
   - `💥 Burst Deletions`: Simulates rapid backspacing.
   - `❄️ 45s Cognitive Freeze`: Simulates paralysis on recursion logic.
   - `🔁 Execution Error Loop`: Simulates rapid runtime failures.
   - `🟢 Reset to Flow`: Restores calm state.

---

## 🏃 Quick Start Guide

### Option 1: Direct Batch Launcher (Windows)
Double-click `start.bat` in the project root. It will launch the server and open `http://localhost:3000` in your default browser.

### Option 2: Terminal Execution
```bash
# In the project directory:
node server.js
```
Open your browser to: **`http://localhost:3000`**

### Option 3: Instant Static / Offline Mode
You can directly open `public/index.html` in any web browser (Google Chrome, Microsoft Edge, Firefox, Brave) without even needing an active server or internet connection.

