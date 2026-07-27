# Quickstart: Portal User Scenarios — Validation Guide

**Phase**: 1 — Design & Contracts
**Date**: 2026-07-27

## Prerequisites

- Node.js 20 LTS
- PostgreSQL database (Neon connection string in `.env`)
- Auth.js providers configured (Google OAuth credentials if using Google provider)

## Setup

```bash
# Install dependencies
npm create next@latest cse-students-portal -- --typescript --tailwind --eslint --app --src-dir
npm install drizzle-orm @neondatabase/serverless drizzle-kit next-auth@beta @auth/core
npm install @radix-ui/* lucide-react class-variance-authority clsx tailwind-merge next-themes
npm install uploadthing @uploadthing/react
npm install -D vitest @testing-library/react @playwright/test

# Environment variables
cp .env.example .env
# Fill in: DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, UPLOADTHING_SECRET
```

## Database Setup

```bash
# Generate and apply schema
npx drizzle-kit generate
npx drizzle-kit migrate

# Seed initial data (skills, admin user, test faculty)
npx tsx src/lib/db/seed.ts
```

## Running

```bash
npm run dev
# Opens at http://localhost:3000
```

## Validation Scenarios

### Scenario 1: Guest Directory Browsing

**Prerequisites**: At least one approved profile with skills exists in the DB.

1. Open `http://localhost:3000` in a private/incognito browser window
2. Navigate to the Student Expert Directory
3. **Expected**: Search results show profile cards with only `fullName`, `batchNumber`, and skill tag names
4. **Expected**: No contact info (whatsappNumber, social links, portfolio) appears anywhere
5. **Expected**: No "Download" button on any question paper

### Scenario 2: Profile Submission & Approval Lifecycle

1. Register as a new user (email + password)
2. Navigate to "Create Profile" and fill in: fullName, studentId, batchNumber, section, select skills
3. Submit
4. **Expected**: Confirmation message and profile shows "Pending Review" (amber badge)
5. Log out and search for your name as a guest
6. **Expected**: Profile does not appear in search results
7. Log in as admin, open the approval dashboard
8. **Expected**: Profile appears in the unified pending queue
9. Click "Approve"
10. Log out and search again as guest
11. **Expected**: Profile now appears in search results

### Scenario 3: Role-Based Access Control

1. As a guest, try to navigate to `/profile`
2. **Expected**: Redirected to login page
3. Log in as a regular user, try to navigate to `/manage/roles`
4. **Expected**: 403 Forbidden or access-denied message
5. Log in as admin, open `/manage/roles`
6. **Expected**: Role management UI is visible and functional

### Scenario 4: Question Bank Upload & Moderate

1. Log in as a student, navigate to the Digital Question Bank
2. Click "Upload Question" and fill in title, subject, course, batch, examType, attach a PDF
3. Submit
4. **Expected**: Question shows as "Pending Review" to the submitter, invisible to others
5. Log in as a moderator, open the approval dashboard
6. **Expected**: See the pending question (but NOT any pending profiles — those are admin-only)
7. Approve the question
8. **Expected**: Question appears in public search results with a download button

### Scenario 5: Alumni Self-Toggle

1. Log in as a student with an approved profile
2. Open profile edit page, toggle "I am an alumnus"
3. Fill in currentCompany and jobPosition
4. **Expected**: Profile appears in both Student Expert Directory and Alumni Career Network
5. **Expected**: No re-approval needed if only the alumni toggle was changed

### Scenario 6: Career Guidance Request

1. Log in as a student, navigate to Alumni Network
2. Find an alumnus, click "Request Career Guidance"
3. Write a message and send
4. Log in as the alumnus user
5. **Expected**: See the pending guidance request in your inbox
6. Click "Accept"
7. Log in as the original student
8. **Expected**: See notification that the request was accepted

### Scenario 7: Rate Limit Enforcement

1. Log in as a user
2. Submit 5 questions in rapid succession
3. **Expected**: The 6th submission attempt returns a rate-limit error with recommended retry time

### Scenario 8: In-App Notification

1. As admin, approve or reject a pending item belonging to user X
2. Log in as user X
3. **Expected**: Bell icon in navbar shows an unread count badge
4. Click the bell icon
5. **Expected**: Dropdown shows the approval notification
6. Click the notification
7. **Expected**: Navigated to the relevant resource page
