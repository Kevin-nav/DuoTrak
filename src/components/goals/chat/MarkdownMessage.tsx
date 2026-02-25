"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownMessage = memo(function MarkdownMessage({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                h1: ({ children }) => <h1 className="mb-2 text-base font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-1.5 text-sm font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                        return (
                            <pre className="my-2 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
                                <code>{children}</code>
                            </pre>
                        );
                    }
                    return (
                        <code className="rounded bg-muted/50 px-1 py-0.5 text-xs font-mono">
                            {children}
                        </code>
                    );
                },
                blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-taupe/40 pl-3 text-muted-foreground">
                        {children}
                    </blockquote>
                ),
                a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-taupe underline hover:text-foreground">
                        {children}
                    </a>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
});

export default MarkdownMessage;
