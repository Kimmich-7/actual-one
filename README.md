#### Juja St. Peters School Coding Platform — High-Level Project Summary

Juja St. Peters School Coding Platform is a learner-centric coding environment that unifies teaching, administration, and student coding experiences, with a focus on educational progression and consistent, accessible user experience.

## Core Identity
A cohesive, educator-focused platform delivering engaging coding editors, progressive typing skills, Minecraft programming challenges, and integrated tooling, all with a consistent dark-theme experience.

## Key Capabilities
- Unified, editor-driven coding environments for Python, Scratch (MIT Scratch integration), Robotics (mBlocks), and web technologies, with a cohesive, dark-theme UX across courses
- Progressive typing skills with structured learning levels (Single Letters → Words → Sentences → Games)
- Minecraft programming course featuring puzzle-based challenges to teach logic and problem-solving in a familiar sandbox
- Improved Scratch MIT integration via robust iframe handling and richer interactivity
- Learner-friendly landing visuals and consistent branding across pages
- Authentication improvements to reduce warnings and provide secure, reliable access
- Centralized content workflows and progress tracking to support instructors and admins
- Consistent editor layouts to streamline learning across all courses
- **Integrated notes system with strand/sub-strand organization for structured learning materials**
- **Quiz system with topic-based filtering from uploaded course notes**
- **Comprehensive admin dashboard with leaderboard filters and curriculum management**
- **Notes button available in all course editors - always visible, displays "No notes available" when notes haven't been uploaded yet**

## Why This Matters
- Elevates the learning journey by aligning activities with grade-appropriate prerequisites and clear progression paths
- Improves learner engagement through refined visuals, coherent UI, and meaningful, puzzle-driven courses
- Enables teachers and admins to monitor progress and tailor support with unified tooling and reporting
- **Provides students with easy access to study materials organized by topic and sub-topic**
- **Allows targeted assessment through quiz topics that align with uploaded notes**

## Recent Improvements at a Glance
- Fixed authentication warnings: refined auth checks to show warnings only when appropriate, improving user experience
- Updated learner-friendly images: refreshed landing visuals with school-life imagery for clarity and appeal
- Enhanced Scratch MIT integration: improved iframe handling and interactivity for Scratch projects
- Redesign of typing skills: introduced progressive levels and a consistent dark-themed layout across editors
- New Minecraft programming course: puzzle-based challenges to teach computational thinking in a familiar world
- Consistent dark-theme layouts across all editors: unified look-and-feel for a cohesive experience
- Enhanced UX and education progression: clearer learning paths, improved workflows, and centralized progress tracking
- **Fixed Convex database errors in notes and curriculum uploads by handling missing admin users gracefully**
- **Added Notes and Quiz buttons side-by-side in student course cards for easy access to learning materials**
- **Implemented dropdown-based strand/sub-strand selection for quizzes populated from uploaded course notes**
- **Integrated notes viewer directly into course pages with dedicated tab for seamless study experience**
- **Fixed student project View and Edit buttons with proper event handling and navigation**
- **Enabled teacher editing functionality with support for multiple subjects**
- **Enabled parent editing functionality with simplified form for name and email updates**
- **Fixed class viewing and editing functionality with proper student details display in admin panel**
- **CRITICAL FIX: Completely rewrote admin panel dialog state management - all View and Edit buttons now work correctly across Classes, Students, Parents, and Teachers tabs using explicit boolean dialog state flags instead of object-based conditionals**
- **Added Notes button to ALL specialized course editors (Python, Scratch, Robotics, Minecraft, Typing Skills, and Web Development) - now accessible from every course for easy access to study materials**
- **Enhanced teacher dashboard with class-specific views - teachers can now click on any class to view student lists and performance leaderboards for that class**
- **Fixed Quiz Attempts statistic on teacher dashboard - now correctly shows total number of quiz attempts across all students instead of student count**
- **Fixed Average Score calculation on teacher dashboard - now properly averages across all quiz sessions for accurate performance metrics**
- **Added student search filter to teacher dashboard - teachers can quickly find students by name, username, grade, or class**
- **Removed all debug/dummy implementations - deleted app/debug directory for clean, straightforward development**
- **Quiz system fully operational with strand/sub-strand organization:**
  - Admins must upload course notes first (organized by strand/sub-strand)
  - Quizzes are created per strand and sub-strand based on uploaded notes
  - Students select strand and sub-strand before starting a quiz using the same interface as notes
  - Quiz questions are filtered to match the selected topic
  - Scores and completion tracking work correctly with proper authentication
  - Quiz interface mirrors the notes interface for consistent user experience
  - Admin quiz creation has dropdown selectors for strand and sub-strand (populated from existing course notes)
  - Student quiz view has topic selection interface identical to notes system
  - Fixed tab navigation - quiz view now activates correctly when accessed from student dashboard
- **Simplified Scratch and Scratch Jr editors - removed redundant "Open Scratch" and "Open Scratch Jr" buttons for cleaner, more focused interface**
- **Class Performance Badges on Teacher Dashboard - each class card now displays performance level (Below Expectations, Approaching Expectations, Meeting Expectations, Exceeding Expectations) based on student quiz scores**
- **Teacher Performance Rating System - teachers can now see their overall performance rating calculated from their classes' quiz performance**
- **Enhanced School Dashboard with Teacher Performance Metrics - school administrators can view individual teacher performance ratings, class breakdowns, and performance categories**
- **Separate School Admin Login System - created dedicated login portal at /school/login for school administrators with separate authentication**

## How It Helps Students and Educators
- Faster, more intuitive access to powerful editors with consistent controls
- Clear progression through typing, Scratch, Python, robotics, and Minecraft modules
- Targeted support through centralized progress visibility and standardized workflows
- Engaging visuals and game-like practice to sustain motivation and curiosity

## Editors and Experiences (High-Level Overview)
- Python Editor: structured project saving and consistent UI
- Scratch Editor: MIT Scratch integration with improved iframe experience
- Robotics Editor: robotics-focused editing and external IDE access
- Typing Skills Editor: redesigned with progressive levels and a dark theme
- Web Editors: CodePen-style editors where applicable
- Minecraft Editor: Minecraft-based challenges and puzzle-driven tasks
- Consistent Layouts: uniform UX across all editors for a cohesive platform

## Usage Philosophy for AI Agents
- Essence-first: Describe what the platform does and why, without implementation details
- Brand-aligned: Reflect Juja St. Peters School identity in UI and copy
- Value-focused: Emphasize features and workflows most relevant to students and staff

## How to Engage (High-Level)
- Explore the landing page to learn about features and progression
- Use the specialized editors to create, save, and review projects
- Authenticate to access personalized dashboards and submission workflows
- Rely on consistent editor layouts for efficient learning across courses
- Leverage external tool integrations (MIT Scratch, mBlocks) to extend learning

## Branding and Identity
- Consistent branding across UI elements, headers, footers, logos, and captions
- Learner-centric visuals and copy aligned with Juja St. Peters School identity

## Why This Matters for AI Agents
- This README provides a concise, task-relevant map of the platform’s purpose and capabilities, enabling quick assessment of relevance for tasks related to Juja St. Peters School coding education and AI-assisted automation or content generation.

## Vision for the Future
- Continue tightening authentication flows and UX polish
- Expand progressive learning paths and course catalog (including additional puzzle-based and game-based learning modules)
- Maintain a cohesive dark-themed experience across all editors and platforms
- Elevate teacher/admin tooling for deeper progress insights and scalable classroom management









