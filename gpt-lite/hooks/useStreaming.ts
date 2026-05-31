"use client";

import * as React from "react";

type StreamCallbacks = {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
};

type StreamOptions = {
  url: string;
  payload: Record<string, unknown>;
  callbacks: StreamCallbacks;
};

function parseStreamChunk(chunk: string) {
  if (!chunk.includes("data:")) {
    return { tokens: [chunk], remainder: "" };
  }

  const lines = chunk.split(/\r?\n/);
  const remainder = lines.pop() ?? "";
  const tokens: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("data:")) {
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        continue;
      }
      tokens.push(data);
    } else {
      tokens.push(line);
    }
  }

  return { tokens, remainder };
}

export function useStreaming() {
  const controllerRef = React.useRef<AbortController | null>(null);

  const abort = React.useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const startStream = React.useCallback(async ({ url, payload, callbacks }: StreamOptions) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        const text = await response.text();
        callbacks.onToken(text);
        callbacks.onComplete();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let remainder = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const parsed = parseStreamChunk(remainder + chunk);
        remainder = parsed.remainder;
        parsed.tokens.forEach((token) => callbacks.onToken(token));
      }

      if (remainder.trim()) {
        callbacks.onToken(remainder);
      }

      callbacks.onComplete();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      callbacks.onError(error as Error);
    }
  }, []);

  return { startStream, abort };
}
