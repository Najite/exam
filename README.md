# Cognita AI CBT — Next-Gen AI-Powered Computer-Based Testing Platform

A standardized, high-stakes Computer-Based Testing (CBT) examination platform powered by Artificial Intelligence. Modeled after professional testing engines (e.g. GRE, AWS, TOEFL, JAMB), it combines real-time computer vision proctoring, psychometric test generation, semantic short-answer auto-grading, and post-exam AI Socratic tutoring.

---

## 🌟 Key Features

### 1. 🧠 AI Psychometric Exam Generator
- **Prompt-to-Exam & Topic Synthesis**: Generate comprehensive, calibrated examinations on any subject (e.g., Computer Science, System Design, Medicine, Law, Quantitative Reasoning).
- **Multi-Format Question Support**:
  - Single-choice Multiple Choice Questions (MCQ)
  - Multi-select Multiple Choice Questions
  - True / False statements
  - Interactive Code snippet execution & output analysis
  - Subjective Short Answers & Conceptual synthesis with AI marking rubrics
- **Configurable Bloom Taxonomy & Difficulty**: Calibrates difficulty (Beginner, Intermediate, Advanced) and cognitive domains (Knowledge, Comprehension, Application, Analysis, Evaluation).
- **Dual AI Engine**: Seamlessly connects with Google Gemini API when configured, and features a high-fidelity built-in smart AI synthesizer with zero external setup required.

### 2. 🛡️ Real-Time AI Proctoring & Anti-Cheating System
- **Computer Vision Face & Gaze Tracking**: Real-time webcam feed monitoring face presence, centering, and camera obscuration.
- **Acoustic Background Monitoring**: Web Audio API analyser with real-time VU meter tracking ambient volume and background chatter.
- **Tab Switching & Window Blur Enforcement**: Monitors `visibilitychange` and window blur events; records incident timestamps and strike counts.
- **Fullscreen Lock**: Restricts navigation and prompts immediate return upon minimize.
- **Clipboard & Right-Click Security**: Disables context menus, copy, cut, and paste attempts.
- **Automated Incident Strike Engine**: Logs security incidents with severity ratings; triggers auto-submission if maximum strikes (3) are exceeded.

### 3. ⏱️ Standardized CBT Engine & On-Screen Utilities
- **High-Stakes Question Palette**:
  - Color-coded status legend: *Answered (Green)*, *Not Answered (Red)*, *Marked for Review (Purple)*, *Answered & Marked (Purple with dot)*, *Not Visited (Gray)*.
  - 1-click grid navigation across all questions.
- **Live Countdown Timer**: Real-time remaining countdown with amber alerts (< 5m) and emergency pulse (< 1m), with automatic timeout submission.
- **Candidate Pre-Flight Readiness Room**:
  - Identity verification and photo snapshot capture
  - Hardware camera & microphone diagnostics check
  - Anti-cheating Honor Code agreement
- **On-Screen CBT Toolset**:
  - **Scientific Calculator Modal**: Trigonometric functions, logarithms, powers, roots, parentheses, and arithmetic.
  - **Formula & Reference Sheet**: Searchable reference formulas for Mathematics, Computer Science, and Statistics.
  - **Auto-Saving Scratchpad**: Real-time rough working pad saved to browser session storage.
  - **Font Zoom Controls**: Accessible font scaling (`A` / `A+`).

### 4. 📊 Post-Exam AI Intelligence & Diagnostic Studio
- **Automated Semantic Auto-Grader**:
  - Evaluates free-text short answers against model answers and technical rubrics.
  - Highlights specific key strengths, missing points, accuracy levels, and score breakdowns.
- **Curriculum Mastery Analytics**: Topic-by-topic performance bars and psychometric percentile ranking.
- **AI Personalized Remediation Plan**: Diagnoses knowledge gaps and suggests targeted study pathways.
- **Interactive AI Socratic Tutor**:
  - "Ask AI Tutor" panel on every reviewed question.
  - Interactive conversation for deeper conceptual understanding and analogies.
- **Official Certificate of Achievement**:
  - Accredited Certificate modal with candidate name, score, integrity rating, issue date, and verification hash.
  - Print / Save as PDF support.

### 5. 👨‍🏫 Examiner & Administrator Audit Dashboard
- Real-time review of all completed sessions.
- Security integrity verdicts: *Verified Clean*, *Flagged for Review*, or *High Risk*.
- Candidate photo verification logs and timestamped incident audit trails.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) & React 19 |
| **Language** | TypeScript (Strict mode, 100% type safety) |
| **Styling** | Tailwind CSS v4, Lucide Icons |
| **Computer Vision & Proctoring** | HTML5 Canvas, Web Audio API, MediaDevices API |
| **Celebrations** | Canvas-Confetti |
| **AI Engine** | Google Gemini API (1.5/2.5 Flash) + Built-in Smart Synthesizer |
| **Storage** | File-based JSON Database (`/data/exams.json`, `/data/submissions.json`) |

---

## 🚀 Getting Started

### 1. Installation
```bash
# Clone the repository
git clone <repo-url>
cd exam

# Install dependencies
npm install
```

### 2. Environment Configuration (Optional)
If you wish to use your own live Google Gemini API key:
```bash
# Create .env.local
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
```
*(Note: If no API key is provided, the platform automatically activates its high-fidelity built-in smart AI engine so everything works out of the box!)*

### 3. Running the Server
```bash
# Build the production bundle
npm run build

# Start the production server
npm run start
```
The application will be accessible at: **`http://localhost:3000`**

---

## 📁 Project Structure

```
├── data/                      # Persistent JSON database
│   ├── exams.json             # Exam questions, rubrics, & proctoring configs
│   └── submissions.json       # Session logs, scores, & security incident audits
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── exams/         # GET/POST exams, PUT/DELETE by ID
│   │   │   ├── exams/generate # AI Exam Synthesizer API
│   │   │   ├── submissions/   # Exam submission & AI auto-grader API
│   │   │   └── ai/tutor/      # Interactive AI Socratic Tutor API
│   │   ├── exam/[id]/setup/   # Pre-flight camera/mic readiness & identity room
│   │   ├── exam/[id]/take/    # Real-time CBT testing terminal
│   │   ├── result/[id]/       # Diagnostic center, certificate, & question review
│   │   ├── submissions/       # Examiner audit & monitoring dashboard
│   │   ├── layout.tsx         # Root layout & dark theme
│   │   └── page.tsx           # Home page & exam directory
│   ├── components/
│   │   ├── AIExamGeneratorModal.tsx
│   │   ├── AITutorModal.tsx
│   │   ├── CalculatorModal.tsx
│   │   ├── CertificateModal.tsx
│   │   ├── FormulaSheetModal.tsx
│   │   ├── QuestionPalette.tsx
│   │   ├── ScratchpadModal.tsx
│   │   ├── WebcamProctor.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── ai-service.ts      # Gemini & heuristic AI generation & grading engine
│   │   ├── db.ts              # Data persistence manager
│   │   └── seed-data.ts       # Pre-loaded high-stakes certification exams
│   └── types/
│       └── index.ts           # Domain models & TypeScript interfaces
```

---

## 📜 License
MIT License. Built for rigorous Computer-Based Testing and AI-empowered education.
