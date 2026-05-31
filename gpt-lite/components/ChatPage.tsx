"use client";

import * as React from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import ChatSidebar from "@/components/ChatSidebar";
import SettingsModal from "@/components/SettingsModal";
import TypingIndicator from "@/components/TypingIndicator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useChat } from "@/hooks/useChat";
import type { Message } from "@/lib/types";

export default function ChatPage() {
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
    retryLast,
    abort,
  } = useChat();

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const messages = activeConversation?.messages ?? [];
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

  return (
    <div className="gradient-shell flex h-screen w-full overflow-hidden">
      <div className="hidden h-full w-80 border-r border-border bg-card/70 p-6 md:flex">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNewChat={createNewChat}
          onOpenSettings={() => setSettingsOpen(true)}
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
              setSettingsOpen(true);
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
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-6 py-8">
          {messages.length === 0 && (
            <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card/70 p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold">Start a new conversation</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Ask anything and your local model will respond in real-time.
              </p>
            </div>
          )}

          {messages.map((message: Message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onRetry={message.status === "error" ? retryLast : undefined}
            />
          ))}

          {requestStatus.state === "streaming" && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border px-6 py-4">
          <ChatInput
            onSend={sendMessage}
            isStreaming={requestStatus.state === "streaming"}
            onStop={abort}
          />
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  );
}
