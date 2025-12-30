import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (app.get("env") === "production" && !sessionSecret) {
    throw new Error("SESSION_SECRET must be set in production");
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret || "r3pl1t_s3cr3t",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: app.get("env") === "production",
      sameSite: "lax",
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  const registerSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(8),
    name: z.string().min(1),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    location: z.string().optional(),
    phonePublic: z.boolean().optional(),
    emailPublic: z.boolean().optional(),
  });

  const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });

  // stricter per-route rate limiter for auth endpoints
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

  // mailer - only used if SMTP config is provided
  let mailer: nodemailer.Transporter | null = null;
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", authLimiter, async (req, res, next) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(parsed.password);
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const user = await storage.createUser({
        ...parsed,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpires,
      });

      // Send verification email if mailer is configured, otherwise log
      const verificationMessage = `Your verification code is: ${verificationCode}`;
      if (mailer) {
        try {
          await mailer.sendMail({
            from: process.env.SMTP_FROM || "noreply@example.com",
            to: user.email || user.username,
            subject: "Verify your account",
            text: verificationMessage,
          });
        } catch (err) {
          console.error("Failed to send verification email", err);
        }
      } else {
        console.log(`Verification code for ${user.username}: ${verificationCode}`);
      }

      // Do not return password to the client
      const { password: _pw, ...safeUser } = user as any;
      res.status(201).json({
        ...safeUser,
        message: "Registration successful. Please verify your email.",
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", issues: err.errors });
      next(err);
    }
  });

  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { userId, code } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) return res.sendStatus(404);
      if (!user.verificationCode || user.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
        return res.status(400).json({ message: "Verification code expired" });
      }

      const verifiedUser = await storage.verifyEmail(userId);
      req.login(verifiedUser, (err) => {
        if (err) return next(err);
        const { password: _pw, ...safeUser } = (verifiedUser as any) || {};
        res.status(200).json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post(
    "/api/login",
    authLimiter,
    (req, res, next) => {
      try {
        loginSchema.parse(req.body);
        next();
      } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input" });
        return res.status(400).json({ message: "Invalid input" });
      }
    },
    passport.authenticate("local"),
    (req, res) => {
      const { password: _pw, ...safeUser } = (req.user as any) || {};
      res.status(200).json(safeUser);
    },
  );

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password: _pw, ...safeUser } = (req.user as any) || {};
    res.json(safeUser);
  });

  // Password reset request: generate token and email to user if exists
  const passwordResetRequestSchema = z.object({ username: z.string().min(1) });
  const passwordResetConfirmSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8) });

  app.post("/api/password-reset/request", authLimiter, async (req, res, next) => {
    try {
      const { username } = passwordResetRequestSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      // Always respond with success to avoid leaking account existence
      if (!user) {
        return res.status(200).json({ message: "If an account exists, a password reset email has been sent." });
      }

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, token, expires);

      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
      const text = `You requested a password reset. Use this link to reset your password (valid for 1 hour): ${resetLink}`;

      if (mailer) {
        try {
          await mailer.sendMail({
            from: process.env.SMTP_FROM || "noreply@example.com",
            to: user.email || user.username,
            subject: "Password reset request",
            text,
          });
        } catch (err) {
          console.error("Failed to send password reset email", err);
        }
      } else {
        console.log(`Password reset link for ${user.username}: ${resetLink}`);
      }

      return res.status(200).json({ message: "If an account exists, a password reset email has been sent." });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input" });
      next(err);
    }
  });

  // Confirm password reset using token
  app.post("/api/password-reset/confirm", authLimiter, async (req, res, next) => {
    try {
      const { token, newPassword } = passwordResetConfirmSchema.parse(req.body);
      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) return res.status(400).json({ message: "Invalid or expired token" });
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashed = await hashPassword(newPassword);
      const updated = await storage.updateUserPassword(user.id, hashed);

      // Auto-login the user after reset
      req.login(updated, (err) => {
        if (err) return next(err);
        const { password: _pw2, ...safeUser2 } = (updated as any) || {};
        res.status(200).json({ message: "Password updated", user: safeUser2 });
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid input" });
      next(err);
    }
  });
}
