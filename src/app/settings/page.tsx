"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  required: boolean;
  placeholder: string;
}

const API_KEYS: ApiKeyConfig[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Claude API",
    description: "대본 생성 (Anthropic)",
    required: true,
    placeholder: "sk-ant-...",
  },
  {
    key: "FAL_API_KEY",
    label: "fal.ai API",
    description: "이미지 생성 (Flux 2 Pro)",
    required: true,
    placeholder: "fal_...",
  },
  {
    key: "MODELSLAB_API_KEY",
    label: "ModelsLab API",
    description: "이미지→영상 변환 (Kling)",
    required: true,
    placeholder: "",
  },
  {
    key: "ELEVENLABS_API_KEY",
    label: "ElevenLabs API",
    description: "TTS 음성 생성",
    required: true,
    placeholder: "",
  },
  {
    key: "SHOTSTACK_API_KEY",
    label: "Shotstack API",
    description: "영상 조립 및 렌더링",
    required: true,
    placeholder: "",
  },
  {
    key: "YOUTUBE_CLIENT_ID",
    label: "YouTube Client ID",
    description: "YouTube 업로드 (Google OAuth)",
    required: false,
    placeholder: "",
  },
  {
    key: "YOUTUBE_CLIENT_SECRET",
    label: "YouTube Client Secret",
    description: "YouTube 업로드 (Google OAuth)",
    required: false,
    placeholder: "",
  },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("api_keys");
    if (stored) {
      setKeys(JSON.parse(stored));
    }
    // Check .env status
    fetch("/api/settings/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  function handleSave() {
    localStorage.setItem("api_keys", JSON.stringify(keys));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleVisibility(key: string) {
    setVisibility((v) => ({ ...v, [key]: !v[key] }));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-serif-kr)] tracking-tight">
            설정
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            API 키 관리 및 기본 설정
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            API 키
            <span className="text-xs text-muted-foreground font-normal">
              .env 파일 또는 브라우저 저장
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            API 키는 프로젝트 루트의 <code className="text-xs">.env.local</code> 파일에
            설정하는 것을 권장합니다. 여기서 입력한 값은 브라우저에만 저장됩니다.
          </p>

          {API_KEYS.map((config) => (
            <div key={config.key} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm">{config.label}</Label>
                {config.required && (
                  <Badge variant="outline" className="text-[10px] h-4">
                    필수
                  </Badge>
                )}
                {status[config.key] && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 bg-green-500/10 text-green-400 border-green-500/30"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    .env 설정됨
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              <div className="relative">
                <Input
                  type={visibility[config.key] ? "text" : "password"}
                  value={keys[config.key] || ""}
                  onChange={(e) =>
                    setKeys((k) => ({ ...k, [config.key]: e.target.value }))
                  }
                  placeholder={config.placeholder || config.key}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(config.key)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {visibility[config.key] ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} className="w-full gap-2 mt-4">
            {saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "저장 완료!" : "브라우저에 저장"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
