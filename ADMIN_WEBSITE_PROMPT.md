# Gavelogy Admin Website - Development Prompt

## Context: What is Gavelogy?

Gavelogy is a comprehensive CLAT PG (Common Law Admission Test - Post Graduate) preparation platform for law students in India. The platform provides:

- **13 Core Law Subjects**: Constitutional Law, Criminal Law, Contract Law, Tort Law, Administrative Law, Jurisprudence, Environmental Law, Property Law, Family Law, Labour Law, Tax Law, Corporate Law, IPR
- **Contemporary Cases (2023-2025)**: 150+ landmark Supreme Court judgments with detailed notes and quizzes
- **Interactive Quizzes**: Multiple choice questions with explanations
- **Gamification**: Streaks, leaderboard, coins, and achievements
- **Performance Analytics**: Detailed insights into student progress

### Content Structure

**Two Main Content Types:**

1. **Subject-Based Quizzes**:

   - Organized by: Course → Subject → Quiz → Questions
   - Each question has: question_text, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), explanation

2. **Contemporary Case Notes**:
   - Organized by: Year → Case Number (e.g., CS-24-01, CS-25-A-01)
   - Each case has: case_number, overall_content (rich text with formatting)
   - Notes are displayed to students with formatting (bold, headings, bullet points, highlights)

### Database Structure

**Main Tables:**

- `contemprory_case_notes`: Stores case notes (case_number, overall_content)
- `questions`: Stores quiz questions (quiz_id, question_text, option_a/b/c/d, correct_answer, explanation, order_index)
- `quizzes`: Stores quiz metadata (subject_id, title, description, order_index)
- `subjects`: Stores subject information (course_id, name, description, order_index)
- `contemporary_cases`: Stores case metadata (title, year, month, subject, case_summary)

**Note Format:**

- Notes are stored as plain text in `overall_content` field
- The frontend formats them with headings, bullet points, bold text, and highlights
- Case numbers follow format: CS-YY-XX or CS-YY-S-XX (where S is subject code)

### Complete Database Schema

Here are all the tables and columns in the Gavelogy database:

**1. `contemprory_case_notes`** - Stores case notes content

- `case_number` (TEXT) - Unique case identifier (e.g., "CS-24-01")
- `overall_content` (TEXT) - The formatted note content

**2. `contemporary_case_quizzes`** - Stores quizzes for contemporary cases

- `id` (UUID)
- `case_name` (TEXT)
- `case_number` (TEXT)
- `passage` (TEXT) - Optional passage text
- `case_question_id` (TEXT)
- `question` (TEXT) - Question text
- `option_a`, `option_b`, `option_c`, `option_d` (TEXT) - Answer options
- `correct_answer` (TEXT) - Correct answer (A/B/C/D)
- `explanation` (TEXT) - Explanation for the answer
- `created_at`, `updated_at` (TIMESTAMP)

**3. `quizzes`** - Stores quiz metadata for subject-based quizzes

- `id` (UUID)
- `subject_id` (UUID) - Foreign key to subjects table
- `title` (TEXT) - Quiz title
- `description` (TEXT) - Quiz description
- `order_index` (INTEGER) - Display order

**4. `subjects`** - Stores subject information

- `id` (UUID)
- `course_id` (UUID) - Foreign key to courses table
- `name` (TEXT) - Subject name
- `description` (TEXT) - Subject description
- `order_index` (INTEGER) - Display order

**5. `courses`** - Stores course information

- `id` (UUID)
- `name` (TEXT) - Course name
- `description` (TEXT) - Course description
- `price` (DECIMAL) - Course price
- `is_active` (BOOLEAN) - Whether course is active
- `created_at` (TIMESTAMP)

**6. `users`** - User profiles

- `id` (UUID) - Primary key, references auth.users
- `email` (TEXT)
- `username` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `total_coins` (INTEGER)
- `streak_count` (INTEGER)
- `longest_streak` (INTEGER)
- `last_activity_date` (DATE)
- `dark_mode` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

**7. `user_courses`** - User course purchases

