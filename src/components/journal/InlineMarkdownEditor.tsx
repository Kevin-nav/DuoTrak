"use client";

import { ChangeEvent, KeyboardEvent, RefObject, useRef } from "react";
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
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedTextareaRef = textareaRef ?? internalTextareaRef;

  const handleScroll = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  const insertAtSelection = (insertion: string, moveCursorBy = insertion.length) => {
    const target = resolvedTextareaRef.current;
    if (!target) return;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
    const nextPos = start + moveCursorBy;
    onChange(nextValue);
    requestAnimationFrame(() => {
      const el = resolvedTextareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  const replaceCurrentLine = (
    replacement: string,
    cursorFromLineStart: number,
    start: number,
    end: number
  ) => {
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextBreak = value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`;
    const nextPos = lineStart + cursorFromLineStart;
    onChange(nextValue);
    requestAnimationFrame(() => {
      const el = resolvedTextareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const hasRangeSelection = start !== end;
    if (hasRangeSelection) return;

    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextBreak = value.indexOf("\n", start);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const line = value.slice(lineStart, lineEnd);
    const beforeCursorInLine = value.slice(lineStart, start);

    if (event.key === "Enter") {
      const todoMatch = /^(\s*[-*]\s+\[(?: |x|X)\]\s+)(.*)$/.exec(line);
      if (todoMatch) {
        event.preventDefault();
        const content = todoMatch[2].trim();
        if (!content) {
          const stripped = line.replace(/^(\s*[-*]\s+\[(?: |x|X)\]\s+)/, "");
          replaceCurrentLine(stripped, 0, start, end);
          return;
        }
        const leadingWhitespace = (/^\s*/.exec(todoMatch[1]) || [""])[0];
        insertAtSelection(`\n${leadingWhitespace}- [ ] `);
        return;
      }

      const bulletMatch = /^(\s*[-*]\s+)(.*)$/.exec(line);
      if (bulletMatch) {
        event.preventDefault();
        const content = bulletMatch[2].trim();
        if (!content) {
          const stripped = line.replace(/^(\s*[-*]\s+)/, "");
          replaceCurrentLine(stripped, 0, start, end);
          return;
        }
        insertAtSelection(`\n${bulletMatch[1]}`);
        return;
      }

      const numberedMatch = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
      if (numberedMatch) {
        event.preventDefault();
        const content = numberedMatch[3].trim();
        if (!content) {
          const stripped = line.replace(/^(\s*)\d+\.\s+/, "$1");
          replaceCurrentLine(stripped, 0, start, end);
          return;
        }
        const nextNumber = Number(numberedMatch[2]) + 1;
        insertAtSelection(`\n${numberedMatch[1]}${nextNumber}. `);
        return;
      }
    }

    if (event.key === "Backspace" && start === lineStart + beforeCursorInLine.length) {
      const removablePrefix =
        /^(\s*[-*]\s+\[(?: |x|X)\]\s+|\s*[-*]\s+|\s*\d+\.\s+|#{1,6}\s+|>\s+|!\s+)/.exec(line)?.[0];
      if (removablePrefix && beforeCursorInLine.length <= removablePrefix.length) {
        event.preventDefault();
        const nextLine = line.slice(removablePrefix.length);
        replaceCurrentLine(nextLine, 0, start, end);
      }
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-landing-clay ${minHeightClass}`}>
      <div
        ref={overlayRef}
        aria-hidden
        className="pointer-events-none h-full overflow-auto px-3 py-2 text-sm leading-6 font-sans"
      >
        {value.trim().length > 0 ? (
          <div className="max-w-none text-landing-espresso">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="m-0 whitespace-pre-wrap leading-6">{children}</p>,
                h1: ({ children }) => <h1 className="m-0 text-base font-black leading-6">{children}</h1>,
                h2: ({ children }) => <h2 className="m-0 text-[15px] font-extrabold leading-6">{children}</h2>,
                h3: ({ children }) => <h3 className="m-0 text-sm font-bold leading-6">{children}</h3>,
                ul: ({ children }) => <ul className="m-0 list-disc pl-5 leading-6">{children}</ul>,
                ol: ({ children }) => <ol className="m-0 list-decimal pl-5 leading-6">{children}</ol>,
                li: ({ children }) => <li className="m-0 leading-6">{children}</li>,
                strong: ({ children }) => <strong className="font-black text-landing-espresso">{children}</strong>,
                em: ({ children }) => <em className="italic text-landing-espresso">{children}</em>,
                input: ({ checked }) => (
                  <input
                    type="checkbox"
                    checked={!!checked}
                    readOnly
                    className="mr-1.5 h-3.5 w-3.5 translate-y-[1px] align-middle accent-landing-terracotta"
                  />
                ),
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
        ref={resolvedTextareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck
        className="absolute inset-0 h-full w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 font-sans text-transparent caret-landing-espresso outline-none selection:bg-landing-terracotta/25"
      />
    </div>
  );
}
