"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

const STYLE_OPTIONS = [
  { value: "oil_painting", label: "유화", desc: "르네상스풍 유화 터치" },
  { value: "watercolor", label: "수채화", desc: "동양화 느낌 수채 표현" },
  { value: "cinematic", label: "시네마틱", desc: "영화적 사실주의" },
  { value: "illustration", label: "일러스트", desc: "디지털 일러스트레이션" },
];

const VOICE_OPTIONS = [
  { value: "korean_male_narrator", label: "남성 차분한 내레이터" },
  { value: "korean_female_narrator", label: "여성 활발한 내레이터" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30초" },
  { value: 45, label: "45초" },
  { value: 60, label: "60초" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    style_preset: "oil_painting",
    voice_id: "korean_male_narrator",
    duration_sec: 55,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.topic.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.topic,
          ...formData,
        }),
      });
      const project = await res.json();
      router.push(`/project/${project.id}`);
    } catch {
      setLoading(false);
    }
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
            새 쇼츠 만들기
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            주제를 입력하면 AI가 대본을 생성합니다
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주제</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="예: 조선 최악의 왕은 누구였을까? / 임진왜란 이순신의 숨겨진 전략 / 고려시대 사람들의 하루"
              value={formData.topic}
              onChange={(e) => setFormData((f) => ({ ...f, topic: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">스타일 프리셋</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, style_preset: style.value }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.style_preset === style.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-medium text-sm">{style.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">음성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {VOICE_OPTIONS.map((voice) => (
                <label
                  key={voice.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.voice_id === voice.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="voice"
                    value={voice.value}
                    checked={formData.voice_id === voice.value}
                    onChange={(e) => setFormData((f) => ({ ...f, voice_id: e.target.value }))}
                    className="sr-only"
                  />
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      formData.voice_id === voice.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <span className="text-sm">{voice.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">영상 길이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DURATION_OPTIONS.map((dur) => (
                  <label
                    key={dur.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.duration_sec === dur.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={dur.value}
                      checked={formData.duration_sec === dur.value}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, duration_sec: Number(e.target.value) }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        formData.duration_sec === dur.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">{dur.label}</span>
                  </label>
                ))}
                <div className="pt-1">
                  <Label className="text-xs text-muted-foreground">직접 입력 (초)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={90}
                    value={formData.duration_sec}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, duration_sec: Number(e.target.value) }))
                    }
                    className="mt-1 h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-base"
          disabled={!formData.topic.trim() || loading}
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "프로젝트 생성 중..." : "프로젝트 생성"}
        </Button>
      </form>
    </div>
  );
}