- `id` (UUID)
- `user_id` (UUID) - Foreign key to users
- `course_id` (UUID) - Foreign key to courses
- `course_name` (TEXT)
- `course_description` (TEXT)
- `course_price` (DECIMAL)
- `order_id` (TEXT)
- `purchase_date` (TIMESTAMP)
- `status` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

**8. `quiz_attempts`** - User quiz attempt records

- `id` (UUID)
- `user_id` (UUID)
- `quiz_id` (UUID)
- `quiz_type` (TEXT)
- `subject` (TEXT)
- `topic` (TEXT)
- `score` (INTEGER)
- `total_questions` (INTEGER)
- `accuracy` (DECIMAL)
- `time_spent` (INTEGER) - in seconds
- `questions_data` (JSONB)
- `confidence_data` (JSONB)
- `created_at`, `updated_at` (TIMESTAMP)

**9. `user_quiz_attempts`** - Detailed quiz attempt answers

- `id` (UUID)
- `user_id` (UUID)
- `quiz_id` (UUID)
- `question_id` (UUID)
- `quiz_type` (TEXT)
- `subject` (TEXT)
- `topic` (TEXT)
- `question_text` (TEXT)
- `option_a`, `option_b`, `option_c`, `option_d` (TEXT)
- `user_answer` (TEXT)
- `correct_answer` (TEXT)
- `is_correct` (BOOLEAN)
- `confidence_level` (TEXT) - 'confident', 'educated_guess', 'fluke'
- `time_spent` (INTEGER)
- `explanation` (TEXT)
- `created_at` (TIMESTAMP)

**10. `contemporary_mistakes`** - User mistakes from contemporary case quizzes

- `id` (UUID)
- `user_id` (UUID)
- `question_id` (UUID)
- `subject` (TEXT)
- `topic` (TEXT)
- `question_text` (TEXT)
- `user_answer` (TEXT)
- `user_answer_text` (TEXT)
- `correct_answer` (TEXT)
- `correct_answer_text` (TEXT)
- `explanation` (TEXT)
- `confidence_level` (TEXT)
- `is_mastered` (BOOLEAN)
- `created_at` (TIMESTAMP)

**11. `user_mistakes`** - User mistake tracking

- `id` (UUID)
- `user_id` (UUID)
- `question_id` (UUID)
- `attempt_id` (UUID)
- `subject` (TEXT)
- `topic` (TEXT)
- `is_mastered` (BOOLEAN)
- `retake_count` (INTEGER)
- `mastered_at` (TIMESTAMP)
- `last_retake_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

**12. `user_streaks`** - User activity streaks

- `id` (UUID)
- `user_id` (UUID)
- `username` (TEXT)
- `current_streak` (INTEGER)
- `longest_streak` (INTEGER)
- `total_quizzes_completed` (INTEGER)
- `total_cases_studied` (INTEGER)
- `total_pyq_attempted` (INTEGER)
- `total_score` (INTEGER)
- `last_activity_date` (DATE)
- `created_at`, `updated_at` (TIMESTAMP)

**13. `user_case_completion`** - Case completion tracking

- `id` (UUID)
- `user_id` (UUID)
- `case_number` (TEXT)
- `is_completed` (BOOLEAN)
- `completed_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

**14. `user_confidence_stats`** - User confidence statistics

- `id` (UUID)
- `user_id` (UUID)
- `subject` (TEXT)
- `total_questions` (INTEGER)
- `correct_confident` (INTEGER)
- `correct_educated_guess` (INTEGER)
- `correct_fluke` (INTEGER)
- `wrong_confident` (INTEGER)
- `wrong_educated_guess` (INTEGER)
- `wrong_fluke` (INTEGER)
- `updated_at` (TIMESTAMP)

**15. `payment_orders`** - Payment transaction records

- `id` (UUID)
- `user_id` (UUID)
- `course_id` (UUID)
- `order_id` (TEXT)
- `amount` (DECIMAL)
- `status` (TEXT) - 'pending', 'success', 'failed'
- `payment_method` (TEXT)
- `created_at` (TIMESTAMP)

