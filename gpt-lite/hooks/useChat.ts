"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreaming } from "@/hooks/useStreaming";
import type {
  ChatSettings,
  Conversation,
  Message,
  RequestStatus,
} from "@/lib/types";

const API_URL = "http://127.0.0.1:8000/genrate";

const defaultSettings: ChatSettings = {
  temperature: 0.0,
  maxNewTokens: 512,
  topK: 1,
  repetitionPenalty: 1.1,
  stream: true,
};

const basePrompt =
  "Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n### Instruction:\n{instruction}\n\n### Response:\n";

const responsePrefixPattern = /###\s*Response\s*:/gi;

function cleanModelText(text: string) {
  const withoutPrompt = text.replace(basePrompt, "");
  const matches = [...withoutPrompt.matchAll(responsePrefixPattern)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    return sanitizeMarkdown(
      withoutPrompt.slice((last.index ?? 0) + last[0].length)
    ).trimStart();
  }

  return sanitizeMarkdown(withoutPrompt).trimStart();
}

function sanitizeMarkdown(text: string) {
  return (
    text
      // Remove placeholder fenced blocks like ```text```
      .replace(/```\s*text\s*```/gi, "")
      // Remove empty fenced blocks
      .replace(/```\s*\n?```/g, "")
      // Remove stray fence lines
      .replace(/^\s*```\s*$/gm, "")
  );
}

type ChatOverrides = Partial<
  Pick<
    ChatSettings,
    "temperature" | "maxNewTokens" | "topK" | "repetitionPenalty" | "stream"
  >
> & {
  instruction?: string;
  input?: string;
};

function createConversation(): Conversation {
  const now = Date.now();
  return {
    id: `chat_${now}`,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function estimateTokens(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.25));
}

export function useChat() {
  const { value: conversations, setValue: setConversations, hydrated } =
    useLocalStorage<Conversation[]>("novachat:conversations", []);
  const { value: activeId, setValue: setActiveId } = useLocalStorage<string>(
    "novachat:active",
    ""
  );
  const { value: settings, setValue: setSettings } =
    useLocalStorage<ChatSettings>("novachat:settings", defaultSettings);
  const { startStream, abort } = useStreaming();

  const [requestStatus, setRequestStatus] = React.useState<RequestStatus>({
    state: "idle",
  });
  const [lastUserMessage, setLastUserMessage] = React.useState<string | null>(
    null
  );
  const firstTokenRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!hydrated) return;
    if (conversations.length === 0) {
      const initial = createConversation();
      setConversations([initial]);
      setActiveId(initial.id);
      return;
    }
    if (!activeId) {
      setActiveId(conversations[0].id);
    }
  }, [hydrated, conversations, activeId, setActiveId, setConversations]);

  const activeConversation = React.useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeId);
  }, [conversations, activeId]);

  const updateConversation = React.useCallback(
    (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId ? updater(conversation) : conversation
        )
      );
    },
    [setConversations]
  );

  const createNewChat = React.useCallback(() => {
    const next = createConversation();
    setConversations((prev) => [next, ...prev]);
    setActiveId(next.id);
  }, [setActiveId, setConversations]);

  const clearChat = React.useCallback(() => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: [],
      title: "New chat",
      updatedAt: Date.now(),
    }));
  }, [activeConversation, updateConversation]);

  const exportHistory = React.useCallback(() => {
    return JSON.stringify(conversations, null, 2);
  }, [conversations]);

  const sendMessage = React.useCallback(
    async (content: string, overrides?: ChatOverrides) => {
      if (!content.trim() || !activeConversation) {
        return;
      }

      const now = Date.now();
      const userMessage: Message = {
        id: `msg_${now}`,
        role: "user",
        content: content.trim(),
        createdAt: now,
      };

      const assistantMessage: Message = {
        id: `msg_${now + 1}`,
        role: "assistant",
        content: "",
        createdAt: now + 1,
        status: "streaming",
      };

      updateConversation(activeConversation.id, (conversation) => {
        const nextMessages = [...conversation.messages, userMessage, assistantMessage];
        return {
          ...conversation,
          title:
            conversation.title === "New chat"
              ? content.slice(0, 40)
              : conversation.title,
          messages: nextMessages,
          updatedAt: Date.now(),
        };
      });

      setLastUserMessage(content.trim());
      setRequestStatus({ state: "streaming", startedAt: now });
      firstTokenRef.current = null;

      const payload = {
        prompt: basePrompt,
        instruction: overrides?.instruction?.trim() || content.trim(),
        input: overrides?.input ?? "",
        max_new_tokens: overrides?.maxNewTokens ?? settings.maxNewTokens,
        stream: overrides?.stream ?? settings.stream,
        temperature: overrides?.temperature ?? settings.temperature,
        top_k: overrides?.topK ?? settings.topK,
        repetition_penalty:
          overrides?.repetitionPenalty ?? settings.repetitionPenalty,
      };

      const updateAssistant = (updater: (message: Message) => Message) => {
        updateConversation(activeConversation.id, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === assistantMessage.id ? updater(message) : message
          ),
          updatedAt: Date.now(),
        }));
      };

      const handleComplete = () => {
        setRequestStatus((prev) => ({
          ...prev,
          state: "idle",
          completedAt: Date.now(),
        }));
        updateAssistant((message) => ({
          ...message,
          status: "complete",
          content: cleanModelText(message.content),
          tokenCount: estimateTokens(cleanModelText(message.content)),
        }));
      };

      const handleError = (error: Error) => {
        setRequestStatus({
          state: "error",
          error: error.message,
          completedAt: Date.now(),
        });
        updateAssistant((message) => ({
          ...message,
          status: "error",
          error: error.message,
        }));
      };

      if (!settings.stream) {
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, stream: false }),
          });

          if (!response.ok) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`);
          }

          const contentType = response.headers.get("content-type") || "";
          const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();
          const text =
            typeof data === "string"
              ? data
              : data?.response || data?.text || JSON.stringify(data);
          const cleanedText = cleanModelText(text);

          updateAssistant((message) => ({
            ...message,
            content: cleanedText,
            latencyMs: Date.now() - now,
          }));
          handleComplete();
        } catch (error) {
          handleError(error as Error);
        }
        return;
      }

      startStream({
        url: API_URL,
        payload,
        callbacks: {
          onToken: (token) => {
            updateAssistant((message) => {
              if (!firstTokenRef.current) {
                firstTokenRef.current = Date.now();
                setRequestStatus((prev) => ({
                  ...prev,
                  firstTokenAt: firstTokenRef.current ?? prev.firstTokenAt,
                }));
              }
              const latencyMs =
                message.latencyMs ?? (firstTokenRef.current ?? now) - now;
              const nextContent = cleanModelText(`${message.content}${token}`);
              return {
                ...message,
                content: nextContent,
                latencyMs,
                tokenCount: estimateTokens(nextContent),
              };
            });
          },
          onComplete: handleComplete,
          onError: handleError,
        },
      });
    },
    [
      activeConversation,
      settings,
      startStream,
      updateConversation,
    ]
  );

  const retryLast = React.useCallback(() => {
    if (!lastUserMessage) return;
    sendMessage(lastUserMessage);
  }, [lastUserMessage, sendMessage]);

  const stopStreaming = React.useCallback(() => {
    abort();
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conversation) => {
      const messages = [...conversation.messages];
      const lastAssistantIndex = [...messages]
        .reverse()
        .findIndex((message) => message.role === "assistant");
      if (lastAssistantIndex !== -1) {
        const targetIndex = messages.length - 1 - lastAssistantIndex;
        const target = messages[targetIndex];
        messages[targetIndex] = {
          ...target,
          status: "complete",
          tokenCount: estimateTokens(target.content),
        };
      }
      return {
        ...conversation,
        messages,
        updatedAt: Date.now(),
      };
    });
    setRequestStatus({ state: "idle", completedAt: Date.now() });
  }, [abort, activeConversation, updateConversation]);

  return {
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
    abort: stopStreaming,
  };
}
