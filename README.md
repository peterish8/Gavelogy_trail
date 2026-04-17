# Gavelogy - AI-Powered CLAT PG Preparation Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://gavelogy-trail.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

> **Transforming Legal Education Through Intelligent Learning**

Gavelogy is a comprehensive online learning platform specifically designed for CLAT PG (Common Law Admission Test - Post Graduate) aspirants. The platform combines intelligent mistake-tracking, gamified competitive modes, PDF judgment annotation, and comprehensive analytics for law students.

## Why Gavelogy Matters in Legal Education

### The Challenge
- **Information Overload**: Law students struggle with vast amounts of legal content across 13+ subjects
- **Outdated Methods**: Traditional rote learning doesn't prepare students for analytical legal reasoning
- **Lack of Personalization**: One-size-fits-all approaches ignore individual learning patterns
- **Contemporary Relevance**: Static textbooks can't keep pace with an evolving legal landscape

### Our Solution
- **AI-Powered Mistake Analysis**: Intelligent tracking of weak areas with personalized remediation
- **Contemporary Case Integration**: Real-time updates with latest Supreme Court judgments
- **Gamified Competitive Modes**: Arena duels, speed courts, and battle royale study sessions
- **PDF Judgment Annotation**: Annotate and highlight actual court judgments inline
- **Adaptive Assessment**: Spaced repetition algorithm for long-term retention

## Key Features

### Comprehensive Subject Coverage
- **13 Core Law Subjects**: Constitutional Law, Criminal Law, Contract Law, Tort Law, and more
- **Hierarchical Learning**: Topics → Subtopics → Concepts for structured progression
- **Interactive Quizzes**: Immediate feedback with confidence-level self-assessment

### Contemporary Cases (2023–2025)
- **Latest Supreme Court Judgments**: Updated content with PDF viewer and inline annotations
- **Notes + Judgment Split-Panel**: Side-by-side case notes and annotated PDF view
- **Subject-wise Categorization**: Easy navigation through Constitutional, Criminal, Civil cases
- **Admin Tagging Tool**: Admin UI for tagging judgments with subjects and legal principles

### Intelligent Mistake Analysis
- **Spaced Repetition Algorithm**: Optimal review intervals based on confidence and accuracy
- **Confidence Tracking**: Distinguishes between wrong answers and lucky guesses
- **Personalized Remediation**: Targeted practice sessions for weak areas
- **Performance Analytics**: Detailed insights into accuracy trends and improvement areas

### Arena — Competitive Game Modes
- **Duel Mode**: 1v1 real-time quiz battles
- **Speed Court**: Race against the clock on timed question sets
- **Battle Royale**: Multi-player elimination rounds
- **XP & Coin Economy**: Earn XP for progression, spend coins to enter paid game modes
- **Bot System**: 100 named bots with realistic accuracy and timing for practice matches
- **Leaderboards**: Global and weekly rankings

### Dashboard & Analytics
- **Recent Activity Feed**: Last 12 quiz attempts across all subjects
- **Performance Summary Panel**: Overall stats with subject-wise breakdown
- **Spaced Repetition Calendar**: Visual heatmap of review schedule and streaks
- **Purchased Courses**: Track and continue enrolled courses

### Accessibility & UX
- **Text-to-Speech**: Persistent TTS for reading questions and case content
- **Translate Widget**: In-app translation for multilingual support
- **Dark Mode**: System-aware dark/light theme via `.dark` class
- **Copy Protection**: Prevents unauthorized copying of premium content

## Technology Stack

### Frontend
- **Next.js 15** — App Router, Turbopack, React Server Components
- **React 19** — Latest concurrent features
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4** — Utility-first, no config file, CSS custom properties
- **Framer Motion 12** — Animations, gestures, page transitions
- **Radix UI** — Accessible component primitives
- **Zustand 5** — Global state with `persist` middleware

### Backend & Database
- **Supabase** — PostgreSQL, Auth, Row Level Security, RPCs
- **Server Actions** — Next.js `'use server'` actions in `src/actions/`
- **API Routes** — Payment order creation and verification via `/api/payment/`

### Payments
- **Razorpay** — Course purchase flow with server-side order creation and signature verification

### PDF & Annotation
- **pdfjs-dist 5** — Canvas-based PDF rendering with `IntersectionObserver` virtualization
- **Bezier Connectors** — Visual connectors linking highlights to notes

### Infrastructure
- **Vercel** — Edge deployment
- **Dev port**: `3001` (`npm run dev`)

## Getting Started

### For Students
1. Sign up at [gavelogy-trail.vercel.app](https://gavelogy-trail.vercel.app)
2. Take the initial diagnostic quiz
3. Follow the AI-generated study schedule
4. Track progress through the analytics dashboard

### For Developers

```bash
# Clone the repository
git clone https://github.com/peterish8/Gavelogy_trail.git
cd Gavelogy_trail

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Razorpay credentials

# Run development server (port 3001)
npm run dev
```

**Environment Variables**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # server-only
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=          # server-only
```

### Development Workflow

> **IMPORTANT**: All new features and fixes must be pushed to the `develop` branch. Direct pushes to `main` are restricted to release merges only.

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make changes and commit
3. Push to develop: `git push origin feature/your-feature-name`
4. Open a PR targeting `develop`

## Educational Philosophy

- **Spaced Repetition**: Optimal review intervals for long-term retention
- **Active Recall**: Testing effect for stronger memory formation
- **Confidence Metacognition**: Students self-assess certainty, not just correctness
- **Case-Based Learning**: Real Supreme Court judgments as primary material

## Future Roadmap

### Short Term
- Mobile PWA with offline support
- Voice notes and audio explanations
- Collaborative study rooms

### Medium Term
- AI tutor chatbot for instant doubt resolution
- Expert video lectures and case walkthroughs
- Mock interviews for law school admissions

### Long Term
- Global expansion for international law entrance exams
- Legal research database integration
- Alumni network and career guidance

## Contact & Support

- **Student Support**: support@gavelogy.com
- **Business Inquiries**: business@gavelogy.com
- **Academic Partnerships**: academic@gavelogy.com

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Built for the future lawyers of India*