**16. `pyq_2020_questions`** - Previous year questions (2020)

- `id` (UUID)
- `passage_number` (INTEGER)
- `passage` (TEXT)
- `question_no` (INTEGER)
- `question` (TEXT)
- `option_a`, `option_b`, `option_c`, `option_d` (TEXT)
- `correct_answer` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

**17. `pyq_subject_topic`** - PYQ subject and topic mapping

- `id` (UUID)
- `year` (INTEGER)
- `question_number` (INTEGER)
- `subject` (TEXT)
- `topic` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

**18. `mistakes`** - General mistake records

- `id` (UUID)
- `user_id` (UUID)
- `question_id` (UUID)
- `subject_id` (UUID)
- `quiz_id` (UUID)
- `source_type` (TEXT)
- `source_id` (UUID)
- `user_answer` (TEXT)
- `correct_answer` (TEXT)
- `explanation` (TEXT)
- `is_cleared` (BOOLEAN)
- `cleared_at` (TIMESTAMP)
- `attempts` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

**Note:** The admin panel should primarily work with:

- `contemprory_case_notes` - for managing case notes
- `contemporary_case_quizzes` - for managing case quizzes
- `quizzes` - for managing subject-based quizzes
- `subjects` - for viewing/managing subjects
- `courses` - for viewing courses

## Requirements

### 1. Authentication

- Separate admin website with SSO (Single Sign-On) authentication
- Only authorized admins can access the platform

### 2. Notes Management (Contemporary Case Notes)

Create a rich text editor for creating/editing contemporary case notes with the following:

**Required Formatting Tools:**

- **Text formatting**: Bold, italic, underline
- **Highlighting**: Text highlighting with multiple color options (yellow, green, blue, pink, orange, etc.)
- **Lists**: Bullet points (•) and numbered lists
- **Headings**: Support for section headings (the frontend recognizes patterns like "Key Statutes / Provisions:", "Key Constitutional Articles:", etc.)
- **Other tools**: Standard text editor features

**Note Structure:**

- Notes are stored in `contemprory_case_notes` table
- Field: `overall_content` (TEXT) - stores the formatted note content
- Field: `case_number` (TEXT) - unique identifier (e.g., "CS-24-01", "CS-25-A-01")
- The editor should allow admins to:
  - Create new case notes
  - Edit existing case notes
  - Format text with all the tools mentioned above
  - Save to the database

**Important:** The frontend displays notes with special formatting for sections like "Key Statutes / Provisions:" (yellow background), so maintain consistent heading patterns.

### 3. Quiz Management

Create and manage quizzes for subjects with the following features:

**Quiz Structure:**

- Quizzes belong to Subjects (which belong to Courses)
- Each quiz has: title, description, order_index
- Questions belong to quizzes

**Question Management:**

- Create and edit questions
- Each question requires:
  - `question_text`: The question content
  - `option_a`, `option_b`, `option_c`, `option_d`: Four answer options
  - `correct_answer`: Must be one of "A", "B", "C", or "D"
  - `explanation`: Detailed explanation shown after answering
  - `order_index`: Order of question in the quiz
- Questions are stored in `questions` table with `quiz_id` foreign key

**Admin Features Needed:**

- Create new quizzes (assign to subject)
- Edit existing quizzes
- Add/edit/delete questions within quizzes
- Reorder questions (update order_index)
- Preview quiz before publishing

## Technical Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Authentication**: SSO (Single Sign-On) - connect to same Supabase auth system
- **Database Connection**: Use the same Supabase project and database as main Gavelogy website

**Database Tables to Use:**

- `contemprory_case_notes` - for case notes
- `questions` - for quiz questions
- `quizzes` - for quiz metadata
- `subjects` - for subject information
- `contemporary_cases` - for case metadata (optional, for linking notes to cases)

## UI/UX

- **Clean, simple admin interface**: Modern, professional design
- **Easy-to-use rich text editor**: WYSIWYG editor for notes with toolbar for formatting
- **Intuitive quiz creation form**: Step-by-step form for creating quizzes and questions
- **Content management dashboard**: Overview of all notes and quizzes
- **Search and filter**: Ability to search/filter notes and quizzes by year, subject, case number, etc.

