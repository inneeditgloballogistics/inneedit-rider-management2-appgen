import { betterAuth } from "better-auth";
import { postgresAdapter } from "better-auth/adapters/postgres";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: postgresAdapter(pool),
  secret: process.env.BETTER_AUTH_SECRET || "default-secret",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["*"],
  advanced: {
    crossOriginCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    disableCSRFCheck: true,
  },
});
