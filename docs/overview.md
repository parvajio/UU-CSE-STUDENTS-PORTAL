# CSE Students Portal — Full Project Overview

**Organized by:** CSE Students Association
**Motto:** "One Platform, Endless Opportunities for CSE Students."

---

## 1. Vision

A single web platform that centralizes everything a CSE student currently has to chase across scattered Facebook groups, WhatsApp chats, and word-of-mouth: who's good at what, what past exam questions looked like, who's hiring, which senior can help right now, and what's happening in the department. Every piece of content that reaches other students is checked by an admin or moderator first, so the platform stays trustworthy instead of turning into unmoderated noise.

---

## 2. Who Uses It (User Types)

| Type | Can do |
|---|---|
| **Guest (not logged in)** | Search/browse names, skill tags, faculty list — no contact details, no downloads |
| **User (logged in student)** | Full profile views, download question papers, submit/edit own profile, submit questions, request help |
| **Moderator** | Everything a User can, plus: approve/reject lower-sensitivity submissions (e.g. question uploads) |
| **Admin** | Everything, plus: approve/reject profiles and sensitive content, assign roles, manage clubs/faculty/alumni records, full moderation queue |

Every submission from a User enters the system as **pending** and only becomes visible to others once a Moderator or Admin approves it. This one rule underlies the whole platform.

---

## 3. Module-by-Module Breakdown

### 3.1 Student Expert Directory
Searchable directory of students tagged by skill, so anyone needing help (a teammate for a hackathon, a junior looking for a mentor) can find the right person.
- Skill categories (Web Dev, ML/AI, Competitive Programming, Cybersecurity, etc.), each with **subskills** (e.g. Web Development → Next.js, TypeScript, Node.js)
- A profile can hold multiple skills/subskills at once
- Each profile: photo, batch, socials (Facebook/LinkedIn), WhatsApp, portfolio/GitHub, skills, achievements
- Sections can surface "Top" students per skill (admin-curated or endorsement-based — decide later)
- Guests see name + skill tags only; full contact info requires login

### 3.2 Faculty Directory
Reference list of department faculty — not self-service, admin-managed.
- Designation, email, phone, research interests, office room

### 3.3 Alumni Career Network
Connects current students to graduates for guidance and referrals.
- Current company, job position, LinkedIn/Facebook, contact info
- "Request career guidance" action lets a student reach out formally rather than cold-messaging

### 3.4 Digital Question Bank
Searchable archive of past exam material.
- Categorized by type: previous year, midterm/final, lab exam, viva
- Tagged by subject, batch, course, date
- Filterable search; supports image/PDF uploads
- Every upload is a User submission → pending → Moderator/Admin approval before it's searchable by others

### 3.5 Clubs & Executive Body
Home for CSE Students Association and its affiliated clubs (CPC, Cybersecurity, ML, Research, Robotics, Culture, Sports, Adventure).
Each club page has: executive committee, advisor info, member list, activities, achievement gallery.

### 3.6 Event & Program Gallery
Photo/media archive of seminars, workshops, contests, club activities, and achievements — plus an **upcoming event countdown** (next event date, live timer, details, registration button).

### 3.7 CSE Learning Academy
Structured courses/recorded classes, including premium content, with progress tracking, certificates, and instructor info. (Lowest priority — build after the directory/question bank/clubs are stable.)

### 3.8 Student Helpline
Directory of ~20 senior students available for academic/career/emergency support, with WhatsApp/Facebook contact — a fast path to a real person rather than searching the full directory.

### 3.9 Supporting Features
CGPA calculator, academic routine/calendar, notice board, blood donor directory, lost & found, project showcase, freelancer directory, achievement hall of fame, certificate verification, internship/job/scholarship boards, research paper repository, general resource-sharing hub.

---

## 4. How Content Moves Through the System (Approval Workflow)

This is the backbone pattern reused across almost every module (profiles, questions, club posts):

```
User submits/edits content
        │
        ▼
   status = "pending"
        │
        ▼
Moderator or Admin reviews
   (queue in their dashboard)
        │
   ┌────┴────┐
   ▼         ▼
Approved   Rejected
   │         │
   ▼         ▼
Visible   Hidden, user notified
to others  (optionally with reason)
```

Because every submittable resource shares the same `status / approvedBy / approvedAt` shape, you build **one** approval dashboard UI and reuse it for profiles, questions, and any future submittable content — instead of a bespoke review flow per module.

---

## 5. Access Rules at a Glance

| Content | Guest | User | Moderator | Admin |
|---|---|---|---|---|
| Search directory/questions | ✅ | ✅ | ✅ | ✅ |
| View full profile/contact details | ❌ | ✅ | ✅ | ✅ |
| Download question papers | ❌ | ✅ | ✅ | ✅ |
| Submit profile / question / etc. | ❌ | ✅ (pending) | ✅ | ✅ |
| Approve questions | ❌ | ❌ | ✅ | ✅ |
| Approve profiles / manage roles | ❌ | ❌ | ❌ | ✅ |

---

## 6. Technical Shape (from prior discussion)

- **Frontend/Backend:** Next.js (App Router) + TypeScript, single deployable app
- **UI:** shadcn/ui + Tailwind
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle
- **Auth:** Auth.js (NextAuth v5), role stored in session/JWT
- **File storage:** Cloudflare R2 or UploadThing (question PDFs, images, certificates)
- **Search:** Postgres full-text search to start

*(Full reasoning for these choices is in `guidelines.md` — this overview is the "what and why," that one is the "how." Exact table/field shape is in `data-dictionary.md`, and visual identity — colors, typography, glassmorphism/tag styling — is in `design-direction.md`.)*

---

## 7. Build Order (so scope doesn't stall the launch)

1. **Foundation:** Auth + roles, Student Profile system + skill tagging, Admin approval dashboard
2. **Core content:** Digital Question Bank, Faculty Directory
3. **Community:** Clubs & Executive Body, Alumni Network, Notice Board
4. **Engagement:** Event Gallery + countdown, Achievement Hall of Fame, Project Showcase
5. **Extras:** CGPA calculator, routine/calendar, blood donor directory, lost & found, freelancer directory, Learning Academy

Ship Phase 1 as a usable MVP before touching Phase 5 — the association gets value (a real, moderated directory) long before the full feature list is done.