## Additional Context

**Case Number Format:**

- Format: `CS-YY-XX` or `CS-YY-S-XX`
- Examples: `CS-24-01`, `CS-25-A-01`, `CS-25-C-05`
- YY = year (24, 25), S = subject code (A=Constitutional, C=Family Law, etc.), XX = case number

**Content Organization:**

- Contemporary cases are organized by year (2023, 2024, 2025)
- Each year has multiple cases with unique case numbers
- Notes are linked to cases via case_number field

**Important Notes:**

- The main Gavelogy website reads from these same database tables
- Any changes made in admin panel will immediately reflect on the main website
- Ensure data validation and proper error handling
- Consider adding preview functionality to see how content will appear to students

---

## Product Requirements Document (PRD) - Implementation Checklist

### Phase 1: Project Setup & Authentication

- [ ] **1.1 Initialize Next.js 14 Project**

  - [ ] Set up Next.js 14 with TypeScript
  - [ ] Configure Tailwind CSS
  - [ ] Set up project structure (components, lib, app directories)
  - [ ] Install required dependencies

- [ ] **1.2 Supabase Integration**

  - [ ] Configure Supabase client connection
  - [ ] Set up environment variables (.env.local)
  - [ ] Test database connection
  - [ ] Create TypeScript types for database tables

- [ ] **1.3 Authentication System**

  - [ ] Implement SSO authentication with Supabase
  - [ ] Create admin login page
  - [ ] Set up protected routes middleware
  - [ ] Create admin role check/validation
  - [ ] Implement session management
  - [ ] Add logout functionality

- [ ] **1.4 Layout & Navigation**
  - [ ] Create admin dashboard layout
  - [ ] Build navigation sidebar/menu
  - [ ] Add header with user info
  - [ ] Implement responsive design

### Phase 2: Notes Management System

- [ ] **2.1 Rich Text Editor Setup**

  - [ ] Choose and integrate rich text editor library (e.g., TipTap, Quill, or Slate)
  - [ ] Configure editor with required formatting tools:
    - [ ] Bold, italic, underline buttons
    - [ ] Text highlighting with color picker (yellow, green, blue, pink, orange)
    - [ ] Bullet points and numbered lists
    - [ ] Heading styles
    - [ ] Text alignment options
  - [ ] Add toolbar with all formatting options
  - [ ] Implement editor state management

- [ ] **2.2 Case Notes List Page**

  - [ ] Create page to display all case notes
  - [ ] Add table/list view with columns: case_number, preview, actions
  - [ ] Implement search functionality (by case number)
  - [ ] Add filter by year (2023, 2024, 2025)
  - [ ] Add pagination if needed
  - [ ] Add "Create New Note" button

- [ ] **2.3 Create Case Note Page**

  - [ ] Create form with:
    - [ ] Case number input field (with validation for format: CS-YY-XX or CS-YY-S-XX)
    - [ ] Rich text editor for overall_content
  - [ ] Add validation:
    - [ ] Case number format validation
    - [ ] Content required validation
  - [ ] Implement save functionality (INSERT into contemprory_case_notes)
  - [ ] Add success/error notifications
  - [ ] Redirect to notes list after save

- [ ] **2.4 Edit Case Note Page**

  - [ ] Create edit page (route: /admin/notes/[caseNumber]/edit)
  - [ ] Load existing note data from database
  - [ ] Pre-populate form with existing data
  - [ ] Implement update functionality (UPDATE contemprory_case_notes)
  - [ ] Add delete functionality with confirmation
  - [ ] Add preview mode (optional - to see how it looks to students)

- [ ] **2.5 Notes Management Features**
  - [ ] Add bulk actions (if needed)
  - [ ] Implement duplicate note functionality
  - [ ] Add export functionality (optional)
  - [ ] Add confirmation dialogs for delete actions

### Phase 3: Quiz Management System

