"use client";

import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

type JournalRichTextVariant = "full" | "preview";

interface JournalRichTextProps {
  html?: string | null;
  variant?: JournalRichTextVariant;
  className?: string;
}

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h1", "h2", "h3", "div", "span", "label", "input"],
  ALLOWED_ATTR: ["type", "checked"],
};

let sanitizerHooksRegistered = false;

const ensureSanitizerHooks = () => {
  if (sanitizerHooksRegistered) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node: unknown) => {
    if (!(node instanceof Element) || node.nodeName?.toUpperCase() !== "INPUT") return;
    const input = node as HTMLInputElement;
    input.setAttribute("type", "checkbox");
    if (!input.checked) {
      input.removeAttribute("checked");
    }
  });
  sanitizerHooksRegistered = true;
};

export const sanitizeJournalRichText = (html: string) => {
  if (!html) return "";
  ensureSanitizerHooks();
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};

const VARIANT_CLASSNAME: Record<JournalRichTextVariant, string> = {
  full:
    "journal-entry-body max-w-none break-words text-sm text-landing-espresso-light [&_h1]:my-1 [&_h1]:text-base [&_h1]:font-black [&_h1]:text-landing-espresso [&_h2]:my-1 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:text-landing-espresso [&_h3]:my-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-landing-espresso [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5",
  preview:
    "journal-entry-preview max-w-none break-words text-xs text-stone-gray dark:text-gray-300 [&_h1]:my-0.5 [&_h1]:text-xs [&_h1]:font-bold [&_h2]:my-0.5 [&_h2]:text-xs [&_h2]:font-bold [&_h3]:my-0.5 [&_h3]:text-xs [&_h3]:font-semibold [&_li]:my-0 [&_p]:my-0.5 [&_ul]:list-disc [&_ul]:pl-4",
};

export default function JournalRichText({
  html,
  variant = "full",
  className,
}: JournalRichTextProps) {
  const sanitized = sanitizeJournalRichText(html || "");
  if (!sanitized) return null;

  return (
    <div
      className={cn(VARIANT_CLASSNAME[variant], className)}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
