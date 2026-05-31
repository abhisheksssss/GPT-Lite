"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ChatSettings } from "@/lib/types";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChatSettings;
  onChange: (settings: ChatSettings) => void;
};

export default function SettingsModal({
  open,
  onOpenChange,
  settings,
  onChange,
}: SettingsModalProps) {
  const updateSetting = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generation settings</DialogTitle>
          <DialogDescription>
            Tune response behavior for your local model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[settings.temperature]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(value) => updateSetting("temperature", value[0])}
              />
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={settings.temperature}
                onChange={(event) =>
                  updateSetting("temperature", Number(event.target.value))
                }
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max new tokens</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[settings.maxNewTokens]}
                min={64}
                max={2048}
                step={32}
                onValueChange={(value) => updateSetting("maxNewTokens", value[0])}
              />
              <Input
                type="number"
                min={64}
                max={2048}
                step={32}
                value={settings.maxNewTokens}
                onChange={(event) =>
                  updateSetting("maxNewTokens", Number(event.target.value))
                }
                className="w-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Top K</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[settings.topK]}
                min={1}
                max={50}
                step={1}
                onValueChange={(value) => updateSetting("topK", value[0])}
              />
              <Input
                type="number"
                min={1}
                max={50}
                step={1}
                value={settings.topK}
                onChange={(event) => updateSetting("topK", Number(event.target.value))}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Repetition penalty</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[settings.repetitionPenalty]}
                min={0.8}
                max={2.0}
                step={0.05}
                onValueChange={(value) =>
                  updateSetting("repetitionPenalty", value[0])
                }
              />
              <Input
                type="number"
                min={0.8}
                max={2.0}
                step={0.05}
                value={settings.repetitionPenalty}
                onChange={(event) =>
                  updateSetting("repetitionPenalty", Number(event.target.value))
                }
                className="w-24"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Streaming</p>
              <p className="text-xs text-muted-foreground">
                Stream tokens as they arrive.
              </p>
            </div>
            <Switch
              checked={settings.stream}
              onCheckedChange={(value) => updateSetting("stream", value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