- [ ] **3.1 Quiz List Page**

  - [ ] Create page to display all quizzes
  - [ ] Show quizzes grouped by subject
  - [ ] Add columns: quiz title, subject, description, question count, actions
  - [ ] Implement search functionality
  - [ ] Add filter by subject
  - [ ] Add "Create New Quiz" button

- [ ] **3.2 Create Quiz Page**

  - [ ] Create form with:
    - [ ] Subject dropdown (load from subjects table)
    - [ ] Quiz title input
    - [ ] Quiz description textarea
    - [ ] Order index input
  - [ ] Add validation for all fields
  - [ ] Implement save functionality (INSERT into quizzes table)
  - [ ] Redirect to quiz edit page after creation

- [ ] **3.3 Edit Quiz Page**

  - [ ] Create edit page (route: /admin/quizzes/[quizId]/edit)
  - [ ] Load quiz data from database
  - [ ] Allow editing quiz metadata (title, description, order_index)
  - [ ] Display list of questions in the quiz
  - [ ] Add "Add Question" button
  - [ ] Implement question reordering (drag & drop or up/down buttons)
  - [ ] Add delete quiz functionality with confirmation

- [ ] **3.4 Question Management**

  - [ ] **Create Question Form:**
    - [ ] Question text textarea
    - [ ] Option A, B, C, D input fields
    - [ ] Correct answer dropdown (A/B/C/D)
    - [ ] Explanation textarea
    - [ ] Order index input
  - [ ] **Edit Question:**
    - [ ] Load question data
    - [ ] Pre-populate form
    - [ ] Update functionality
  - [ ] **Delete Question:**
    - [ ] Delete button with confirmation
  - [ ] **Question List:**
    - [ ] Display all questions in a quiz
    - [ ] Show question preview
    - [ ] Add edit/delete actions per question

- [ ] **3.5 Contemporary Case Quizzes**
  - [ ] Create page for managing contemporary case quizzes
  - [ ] List all case quizzes (from contemporary_case_quizzes table)
  - [ ] Add filter by case number
  - [ ] Create form to add new case quiz:
    - [ ] Case name input
    - [ ] Case number input
    - [ ] Passage textarea (optional)
    - [ ] Question text
    - [ ] Options A, B, C, D
    - [ ] Correct answer
    - [ ] Explanation
  - [ ] Edit existing case quiz
  - [ ] Delete case quiz with confirmation

### Phase 4: Dashboard & Overview

- [ ] **4.1 Admin Dashboard**

  - [ ] Create main dashboard page
  - [ ] Add statistics cards:
    - [ ] Total case notes count
    - [ ] Total quizzes count
    - [ ] Total questions count
    - [ ] Recent activity
  - [ ] Add quick actions:
    - [ ] Create new note
    - [ ] Create new quiz
    - [ ] View all notes
    - [ ] View all quizzes

- [ ] **4.2 Content Overview**
  - [ ] Create overview page showing:
    - [ ] Notes by year (2023, 2024, 2025)
    - [ ] Quizzes by subject
    - [ ] Recent additions/edits

### Phase 5: UI/UX Polish

- [ ] **5.1 Design System**

  - [ ] Create consistent color scheme
  - [ ] Define typography styles
  - [ ] Create reusable UI components (buttons, cards, inputs, modals)
  - [ ] Implement loading states
  - [ ] Add error states and messages

- [ ] **5.2 User Experience**

  - [ ] Add loading spinners for async operations
  - [ ] Implement toast notifications for success/error
  - [ ] Add confirmation dialogs for destructive actions
  - [ ] Implement form validation with clear error messages
  - [ ] Add auto-save functionality (optional)
  - [ ] Implement keyboard shortcuts (optional)

- [ ] **5.3 Responsive Design**
  - [ ] Ensure mobile responsiveness
  - [ ] Test on different screen sizes
  - [ ] Optimize for tablet and desktop

### Phase 6: Testing & Validation

- [ ] **6.1 Functionality Testing**

  - [ ] Test authentication flow
  - [ ] Test creating case notes
  - [ ] Test editing case notes
  - [ ] Test deleting case notes
  - [ ] Test creating quizzes
  - [ ] Test adding questions to quizzes
  - [ ] Test editing questions
  - [ ] Test deleting questions
  - [ ] Test reordering questions
  - [ ] Test search and filter functionality

