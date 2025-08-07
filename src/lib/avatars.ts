// src/lib/avatars.ts

/**
 * A library of predefined avatar URLs for users to choose from.
 * Using a centralized file makes it easy to update, add, or remove avatars in the future.
 *
 * In a real application, these would be URLs to images stored in a CDN or public folder.
 * For now, we'll use placeholder SVGs to match the project's current style.
 */

export const avatarLibrary: string[] = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg",
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
  "/avatars/avatar-6.svg",
  "/avatars/avatar-7.svg",
  "/avatars/avatar-8.svg",
];

// We also need to create the actual SVG files.
// For this example, we'll assume simple, colored circles with initials or patterns.
// The following steps would be to create these files in the /public/avatars/ directory.
