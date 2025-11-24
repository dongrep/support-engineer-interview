import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isValidAge } from "@/helpers/ageValidator";
import { encryptSSN } from "@/helpers/ssnEncryption";
import { validatePassword } from "@/helpers/passowrdValidator";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        // Keep validation but do not silently lowercase via zod transform
        email: z.string().email(),
        password: z.string().refine((val) => validatePassword(val), {
          message:
            "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
        }),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().regex(/^\+?\d{10,15}$/),
        dateOfBirth: z.string().refine((dob) => isValidAge(dob), { message: "Date of birth must be at least 18 years before today" }),
        ssn: z.string().regex(/^\d{9}$/),
        address: z.string().min(1),
        city: z.string().min(1),
        state: z.string().length(2).toUpperCase(),
        zipCode: z.string().regex(/^\d{5}$/),
            })
          )
          .mutation(async ({ input, ctx }) => {
      // Normalize for comparison/storage, but don't rely on zod to mutate input
      const normalizedEmail = input.email.trim().toLowerCase();

      // Check for existing user using a case-insensitive comparison
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, normalizedEmail))
        .get();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const encryptedSSN = encryptSSN(input.ssn);

      // Insert using the normalized email to keep storage consistent
      await db.insert(users).values({
        ...input,
        email: normalizedEmail,
        password: hashedPassword,
        ssn: encryptedSSN,
      });

      // Fetch the created user
      const user = await db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, normalizedEmail))
        .get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Create session
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      // Set cookie
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      // Indicate if the email was normalized compared to what the user submitted
      const emailWasNormalized = normalizedEmail !== input.email;

      return { user: { ...user, password: undefined }, token, emailWasNormalized };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const user = await db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, normalizedEmail))
        .get();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Replace any existing sessions for this user with the new one
      
      await db.delete(sessions).where(eq(sessions.userId, user.id));
      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      return { user: { ...user, password: undefined }, token };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user) {
      // Delete session from database
      let token: string | undefined;
      
      // Try to get parsed cookies first (if middleware parsed them)
      if ("cookies" in ctx.req && (ctx.req as any).cookies?.session) {
        token = (ctx.req as any).cookies.session;
      } else {
        // Fall back to parsing the cookie header manually
        const cookieHeader = ctx.req.headers?.get?.("cookie") || (ctx.req.headers as any)?.cookie;
        token = cookieHeader
          ?.split("; ")
          .find((c: string) => c.startsWith("session="))
          ?.split("=")[1];
      }
      
      if (token) {
        await db.delete(sessions).where(eq(sessions.token, token));
      }
    }
    
    if ("setHeader" in ctx.res) {
      ctx.res.setHeader("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    } else {
      (ctx.res as Headers).set("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    }

    return { success: true, message: ctx.user ? "Logged out successfully" : "No active session" };
  }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .get();

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return { ...user, password: undefined };
  }),
});
