"use client";

import { ChangeEvent, RefObject, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type InlineMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  textareaRef?: RefObject<HTMLTextAreaElement>;
};

export default function InlineMarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeightClass = "min-h-[220px]",
  textareaRef,
}: InlineMarkdownEditorProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-landing-clay ${minHeightClass}`}>
      <div
        ref={overlayRef}
        aria-hidden
        className="pointer-events-none h-full overflow-auto px-3 py-2 text-sm leading-relaxed"
      >
        {value.trim().length > 0 ? (
          <div className="prose prose-sm max-w-none text-landing-espresso prose-p:my-1.5 prose-headings:my-2 prose-headings:text-landing-espresso">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ children }) => <strong className="font-extrabold text-landing-espresso">{children}</strong>,
                em: ({ children }) => <em className="italic text-landing-espresso">{children}</em>,
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-landing-espresso-light/40">{placeholder}</p>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={handleScroll}
        spellCheck
        className="absolute inset-0 h-full w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-transparent caret-landing-espresso outline-none selection:bg-landing-terracotta/25"
      />
    </div>
  );
}

