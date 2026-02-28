"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, RefObject, useEffect, useRef } from "react";

type InlineMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  editorRef?: RefObject<HTMLDivElement>;
};

export default function InlineMarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeightClass = "min-h-[220px]",
  editorRef,
}: InlineMarkdownEditorProps) {
  const internalEditorRef = useRef<HTMLDivElement | null>(null);
  const resolvedEditorRef = editorRef ?? internalEditorRef;

  useEffect(() => {
    const editor = resolvedEditorRef.current;
    if (!editor) return;
    if (editor.innerHTML === value) return;
    editor.innerHTML = value;
  }, [resolvedEditorRef, value]);

  const syncHtmlToState = () => {
    const editor = resolvedEditorRef.current;
    if (!editor) return;
    editor.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
      if (input.checked) {
        input.setAttribute("checked", "checked");
      } else {
        input.removeAttribute("checked");
      }
    });
    onChange(editor.innerHTML);
  };

  const getActiveRange = (editor: HTMLDivElement) => {
    const selection = window.getSelection();
    if (!selection) return null;
    if (selection.rangeCount === 0) {
      const fallbackRange = document.createRange();
      fallbackRange.selectNodeContents(editor);
      fallbackRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(fallbackRange);
      return fallbackRange;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      const fallbackRange = document.createRange();
      fallbackRange.selectNodeContents(editor);
      fallbackRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(fallbackRange);
      return fallbackRange;
    }

    return range;
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = resolvedEditorRef.current;
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (!selection) return;
    const range = getActiveRange(editor);
    if (!range) return;

    range.deleteContents();
    const fragment = range.createContextualFragment(html);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    }

    syncHtmlToState();
  };

  const insertTextAtCursor = (text: string) => {
    const editor = resolvedEditorRef.current;
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (!selection) return;
    const range = getActiveRange(editor);
    if (!range) return;

    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    const nextRange = document.createRange();
    nextRange.setStartAfter(textNode);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);

    syncHtmlToState();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\r?\n/g, "<br>");
    insertHtmlAtCursor(escaped);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      insertTextAtCursor("    ");
    }
  };

  const handleBeforeInput = (event: FormEvent<HTMLDivElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (native.inputType === "insertText" || native.inputType === "insertFromPaste" || native.inputType === "insertParagraph") {
      requestAnimationFrame(syncHtmlToState);
    }
  };

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-landing-clay ${minHeightClass}`}>
      <div
        ref={resolvedEditorRef}
        contentEditable
        suppressContentEditableWarning
        onBeforeInput={handleBeforeInput}
        onInput={syncHtmlToState}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={syncHtmlToState}
        spellCheck
        data-placeholder={placeholder}
        className="journal-rich-editor h-full w-full overflow-auto break-words px-3 py-2 text-sm leading-6 text-landing-espresso outline-none empty:before:pointer-events-none empty:before:text-landing-espresso-light/40 empty:before:content-[attr(data-placeholder)] [&_h1]:my-1 [&_h1]:text-base [&_h1]:font-black [&_h2]:my-1 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h3]:my-1 [&_h3]:text-sm [&_h3]:font-bold [&_li]:my-0.5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
