import { betterAuth } from "better-auth";
import { neonAdapter } from "@better-auth/neon";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: neonAdapter(process.env.DATABASE_URL),
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
