// Better Auth: Google + email magic link. Cookie sessions for the web app; the `bearer`
// plugin lets the future mobile app send `Authorization: Bearer <session token>` instead.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins/bearer";
import { magicLink } from "better-auth/plugins/magic-link";
import { getDb } from "../db/client";
import { account, rateLimit, session, user, verification } from "../db/schema";
import { env } from "../env";
import { getMailer, magicLinkEmail } from "../lib/mailer";

function createAuth() {
  const e = env();
  const googleConfigured = Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);

  return betterAuth({
    appName: "TukTrail",
    baseURL: e.BETTER_AUTH_URL,
    secret: e.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification, rateLimit },
    }),
    user: {
      additionalFields: {
        // Never settable by clients; admins are promoted via seed/admin tools only.
        role: { type: "string", required: false, defaultValue: "user", input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24,
    },
    socialProviders: googleConfigured
      ? { google: { clientId: e.GOOGLE_CLIENT_ID!, clientSecret: e.GOOGLE_CLIENT_SECRET! } }
      : {},
    // On in production (Better Auth's default); off in dev/test so e2e can sign in repeatedly.
    rateLimit: { enabled: e.NODE_ENV === "production", storage: "database", window: 60, max: 30 },
    plugins: [
      magicLink({
        expiresIn: 5 * 60,
        async sendMagicLink({ email, url }) {
          await getMailer().send({ to: email, ...magicLinkEmail(url) });
        },
        rateLimit: { window: 60, max: e.NODE_ENV === "production" ? 3 : 100 },
      }),
      bearer(),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
let cached: Auth | undefined;

/** Lazy so `next build` and unit tests don't need auth env vars. */
export function getAuth(): Auth {
  cached ??= createAuth();
  return cached;
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
