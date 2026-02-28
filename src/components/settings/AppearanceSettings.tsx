"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Globe, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface AppearanceSettingsProps {
  settings: {
    darkMode: boolean;
    theme: string;
    fontSize: string;
    displayLanguage: string;
  } | null;
}

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
];

export function AppearanceSettings({ settings }: AppearanceSettingsProps) {
  const { theme: currentTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = React.useState({
    darkMode: settings?.darkMode ?? false,
    theme: settings?.theme ?? "system",
    fontSize: settings?.fontSize ?? "medium",
    displayLanguage: settings?.displayLanguage ?? "en",
  });

  const updateSetting = async (key: string, value: string | boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));

    try {
      const response = await fetch("/api/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      toast({
        title: "Settings updated",
        description: "Your display settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    updateSetting("theme", value);
    updateSetting("darkMode", value === "dark");
  };

  const getFontPreviewClass = (size: string) => {
    switch (size) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  const getFontSizeValue = (size: string) => {
    switch (size) {
      case "small":
        return 0;
      case "large":
        return 2;
      default:
        return 1;
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    const sizes = ["small", "medium", "large"];
    const size = sizes[value[0]];
    updateSetting("fontSize", size);
    setLocalSettings((prev) => ({ ...prev, fontSize: size }));
  };

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Theme */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Display</h2>
        <p className="text-sm text-twitter-secondary mb-4">
          Choose how X looks to you. Select a single theme, or sync with your system.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {/* Light */}
          <button
            onClick={() => handleThemeChange("light")}
            className={`p-4 rounded-lg border-2 transition-all ${
              currentTheme === "light"
                ? "border-twitter-blue bg-twitter-blue/5"
                : "border-twitter-border dark:border-twitter-border-dark hover:border-twitter-secondary"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-8 rounded bg-white border border-gray-200 flex items-center justify-center">
                <Sun className="size-4 text-yellow-500" />
              </div>
              <span className="text-sm font-medium">Light</span>
            </div>
          </button>

          {/* Dark */}
          <button
            onClick={() => handleThemeChange("dark")}
            className={`p-4 rounded-lg border-2 transition-all ${
              currentTheme === "dark"
                ? "border-twitter-blue bg-twitter-blue/5"
                : "border-twitter-border dark:border-twitter-border-dark hover:border-twitter-secondary"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-8 rounded bg-gray-900 border border-gray-700 flex items-center justify-center">
                <Moon className="size-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Dark</span>
            </div>
          </button>

          {/* System */}
          <button
            onClick={() => handleThemeChange("system")}
            className={`p-4 rounded-lg border-2 transition-all ${
              currentTheme === "system"
                ? "border-twitter-blue bg-twitter-blue/5"
                : "border-twitter-border dark:border-twitter-border-dark hover:border-twitter-secondary"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-8 rounded bg-gradient-to-r from-white to-gray-900 border border-gray-300 flex items-center justify-center">
                <Monitor className="size-4 text-twitter-secondary" />
              </div>
              <span className="text-sm font-medium">System</span>
            </div>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Type className="size-5 text-twitter-secondary" />
          <h2 className="text-xl font-bold">Font size</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-twitter-secondary">
            <span>Small</span>
            <span>Medium</span>
            <span>Large</span>
          </div>
          <Slider
            value={[getFontSizeValue(localSettings.fontSize)]}
            onValueChange={handleFontSizeChange}
            max={2}
            step={1}
            className="w-full"
          />

          {/* Preview */}
          <div className="p-4 bg-twitter-gray/10 dark:bg-twitter-gray-dark/10 rounded-lg mt-4">
            <p className={`font-semibold ${getFontPreviewClass(localSettings.fontSize)}`}>
              Adjust the text size to your liking
            </p>
            <p className={`${getFontPreviewClass(localSettings.fontSize)} text-twitter-secondary mt-1`}>
              This is how your timeline will look with the selected font size.
            </p>
          </div>
        </div>
      </div>

      {/* Display Language */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="size-5 text-twitter-secondary" />
          <h2 className="text-xl font-bold">Display language</h2>
        </div>

        <Select
          value={localSettings.displayLanguage}
          onValueChange={(value) => updateSetting("displayLanguage", value)}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Theme Preview */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Color</h2>
        <p className="text-sm text-twitter-secondary mb-4">
          Your accent color is used for buttons and links across X.
        </p>
        <div className="flex gap-3">
          {["#1d9bf0", "#f91880", "#7856ff", "#ff7a00", "#00ba7c"].map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ${
                color === "#1d9bf0" ? "ring-twitter-blue" : "ring-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
