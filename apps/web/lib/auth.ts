import { betterAuth } from "better-auth";
import { sql } from "@neondatabase/serverless";

const db = sql;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: {
    type: "postgres",
    async execute(query: string, params?: unknown[], options?: { arrayMode: boolean }) {
      try {
        const result = await db(query, params || []);
        if (options?.arrayMode) {
          return { rows: result };
        }
        return { rows: result };
      } catch (error) {
        throw error;
      }
    },
  },
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
