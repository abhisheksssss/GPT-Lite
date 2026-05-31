"use client";

import * as React from "react";
import { Menu, Moon, Settings, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RequestStatus } from "@/lib/types";

const statusToVariant = (state: RequestStatus["state"]) => {
  if (state === "streaming") return "warning";
  if (state === "error") return "error";
  return "success";
};

const statusLabel = (state: RequestStatus["state"]) => {
  if (state === "streaming") return "Generating";
  if (state === "error") return "Error";
  return "Ready";
};

type ChatHeaderProps = {
  onOpenSidebar: () => void;
  requestStatus: RequestStatus;
  latencyMs?: number;
  tokenCount?: number;
  onClear: () => void;
  onOpenSettings: () => void;
  title?: string;
  subtitle?: string;
};

export default function ChatHeader({
  onOpenSidebar,
  requestStatus,
  latencyMs,
  tokenCount,
  onClear,
  onOpenSettings,
  title = "Local AI Workspace",
  subtitle = "FastAPI model endpoint",
}: ChatHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const isDark = resolvedTheme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={statusToVariant(requestStatus.state)}>
          {statusLabel(requestStatus.state)}
        </Badge>
        {typeof tokenCount === "number" && (
          <Badge variant="default">{tokenCount} tokens</Badge>
        )}
        {typeof latencyMs === "number" && (
          <Badge variant="default">{latencyMs} ms</Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {mounted ? (
            isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onClear}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
