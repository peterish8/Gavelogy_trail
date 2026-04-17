# Supabase Database Files

This directory contains all SQL files for the Gavelogy database, organized into categorized subdirectories for easy navigation and maintenance.

## 📁 Folder Structure

```
supabase/
├── migrations/          # Timestamped database migrations
├── schemas/            # Complete database schemas
├── tables/             # Individual table creation scripts
├── rls-policies/       # Row Level Security policies
├── functions/          # Stored procedures, RPCs, and functions
├── utilities/          # Cleanup and maintenance scripts
└── sample-data/        # Sample and test data
```

## 📂 Directory Details

### `migrations/` (6 files)
Timestamped migration files that track chronological database changes.

**Files:**
- `20260119_quiz_answer_confidence.sql` - Quiz answer confidence tracking
- `20260120_create_daily_activity.sql` - Daily activity tracking
- `20260120_create_spaced_repetition_system.sql` - Spaced repetition system
- `20260120_fix_mistakes_rls.sql` - Mistakes RLS policy fixes
- `20260120_question_memory_states.sql` - Question memory state tracking
- `20260120_update_memory_state_function.sql` - Memory state update function

### `schemas/` (9 files)
Complete database schema definitions, organized by purpose.

**Structure:**
```
schemas/
├── complete/           # Full database schemas (4 files)
│   ├── COMPLETE_DATABASE.sql
│   ├── SUPABASE_SCHEMA_COMPLETE.sql
│   ├── supabase_schema.sql
│   └── complete_database_setup.sql
├── pyq/               # PYQ-specific schemas (2 files)
│   ├── PYQ_NORMALIZED_SCHEMA.sql
│   └── PYQ_TABLE_SCHEMA.sql
├── questions/         # Questions-related schemas (2 files)
│   ├── DATABASE_QUESTIONS.sql
│   └── QUESTIONS_FIXED.sql
└── SCHEMA_FIXED.sql   # Fixed/corrected schema
```

### `tables/` (10 files)
Individual table creation scripts, grouped by feature domain.

**Structure:**
```
tables/
├── users/             # User tables (2 files)
│   ├── create_users_table_complete.sql
│   └── setup_users_table_final.sql
├── streaks/           # Streak tracking tables (3 files)
│   ├── create_user_streaks_table.sql
│   ├── create_user_streaks_fixed.sql
│   └── create_user_streaks_minimal.sql
├── courses/           # Course tables (1 file)
│   └── create_user_courses_table.sql
├── quizzes/           # Quiz tables (2 files)
│   ├── create_quiz_attempts_table.sql
│   └── create_user_case_completion_table.sql
├── pyq/               # PYQ tables (1 file)
│   └── create_pyq_2020_questions_table.sql
└── mistakes/          # Mistakes tracking (1 file)
    └── contemporary_mistakes_table.sql
```

### `rls-policies/` (2 files)
Row Level Security (RLS) policy definitions for database security.

**Files:**
- `enable_pyq_2020_rls.sql` - RLS for PYQ 2020 questions
- `enable_pyq_rls.sql` - RLS for PYQ tables

### `functions/` (8 files)
Stored procedures, RPCs (Remote Procedure Calls), and complex table creation scripts with triggers.

**Files:**
- `create_award_coins_rpc.sql` - Coin award system RPC
- `create_case_quizzes.sql` - Case quiz creation
- `create_game_tables.sql` - Game-related tables
- `create_mistakes_table.sql` - Mistakes tracking table
- `create_user_completed_items.sql` - User completion tracking
- `create_user_courses.sql` - User course management
- `create_user_streaks.sql` - Streak management functions
- `streak_points_system.sql` - Streak points calculation system

### `utilities/` (2 files)
Utility scripts for database maintenance, cleanup, and repairs.

**Files:**
- `cleanup_duplicate_policy.sql` - Remove duplicate RLS policies
- `fix_user_streaks_duplicates.sql` - Fix duplicate streak records

### `sample-data/` (1 file)
Sample and test data for development and testing.

**Files:**
- `SAMPLE_DATA.sql` - Sample data for testing

## 🔍 File Naming Conventions

All files follow consistent naming conventions:
- **Lowercase with underscores**: `create_user_table.sql`
- **Timestamped migrations**: `YYYYMMDD_description.sql`
- **Descriptive names**: Files clearly indicate their purpose

## 📝 Usage Guidelines

### Running Migrations
Migrations should be run in chronological order (by timestamp):
```bash
# Example: Run all migrations in order
psql -d your_database -f migrations/20260119_quiz_answer_confidence.sql
psql -d your_database -f migrations/20260120_create_daily_activity.sql
# ... and so on
```

### Setting Up Fresh Database
For a complete database setup, use one of the complete schemas:
```bash
psql -d your_database -f schemas/complete/COMPLETE_DATABASE.sql
```

### Creating Individual Tables
To create specific tables:
```bash
psql -d your_database -f tables/users/create_users_table_complete.sql
```

### Applying RLS Policies
After creating tables, apply Row Level Security:
```bash
psql -d your_database -f rls-policies/enable_pyq_rls.sql
```

## ⚠️ Important Notes

- **Backup First**: Always backup your database before running utility scripts
- **Migration Order**: Run migrations in chronological order to avoid dependency issues
- **RLS Policies**: Apply RLS policies after creating the corresponding tables
- **Testing**: Use `sample-data/SAMPLE_DATA.sql` for testing in development environments only

## 📊 File Count Summary

| Directory | File Count | Purpose |
|-----------|------------|---------|
| migrations | 6 | Chronological database changes |
| schemas | 9 | Complete database schemas |
| tables | 10 | Individual table definitions |
| rls-policies | 2 | Security policies |
| functions | 8 | Stored procedures & RPCs |
| utilities | 2 | Maintenance scripts |
| sample-data | 1 | Test data |
| **Total** | **38** | **All SQL files** |

---

*Last updated: January 20, 2026*
*Organized for better maintainability and navigation*