- [ ] **6.2 Data Validation**

  - [ ] Validate case number format
  - [ ] Validate required fields
  - [ ] Validate correct answer format (A/B/C/D)
  - [ ] Test edge cases (empty data, special characters)
  - [ ] Validate database constraints

- [ ] **6.3 Error Handling**
  - [ ] Test error scenarios (network failures, invalid data)
  - [ ] Ensure proper error messages
  - [ ] Test error recovery

### Phase 7: Deployment & Documentation

- [ ] **7.1 Deployment Preparation**

  - [ ] Set up production environment variables
  - [ ] Configure build settings
  - [ ] Test production build locally
  - [ ] Set up deployment pipeline (Vercel/Netlify)

- [ ] **7.2 Documentation**

  - [ ] Create README with setup instructions
  - [ ] Document environment variables needed
  - [ ] Create user guide for admins
  - [ ] Document API/database interactions

- [ ] **7.3 Final Checks**
  - [ ] Security review (authentication, authorization)
  - [ ] Performance optimization
  - [ ] Accessibility check
  - [ ] Cross-browser testing

---

## Priority Order

**Must Have (P0):**

- Phase 1: Project Setup & Authentication
- Phase 2: Notes Management System (2.1, 2.2, 2.3, 2.4)
- Phase 3: Quiz Management System (3.1, 3.2, 3.3, 3.4)

**Should Have (P1):**

- Phase 3: Contemporary Case Quizzes (3.5)
- Phase 4: Dashboard & Overview
- Phase 5: UI/UX Polish

**Nice to Have (P2):**

- Phase 6: Advanced Testing
- Phase 7: Additional Documentation

---

## Success Criteria

✅ Admin can log in securely with SSO
✅ Admin can create new case notes with rich text formatting
✅ Admin can edit existing case notes
✅ Admin can create quizzes and add questions
✅ Admin can edit and delete quizzes/questions
✅ All changes reflect immediately on main Gavelogy website
✅ Interface is clean, intuitive, and responsive
✅ Data validation prevents errors
✅ Error handling provides clear feedback



and use this color pallete:
🎨 Gavelogy Admin Color Palette (Matching Main Website)
Primary Colors
Background: #ffffff (light) / #000000 (dark)

Foreground: #2d2d2d (light) / #ffffff (dark)

Primary: #2d2d2d (light) / #10a37f (dark) - Main brand color

Card: #ffffff (light) / #1a1a1a (dark)

Secondary Colors
Muted: #f5f5f5 (light) / #2d2d2d (dark) - Backgrounds, subtle areas

Muted Foreground: #737373 (light) / #b3b3b3 (dark) - Secondary text

Border: #e5e5e5 (light) / #404040 (dark)

Accent Colors
Success: #10a37f - Success states, completed items

Warning: #f59e0b - Warnings, pending states

Error: #ef4444 - Errors, delete actions

Info: #6b7280 - Information, neutral highlights

Rich Text Editor Highlights
Yellow: #fef3c7 - Key statutes/provisions

Green: #d1fae5 - Important points

Blue: #dbeafe - Case references

Pink: #fce7f3 - Legal principles

Orange: #fed7aa - Warnings/notes

Implementation
:root {
  /* Light mode - matching main site */
  --background: #ffffff;
  --foreground: #2d2d2d;
  --primary: #2d2d2d;
  --primary-foreground: #ffffff;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e5e5;
  
  /* Status colors */
  --success: #10a37f;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #6b7280;
}

[data-theme="dark"] {
  /* Dark mode - matching main site */
  --background: #000000;
  --foreground: #ffffff;
  --primary: #10a37f;
  --primary-foreground: #ffffff;
  --muted: #2d2d2d;
  --muted-foreground: #b3b3b3;
  --border: #404040;
}

This maintains visual consistency with your main Gavelogy website while providing the necessary functional colors for admin operations.