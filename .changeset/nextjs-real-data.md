---
'web': minor
'api': minor
---

Next.js web reads and writes through the API: recipe detail and create views, weekly plan and shopping list use the oRPC client with the Better Auth session cookie. The API resolves the household from that cookie via its own Better Auth instance against the shared database.
