import { betterAuth } from "better-auth";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: {
    provider: "postgresql",
    client: pool,
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        const salt = crypto.randomBytes(32).toString("hex");
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
        return `${salt}:${hash}`;
      },
      verify: async (password: string, hash: string) => {
        try {
          const [salt, storedHash] = hash.split(":");
          if (!salt || !storedHash) return false;
          const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
          return computedHash === storedHash;
        } catch {
          return false;
        }
      },
    },
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
