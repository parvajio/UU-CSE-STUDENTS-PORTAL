# Auth Contract

**Layer**: Auth.js (NextAuth v5) — JWT strategy

## Session Shape

```typescript
interface Session {
  user: {
    id: string;       // users.id (uuid)
    email: string;    // users.email
    role: Role;       // "user" | "moderator" | "admin"
  };
  expires: string;    // ISO date string
}
```

Guests have no session object — `auth()` returns `null`.

## Role Type

```typescript
type Role = "user" | "moderator" | "admin";
// "guest" is not a stored role — it is inferred from absent session
```

## Middleware Protection Rules

```typescript
const routePermissions: Record<string, Role[]> = {
  // Guest-accessible (no auth required)
  "/directory":             [],
  "/faculty":               [],
  "/question-bank":         [],
  "/clubs":                 [],
  "/alumni":                [],
  "/events":                [],
  "/notices":               [],
  "/achievements":          [],
  "/projects":              [],
  "/certificate-verify":    [],

  // User-accessible
  "/profile":               ["user", "moderator", "admin"],
  "/profile/edit":          ["user", "moderator", "admin"],
  "/upload-question":       ["user", "moderator", "admin"],
  "/my-submissions":        ["user", "moderator", "admin"],
  "/helpline":              ["user", "moderator", "admin"],
  "/career-guidance":       ["user", "moderator", "admin"],
  "/cgpa-calculator":       ["user", "moderator", "admin"],
  "/blood-donor":           ["user", "moderator", "admin"],

  // Moderator-accessible
  "/approve/questions":     ["moderator", "admin"],

  // Admin-accessible
  "/approve/profiles":      ["admin"],
  "/manage/roles":          ["admin"],
  "/manage/faculty":        ["admin"],
  "/manage/clubs":          ["admin"],
  "/manage/alumni":         ["admin"],
  "/manage/events":         ["admin"],
  "/manage/skills":         ["admin"],
  "/manage/settings":       ["admin"],
};
```

## Providers

- **Credentials**: email + password → verify against `users.passwordHash` (bcrypt)
- **Google**: OAuth2 → create user on first login if email not found
- **Unclaimed**: accounts with `authProvider = 'unclaimed'` have no passwordHash and no real login — they are admin-created placeholders for legacy alumni. The account stays locked until the alum completes a claim-account flow (out of scope for Foundation).

## JWT Callback

```typescript
// Extend default token with role from DB
async jwt({ token }) {
  if (token.sub) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, token.sub),
    });
    token.role = user?.role ?? "user";
  }
  return token;
}

// Pass role to client session
async session({ session, token }) {
  session.user.role = token.role as Role;
  session.user.id = token.sub as string;
  return session;
}
```
