# Product Requirements Document (PRD)

# Gavelogy - CLAT PG Preparation Platform

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [User Flows](#user-flows)
8. [UI/UX Requirements](#uiux-requirements)
9. [Business Model](#business-model)
10. [Success Metrics](#success-metrics)

---

## 1. Executive Summary

**Product Name:** Gavelogy (formerly Gavelogy)

**Product Type:** SaaS Education Platform

**Target Market:** Law students and CLAT PG aspirants in India

**Vision:** To become the leading case-based learning platform for CLAT PG preparation through immersive content, intelligent analytics, and gamified learning experiences.

**Mission:** Help law aspirants master legal concepts through real judgments, systematic practice, and data-driven progress tracking.

---

## 2. Product Overview

Gavelogy is a comprehensive CLAT PG preparation platform that combines:

- **Static Subject Courses**: 13 foundational law subjects with 650 questions
- **Contemporary Cases**: 150 landmark cases from 2023-2025
- **Intelligent Mistake Tracking**: Learn from errors systematically
- **Gamification**: Streaks, leaderboard, coins, and achievements
- **Comprehensive Analytics**: Detailed performance insights

### 2.1 Key Differentiators

1. **Case-Based Learning**: Focus on real judgments, not just theory
2. **Mistake Intelligence**: Tracks what users get wrong and why
3. **Contemporary Focus**: Latest legal developments (2023-2025)
4. **Gamified Experience**: Makes studying engaging and competitive
5. **Data-Driven Insights**: Clear analytics showing improvement over time

---

## 3. User Personas

### 3.1 Primary Persona: "The Consistent Learner"

- **Age**: 22-25
- **Goal**: Crack CLAT PG with 85%+ score
- **Pain Points**:
  - Can't find quality contemporary case materials
  - Need structured practice for all subjects
  - Want to track progress systematically
- **Needs**:
  - Access to 150 contemporary cases
  - Subject-wise quizzes with explanations
  - Clear analytics on strengths/weaknesses

### 3.2 Secondary Persona: "The Exam Preparer"

- **Age**: 23-28
- **Goal**: Pass CLAT PG exam
- **Pain Points**:
  - Limited time to study
  - Need efficient revision methods
  - Want to learn from mistakes
- **Needs**:
  - Quick revision through mock tests
  - Mistake tracking and retake functionality
  - Leaderboard motivation

---

## 4. Core Features

### 4.1 Authentication & User Management

**Priority:** P0 (Critical)

#### Features:

- **Email/Password Authentication**
  - Email validation
  - Password strength requirements (min 8 chars, uppercase, lowercase, number)
  - Secure session management
- **Profile Management**
  - User profile with name, username
  - Avatar support
  - Dark mode preference
- **Session Management**
  - Persistent sessions
  - Auto-logout on inactivity
  - Remember me functionality

#### Implementation Files:

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/auth/callback/page.tsx`
- `src/lib/stores/auth.ts`

---

### 4.2 Course Catalog & Purchase

**Priority:** P0 (Critical)

#### Features:

**Two Main Courses:**

1. **Static Subjects Course** - ₹1,999

   - 13 Law Subjects
   - 650 Questions
   - 20 Mock Tests
   - Subjects: Constitutional Law, Criminal Law, Contract Law, Torts, Administrative Law, Jurisprudence, Environmental Law, Property Law, Family Law, Labour Law, Tax Law, Corporate Law, IPR

2. **Contemporary Cases Course** - ₹1,499
   - 150 Legal Cases (2023-2025)
   - 50 cases per year
   - Monthly quizzes
   - Organized by subject

**Free Content:**

- Static Subjects: First quiz of each subject (13 free quizzes)
- Contemporary Cases: 5 cases from each year (15 total free cases)

#### Implementation Files:

- `src/app/courses/page.tsx`
- `src/lib/payment.ts`
- `src/app/purchase-success/page.tsx`

---

### 4.3 Content Hub (Subjects Page)

**Priority:** P0 (Critical)

#### Tabs:

**1. Static Subjects**

- 13 subjects with subjects list
- Each subject shows: topic count, quiz count, progress percentage
- Click to expand → shows topics
- Topic shows: Quiz button, Retake button (if attempted)
- Color-coded progress bars
- Free/Premium indicators

**2. Contemporary Cases**

- Year-wise organization (2023, 2024, 2025)
- 2024 & 2025: Direct case list (no categorization)
- 2025: Subject-wise categorization (Constitutional & Administrative Law, Criminal Law, etc.)
- Each case shows:
  - Case number and title
  - Notes button
  - Quiz button (if available)
  - Completion checkbox
- Progress bar for each year showing completion percentage

**3. PYQ (Previous Year Questions)**

- Shows available years (e.g., 2020)
- Mock test button to attempt full exam
- Question count badge

**4. Mock Tests**

- All available mock tests
- Full-length test options

#### Implementation Files:

- `src/app/subjects/page.tsx`

---

### 4.4 Case Notes & Content

**Priority:** P0 (Critical)

#### Features:

- **Full Case Content**
  - Detailed case summaries
  - Facts of the case
  - Legal reasoning
  - Judgment summary
  - Key statutes and provisions highlighted
  - Court observations
- **Navigation**

  - Previous/Next case buttons
  - Year and case number tracking
  - Fullscreen reading mode
  - Auto-exit fullscreen on back button

- **Special Formatting**
  - Yellow highlight for "Key Statutes / Provisions:"
  - Indented sub-points
  - Bold headings for "Key Constitutional Articles:", "Statutes Involved:"
  - Yellow boxes for "Significance / Key Takeaways" sections

#### Implementation Files:

- `src/app/contemporary-cases/[year]/[caseNumber]/notes/page.tsx`

---

### 4.5 Quiz System

**Priority:** P0 (Critical)

#### Quiz Types:

1. **Subject-Based Quizzes**

   - Static subject quizzes
   - Topic-wise questions
   - Multiple choice questions

2. **Contemporary Case Quizzes**

   - Case-specific questions
   - Passage-based questions
   - Questions about legal principles applied

3. **PYQ Mock Tests**
   - Previous year question papers
   - Full-length exams
   - Time-bound tests

#### Quiz Features:

- **Question-Level Feedback**

  - Instant correct/incorrect indication
  - Confidence levels (Confident/Guess/Fluke)
  - Explanations after each answer
  - Time spent tracking

- **Results & Analytics**
  - Total score
  - Accuracy percentage
  - Time analysis
  - Mistake details
  - Attempt saved to history

#### Implementation Files:

- `src/app/contemporary-cases/[year]/[caseNumber]/quiz/page.tsx`
- `src/app/quiz/[quizId]/page.tsx`
- `src/app/pyq/[year]/mock/page.tsx`
- `src/lib/stores/quiz.ts`

---

### 4.6 Mistake Tracking

**Priority:** P1 (High)

#### Features:

- **Mistake Repository**

  - All wrong answers saved
  - Question details preserved
  - Correct answer shown
  - Explanation available

- **Retake Functionality**

  - Retake only wrong questions
  - Focus on mistakes
  - Track improvement

- **Mistake Analytics**
  - Most common mistakes
  - Subject-wise mistake distribution
  - Trend analysis
  - Weak areas identification

#### Implementation Files:

- `src/app/mistakes/page.tsx`
- `src/app/quiz/retake/[questionId]/page.tsx`
- `src/lib/stores/mistakes.ts`

---

### 4.7 Dashboard & Analytics

**Priority:** P1 (High)

#### Features:

- **Overview Tab**

  - Welcome message with user name
  - Quick stats (Quizzes completed, Cases studied, Accuracy)
  - Recent activity
  - Course access status

- **Performance Tab**

  - Overall accuracy trend
  - Subject-wise performance
  - Time spent analysis
  - Improvement trajectory

- **Consistency Tab**

  - Study streak counter
  - Calendar view of activity
  - Daily goal tracking
  - Longest streak record

- **Achievements Tab**

  - Badges and achievements
  - Milestones reached
  - Unlockable rewards
  - Progress indicators

- **Mistakes Tab**
  - Mistake count
  - Recent mistakes
  - Weak areas highlighted

#### Implementation Files:

- `src/app/dashboard/page.tsx`
- `src/components/dashboard/analytics/`

---

### 4.8 Leaderboard

**Priority:** P1 (High)

#### Features:

- **Global Leaderboard**

  - Top performers
  - Rank display
  - Score comparison
  - Streak leaderboard

- **Filters**
  - All-time ranking
  - Monthly ranking
  - Subject-wise ranking

#### Implementation Files:

- `src/app/leaderboard/page.tsx`
- `src/lib/stores/streaks.ts`

---

### 4.9 Gamification

**Priority:** P1 (High)

#### Features:

- **Streak System**

  - Daily learning streaks
  - Longest streak tracking
  - Streak rewards
  - Motivation through continuity

- **Coins & Rewards**

  - Earn coins for quizzes
  - Earn coins for streaks
  - Reward system
  - Badge collections

- **Badges & Achievements**
  - Subject mastery badges
  - Streak milestones
  - Quiz completion achievements
  - First case study rewards

#### Implementation Files:

- `src/lib/stores/streaks.ts`
- `src/lib/badges.ts`

---

## 5. Technical Architecture

### 5.1 Tech Stack

- **Frontend Framework:** Next.js 15.5.6 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components using Lucide React icons
- **State Management:** Zustand with localStorage persistence
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (recommended)

### 5.2 Folder Structure

```
src/
├── app/                          # Next.js app router pages
│   ├── auth/callback/           # OAuth callback
│   ├── contemporary-cases/      # Case notes and quizzes
│   ├── courses/                 # Course catalog
│   ├── dashboard/               # User dashboard
│   ├── leaderboard/             # Rankings
│   ├── login/                   # Login page
│   ├── mistakes/                # Mistake tracking
│   ├── profile/                 # User profile
│   ├── pyq/                     # Previous year questions
│   ├── quiz/                    # Quiz system
│   ├── subjects/                # Main content hub
│   └── signup/                  # Registration
├── components/                   # Reusable components
│   ├── dashboard/               # Dashboard components
│   │   └── analytics/           # Performance tabs
│   └── ui/                      # UI components
├── hooks/                        # Custom React hooks
├── lib/                          # Business logic
│   ├── stores/                  # Zustand stores
│   ├── data/                    # Static data
│   └── utils/                    # Utility functions
└── types/                        # TypeScript definitions
```

### 5.3 Key Libraries

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "next": "15.5.6",
    "react": "18.x",
    "react-dom": "18.x",
    "zustand": "^4.x",
    "lucide-react": "^0.x",
    "tailwindcss": "^3.x",
    "framer-motion": "^11.x"
  }
}
```

---

## 6. Database Schema

### 6.1 Core Tables

#### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_coins INTEGER DEFAULT 100,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_case_completion

```sql
CREATE TABLE user_case_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  case_number TEXT NOT NULL,
  year TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, case_number)
);
```

#### user_streaks

```sql
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  username TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_cases_studied INTEGER DEFAULT 0,
  total_pyq_attempted INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_courses

```sql
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  course_id UUID,
  status TEXT CHECK (status IN ('active', 'expired')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);
```

#### contemprory_case_notes

```sql
CREATE TABLE contemprory_case_notes (
  case_number TEXT PRIMARY KEY,
  case_name TEXT NOT NULL,
  overall_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### contemporary_case_quizzes

```sql
CREATE TABLE contemporary_case_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT NOT NULL,
  case_name TEXT NOT NULL,
  passage TEXT,
  case_question_id TEXT NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL
);
```

### 6.2 Security (RLS Policies)

All tables have Row Level Security enabled. Users can only access their own data.

---

## 7. User Flows

### 7.1 New User Registration & Onboarding

1. User lands on homepage
2. Clicks "Sign Up" or "Get Started"
3. Fills registration form (Name, Username, Email, Password)
4. Email verification (optional)
5. Redirected to Dashboard
6. Onboarding tour (optional)
7. User can explore free content

### 7.2 Course Purchase Flow

1. User browses course catalog
2. Views course details
3. Clicks "Buy Now"
4. Directed to payment page
5. Payment processing (simulated)
6. Success page with course access
7. Redirected to content

### 7.3 Learning Flow (Contemporary Case)

1. User goes to "Content" → "Contemporary Cases"
2. Expands year (2023/2024/2025)
3. Selects a case
4. Reads case notes (fullscreen mode)
5. Attempts quiz (if available)
6. Gets instant feedback
7. Marks case as completed
8. Progress bar updates

### 7.4 Quiz & Mistake Tracking Flow

1. User attempts quiz
2. Answers questions with confidence levels
3. Gets immediate feedback per question
4. Views results and analytics
5. Mistakes saved automatically
6. User can retake mistakes
7. Performance tracked in analytics

---

## 8. UI/UX Requirements

### 8.1 Design Principles

- **Clean & Modern**: Sky gradient with cloud effects
- **Accessible**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design
- **Fast**: Optimistic UI updates
- **Intuitive**: Clear navigation and CTAs

### 8.2 Color Scheme

- **Primary Blue**: #6B9BD2
- **Pink Accent**: #F8C9D0
- **Background**: Gradient from blue-200 to blue-50
- **Text**: Dark gray (#2C2C2C)
- **Success Green**: For completed states

### 8.3 Key Components

- **DottedBackground**: Animated background dots
- **Cards**: White cards with gradient overlays
- **Buttons**: Pill-shaped with hover effects
- **Progress Bars**: Color-coded by percentage
- **Loading States**: Skeleton screens and spinners

### 8.4 Interactions

- Smooth transitions and animations
- Hover effects on interactive elements
- Click feedback on buttons
- Optimistic UI updates for instant feedback

---

## 9. Business Model

### 9.1 Pricing

- **Static Subjects Course**: ₹1,999 (original ₹2,999)
- **Contemporary Cases Course**: ₹1,499 (original ₹2,249)
- **Bundle**: ₹2,999 (save ₹500)

### 9.2 Revenue Streams

1. One-time course purchases
2. Premium features (future)
3. Corporate partnerships (future)

### 9.3 Marketing Strategy

- Free tier to attract users
- Word of mouth through high-quality content
- SEO optimization for "CLAT PG preparation"
- Social media presence

---

## 10. Success Metrics

### 10.1 User Engagement

- Daily Active Users (DAU)
- Quiz completion rate
- Average session duration
- Case notes read per user

### 10.2 Learning Outcomes

- Quiz accuracy improvements
- Mistake reduction rate
- Completion rates
- User satisfaction scores

### 10.3 Business Metrics

- Conversion rate (free to paid)
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)

---

## 11. Implementation Priority

### Phase 1 (MVP) - COMPLETED ✅

- Authentication
- Course catalog
- Basic content access
- Quiz system
- Mistake tracking
- Dashboard basic analytics

### Phase 2 (Current Focus)

- Contemporary cases (2023-2025)
- Case completion tracking
- Progress bars
- PYQ mock tests

### Phase 3 (Future)

- Advanced analytics
- Social features
- Mobile app
- AI-powered recommendations
- Live classes integration

---

## 12. Technical Specifications

### 12.1 Performance Requirements

- Page load time: < 2 seconds
- Quiz submission: < 500ms
- Real-time updates: < 100ms
- Mobile-friendly: Responsive design

### 12.2 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 12.3 Accessibility

- Keyboard navigation
- Screen reader compatibility
- High contrast mode
- Focus indicators

---

## 13. API Endpoints (Supabase)

### 13.1 User Management

- `GET /auth/user` - Get current user
- `POST /auth/signup` - Register user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### 13.2 Content

- `GET /contemporary_cases/{year}` - Get cases by year
- `GET /case_notes/{case_number}` - Get case notes
- `GET /case_quizzes/{case_number}` - Get case quizzes

### 13.3 Progress Tracking

- `POST /user_case_completion` - Mark case complete
- `GET /user_streaks/{user_id}` - Get user streak
- `PUT /user_streaks/{user_id}` - Update streak

---

## 14. Testing Requirements

### 14.1 Unit Tests

- Store functions (auth, quiz, mistakes)
- Utility functions
- Validation functions

### 14.2 Integration Tests

- Authentication flow
- Quiz completion flow
- Payment processing
- Progress tracking

### 14.3 E2E Tests

- Complete user journeys
- Cross-browser testing
- Mobile responsiveness

---

## 15. Documentation Requirements

### 15.1 Technical Documentation

- API documentation
- Database schema docs
- Component library
- Deployment guide

### 15.2 User Documentation

- Getting started guide
- FAQ section
- Tutorial videos
- Support articles

---

## 16. Launch Checklist

- [ ] All core features implemented
- [ ] Database fully populated
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Analytics implemented
- [ ] Support system ready
- [ ] Marketing materials prepared

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Owner:** Development Team  
**Status:** Active Development
