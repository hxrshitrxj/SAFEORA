import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const UploadDocumentSchema = z.object({
  filename: z.string().min(1, "Filename is required").max(255),
  mimeType: z.string().default("application/octet-stream"),
  envelope: z.object({
    version: z.literal("1.0.0"),
    algorithm: z.literal("AES-256-GCM"),
    iv: z.string().min(1),
    ciphertext: z.string().min(1),
    keyFingerprint: z.string().length(64),
    createdAt: z.string(),
  }),
});

export const UpdateDocumentSchema = z.object({
  filename: z.string().min(1).max(255),
});

export const RestoreVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
  reason: z.string().optional(),
});

export const UpdateIncidentSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "CONTAINED", "RECOVERING", "RESOLVED", "FALSE_POSITIVE"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  emailAlerts: z.boolean().optional(),
  notifyIntegrityFailure: z.boolean().optional(),
  notifySuspiciousActivity: z.boolean().optional(),
  autoContainSession: z.boolean().optional(),
  autoQuarantineTampered: z.boolean().optional(),
  defaultVerificationFreq: z.enum(["HOURLY", "DAILY", "WEEKLY", "MANUAL"]).optional(),
});
