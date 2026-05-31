"use client";

import * as React from "react";
import { CornerDownLeft, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop?: () => void;
};

export default function ChatInput({
  onSend,
  isStreaming,
  onStop,
}: ChatInputProps) {
  const [value, setValue] = React.useState("");

  const handleSend = React.useCallback(() => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }, [onSend, value]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-border p-3">
      <div className="flex items-end gap-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          className="min-h-13 flex-1 bg-transparent"
        />
        {isStreaming ? (
          <Button type="button" variant="outline" size="icon" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="icon" onClick={handleSend}>
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Press Enter to send, Shift + Enter for a new line.
      </p>
    </div>
  );
}
