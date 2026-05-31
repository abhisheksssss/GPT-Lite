"use client";

import * as React from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatSidebar from "@/components/ChatSidebar";
import TypingIndicator from "@/components/TypingIndicator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/useChat";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";

export default function CustomChatPage() {
  const {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    settings,
    setSettings,
    requestStatus,
    sendMessage,
    createNewChat,
    clearChat,
    exportHistory,
    abort,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [instruction, setInstruction] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const responseEndRef = React.useRef<HTMLDivElement | null>(null);

  const messages = activeConversation?.messages ?? [];
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  React.useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastAssistant?.content, requestStatus.state]);

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `novachat-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = (message: string) => {
    sendMessage(message, {
      instruction: instruction.trim() ? instruction : undefined,
      input: inputValue.trim() ? inputValue : "",
      temperature: settings.temperature,
      topK: settings.topK,
      repetitionPenalty: settings.repetitionPenalty,
      maxNewTokens: settings.maxNewTokens,
      stream: settings.stream,
    });
    setInstruction("");
    setInputValue("");
  };

  const handleCopy = async () => {
    if (!lastAssistant?.content) return;
    try {
      await navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.warn("Failed to copy response", error);
    }
  };

  return (
    <div className="gradient-shell flex h-screen w-full overflow-hidden">
      <div className="hidden h-full w-80 border-r border-border bg-card/70 p-6 md:flex">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNewChat={createNewChat}
          onOpenSettings={() => {}}
          onExport={handleExport}
        />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent>
          <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              setSidebarOpen(false);
            }}
            onNewChat={() => {
              createNewChat();
              setSidebarOpen(false);
            }}
            onOpenSettings={() => {
              setSidebarOpen(false);
            }}
            onExport={() => {
              handleExport();
              setSidebarOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <main className="flex h-full min-h-0 flex-1 flex-col">
        <ChatHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          requestStatus={requestStatus}
          latencyMs={lastAssistant?.latencyMs}
          tokenCount={lastAssistant?.tokenCount}
          onClear={clearChat}
          onOpenSettings={() => {}}
          title="Custom Model Playground"
          subtitle="Structured prompt building"
        />

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-8">
          <section className="glass-panel rounded-3xl border border-border p-6">
            <h2 className="text-lg font-semibold">Instruction</h2>
            <Textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              rows={5}
              className="mt-4 bg-transparent"
              placeholder="Explain Transformers in Machine Learning"
            />

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Input (Optional)
            </h3>
            <Textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              rows={3}
              className="mt-3 bg-transparent"
              placeholder="Additional context or input data"
            />
          </section>

          <section className="glass-panel rounded-3xl border border-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generation Settings</h2>
              <Badge variant={requestStatus.state === "streaming" ? "warning" : "default"}>
                {requestStatus.state === "streaming" ? "Generating" : "Idle"}
              </Badge>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium">Temperature</label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.temperature]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={(value) =>
                      setSettings({ ...settings, temperature: value[0] })
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={settings.temperature}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        temperature: Number(event.target.value),
                      })
                    }
                    className="w-24"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Max New Tokens</label>
                <Input
                  type="number"
                  min={64}
                  max={4096}
                  step={32}
                  value={settings.maxNewTokens}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      maxNewTokens: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Top K</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={settings.topK}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      topK: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Repetition Penalty</label>
                <Input
                  type="number"
                  min={0.8}
                  max={2}
                  step={0.1}
                  value={settings.repetitionPenalty}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      repetitionPenalty: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Stream Response</p>
                <p className="text-xs text-muted-foreground">
                  Stream tokens as they arrive.
                </p>
              </div>
              <Switch
                checked={settings.stream}
                onCheckedChange={(value) =>
                  setSettings({ ...settings, stream: value })
                }
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="lg"
                disabled={
                  requestStatus.state === "streaming" || !instruction.trim()
                }
                onClick={() => handleSend(instruction)}
              >
                {requestStatus.state === "streaming" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setInstruction("");
                  setInputValue("");
                }}
              >
                Clear fields
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={abort}
                disabled={requestStatus.state !== "streaming"}
              >
                Stop
              </Button>
            </div>
          </section>

          <section className="glass-panel rounded-3xl border border-border p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Response</h2>
              <div className="flex flex-wrap items-center gap-2">
                {typeof lastAssistant?.tokenCount === "number" && (
                  <Badge variant="default">{lastAssistant.tokenCount} tokens</Badge>
                )}
                {typeof lastAssistant?.latencyMs === "number" && (
                  <Badge variant="default">{lastAssistant.latencyMs} ms</Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!lastAssistant?.content}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto rounded-2xl border border-border bg-card/70 p-4">
              {lastAssistant?.content ? (
                <MarkdownRenderer content={lastAssistant.content} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Streaming output appears here...
                </p>
              )}

              {requestStatus.state === "streaming" && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}
              <div ref={responseEndRef} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
