import { z } from 'zod';

// Enums
export enum AccountStatus {
  AWAITING_ONBOARDING = "AWAITING_ONBOARDING",
  AWAITING_PARTNERSHIP = "AWAITING_PARTNERSHIP",
  ONBOARDING_PARTNERED = "ONBOARDING_PARTNERED",
  ACTIVE = "ACTIVE",
}

export enum PartnershipStatus {
  ACTIVE = "active",
  PENDING = "pending",
  NO_PARTNER = "no_partner",
}

// Badge Schemas
export const BadgeReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string(),
  description: z.string(),
});

export const UserBadgeReadSchema = z.object({
  badge: BadgeReadSchema,
  earned_at: z.string().datetime(),
});

// Base User Schema
export const UserBaseSchema = z.object({
  email: z.string().email(),
  full_name: z.string().nullable(),
  nickname: z.string().nullable(),
});

// UserRead Schema (Frontend equivalent of backend's UserRead)
export const UserReadSchema = UserBaseSchema.extend({
  id: z.string().uuid(),
  firebase_uid: z.string(),
  account_status: z.nativeEnum(AccountStatus),
  partnership_status: z.nativeEnum(PartnershipStatus),
  partner_id: z.string().uuid().nullable(),
  partner_full_name: z.string().nullable(),
  partner_nickname: z.string().nullable(),
  partner_profile_picture_url: z.string().nullable().optional(),
  partnership_id: z.string().uuid().nullable(),
  sent_invitation: z.any().nullable(), // Adjust as needed if PartnerInvitation schema is available
  received_invitation: z.any().nullable(), // Adjust as needed
  bio: z.string().nullable(),
  profile_picture_url: z.string().nullable(),
  profile_picture_variants: z.object({
    original: z.string(),
    xl: z.string(),
    lg: z.string(),
    md: z.string(),
    sm: z.string(),
  }).nullable().optional(),
  timezone: z.string().nullable(),
  notifications_enabled: z.boolean().nullable(),
  current_streak: z.number().nullable(),
  longest_streak: z.number().nullable(),
  total_tasks_completed: z.number().nullable(),
  goals_conquered: z.number().nullable(),
  badges: z.array(UserBadgeReadSchema).default([]),
});

// Export types
export type UserRead = z.infer<typeof UserReadSchema>;
export type BadgeRead = z.infer<typeof BadgeReadSchema>;
export type UserBadgeRead = z.infer<typeof UserBadgeReadSchema>;
