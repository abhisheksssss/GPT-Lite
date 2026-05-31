"use client";

import Link from "next/link";
import { Calendar, History, Settings, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

type ChatSidebarProps = {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
};

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onOpenSettings,
  onExport,
}: ChatSidebarProps) {
  return (
    <aside className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">GPT LITE</h2>
          <p className="text-xs text-muted-foreground">Demo Version of GPT Style Model</p>
        </div>
      </div>

      <Button type="button" size="lg" className="w-full" onClick={onNewChat}>
        New chat
      </Button>

      <div className="space-y-2">
        <Button asChild type="button" variant="outline" className="w-full">
          <Link href="/">Normal mode</Link>
        </Button>
        <Button asChild type="button" variant="secondary" className="w-full">
          <Link href="/custom" className="flex items-center justify-center gap-2">
            <Wand2 className="h-4 w-4" />
            Custom studio
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span className="flex items-center gap-2">
          <History className="h-4 w-4" />
          History
        </span>
        <span>{conversations.length}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "w-full rounded-2xl border border-border px-4 py-3 text-left text-sm transition hover:bg-muted",
              conversation.id === activeId &&
                "border-accent/50 bg-accent/10 text-foreground"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {conversation.title || "New chat"}
              </span>
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(conversation.updatedAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Button type="button" variant="outline" className="w-full" onClick={onExport}>
          <Upload className="h-4 w-4" />
          Export history
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
