"use client";

import { AlertTriangle, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: Message;
  onRetry?: () => void;
};

export default function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-3xl border border-border px-5 py-4 text-sm shadow-sm",
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-card text-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-7">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content || ""} />
        )}

        {message.status === "error" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <span>{message.error || "Generation failed."}</span>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {!isUser && message.status !== "error" && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {typeof message.tokenCount === "number" && (
              <span>{message.tokenCount} tokens</span>
            )}
            {typeof message.latencyMs === "number" && (
              <span>{message.latencyMs} ms latency</span>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
