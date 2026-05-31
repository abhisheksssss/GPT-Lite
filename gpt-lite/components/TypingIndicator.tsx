"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
      <span>AI is thinking</span>
      <span className="flex items-center gap-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground [animation-delay:0.2s]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground [animation-delay:0.4s]" />
      </span>
    </div>
  );
}
