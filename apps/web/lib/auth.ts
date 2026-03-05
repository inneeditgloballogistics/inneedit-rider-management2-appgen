import { betterAuth } from "better-auth";
import { postgres } from "better-auth/database";
import { sql } from "@neondatabase/serverless";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: postgres({
    client: sql,
  }),
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
