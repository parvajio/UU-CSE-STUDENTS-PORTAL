# Quickstart: Club Section Validation Guide

**Branch**: `006-club-section` | **Date**: 2026-09-15

This guide validates the Club Section feature end-to-end. Run these scenarios to confirm the feature works.

## Prerequisites

- [ ] Dependencies installed: `npm install`
- [ ] Database connected and migrations applied: `npm run db:generate && npm run db:migrate`
- [ ] UploadThing configured with API key in `.env`
- [ ] Auth.js configured with admin credentials
- [ ] Development server running: `npm run dev`

## Validation Scenarios

### 1. Admin Creates Department and Club (P1)

**Steps**:
1. Log in as admin
2. Navigate to `/manage/clubs`
3. Create a department (e.g., name: "CSE", slug: "cse")
4. Create a club under that department (e.g., name: "ACM", description: "Coding club")
5. Verify both appear on `/clubs` without needing approval

**Expected**: Department and club appear immediately on `/clubs`. No approval step shown.

### 2. Guest Browsing Club Listing (P1)

**Steps**:
1. Log out (or use incognito)
2. Navigate to `/clubs`
3. Verify all approved departments are listed with their clubs

**Expected**: All departments grouped with their approved clubs visible. No login required.

### 3. Guest Views Club Detail (P1)

**Steps**:
1. Navigate to `/clubs/[clubId]` for any approved club
2. Verify: club name, description, logo, cover image, link fields
3. Verify members, gallery, achievements, and events sections render
4. Check countdown timer for any upcoming/ongoing events

**Expected**: All content sections render without requiring login.

### 4. Admin Manages Club Members (P2)

**Steps**:
1. Log in as admin
2. On a club's edit page, search for an approved profile
3. Add a profile with `roleInClub = "executive"` and `designation = "Group Admin"`
4. Verify member appears on club detail page

**Expected**: Member shows avatar, name, designation, roleInClub, and position.

### 5. Countdown Timer (P2)

**Steps**:
1. Create an event with `startTime` or `endTime` in the future
2. Navigate to the club detail page or events page
3. Verify timer counts down and updates every second
4. Switch tabs and return — verify timer resumes correctly

**Expected**: Timer is prominent, updates every second, resumes after tab switch.

### 6. Rate Limit Error (P2)

**Steps**:
1. As admin, rapidly create multiple clubs (exceed 5/hour)
2. Verify error message: "Rate limit reached — try again in X minutes"

**Expected**: Clear error with time remaining displayed.

### 7. Dark Mode (P1)

**Steps**:
1. Toggle dark mode
2. Verify `/clubs` page renders correctly in dark mode
3. Verify all glass panels, tags, and cards look correct

**Expected**: All components render correctly in both light and dark modes.

## Running Tests

```bash
# Run Playwright e2e tests
npx playwright test

# Run in headed mode for debugging
npx playwright test --headed
```

## Database Schema Validation

```bash
# Generate new migration after schema changes
npm run db:generate

# Push schema to database
npm run db:push
```

## Key Files Reference

- **Schema**: `src/lib/db/schema/departments.ts`, `src/lib/db/schema/clubs.ts`, `src/lib/db/schema/events.ts`
- **Rate limiting**: `src/lib/rate-limit.ts`
- **UploadThing**: `src/lib/uploads/`
- **Middleware**: `src/lib/middleware.ts`
- **Public routes**: `src/app/clubs/`
- **Admin routes**: `src/app/manage/clubs/`
