"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Stepper } from "@/components/stepper";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Trash2,
  GripVertical,
  Plus,
  Play,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Music,
} from "lucide-react";
import type { Project, Scene, AudioSettings, SubtitleSettings } from "@/lib/types";
import { STATUS_LABELS, GATE_TRANSITIONS, SUBTITLE_STYLE_LABELS, type SubtitleStyle } from "@/lib/types";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("프로젝트를 찾을 수 없습니다");
      const data = await res.json();
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function handleGenerate(step: string) {
    setActionLoading(step);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "생성 실패");
      }
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove() {
    setActionLoading("approve");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "승인 실패");
      }
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdateScene(sceneId: string, updates: Partial<Scene>) {
    if (!project) return;
    const updatedScenes = project.scenes.map((s) =>
      s.id === sceneId ? { ...s, ...updates } : s
    );
    const updatedProject = { ...project, scenes: updatedScenes };
    setProject(updatedProject);

    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: updatedScenes }),
    });
  }

  async function handleAddScene() {
    if (!project) return;
    const newScene: Scene = {
      id: crypto.randomUUID(),
      project_id: projectId,
      seq: project.scenes.length + 1,
      narration: "",
      image_prompt: "",
      image_url: null,
      video_url: null,
      duration_sec: 6,
      status: "pending",
    };
    const updatedScenes = [...project.scenes, newScene];
    setProject({ ...project, scenes: updatedScenes });

    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: updatedScenes }),
    });
  }

  async function handleDeleteScene(sceneId: string) {
    if (!project) return;
    const updatedScenes = project.scenes
      .filter((s) => s.id !== sceneId)
      .map((s, i) => ({ ...s, seq: i + 1 }));
    setProject({ ...project, scenes: updatedScenes });

    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: updatedScenes }),
    });
  }

  async function handleUpdateAudio(updates: Partial<AudioSettings>) {
    if (!project) return;
    const updatedSettings = { ...project.audio_settings, ...updates };
    setProject({ ...project, audio_settings: updatedSettings });

    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_settings: updatedSettings }),
    });
  }

  async function handleUpdateSubtitle(updates: Partial<SubtitleSettings>) {
    if (!project) return;
    const updatedSettings = { ...project.subtitle_settings, ...updates };
    setProject({ ...project, subtitle_settings: updatedSettings });

    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtitle_settings: updatedSettings }),
    });
  }

  async function handleRegenerateScene(sceneId: string, step: "image" | "video") {
    setActionLoading(`regen-${sceneId}`);
    try {
      await fetch(`/api/projects/${projectId}/scenes/${sceneId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
      await fetchProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "재생성 실패");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            대시보드로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  const isReviewState = project.status.endsWith("_review") || project.status === "ready";
  const nextGate = GATE_TRANSITIONS[project.status];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold font-[family-name:var(--font-serif-kr)] tracking-tight truncate">
            {project.title}
          </h2>
          <p className="text-sm text-muted-foreground truncate">{project.topic}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {/* Stepper */}
      <Card className="p-4">
        <Stepper status={project.status} />
      </Card>

      {/* Error display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Draft state - generate script */}
      {project.status === "draft" && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              대본을 생성하여 제작을 시작하세요
            </p>
            <Button
              onClick={() => handleGenerate("script")}
              disabled={!!actionLoading}
              className="gap-2"
            >
              {actionLoading === "script" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {actionLoading === "script" ? "대본 생성 중..." : "AI 대본 생성"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scripting in progress */}
      {project.status === "scripting" && (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-400" />
            <p className="text-muted-foreground">AI가 대본을 작성하고 있습니다...</p>
          </CardContent>
        </Card>
      )}

      {/* Script Review */}
      {(project.status === "script_review" || project.scenes.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-[family-name:var(--font-serif-kr)]">
              장면 구성
            </h3>
            {project.status === "script_review" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleAddScene} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  장면 추가
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate("script")}
                  disabled={!!actionLoading}
                  className="gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  전체 재생성
                </Button>
              </div>
            )}
          </div>

          {project.scenes.map((scene) => (
            <Card key={scene.id} className="overflow-hidden">
              <CardHeader className="py-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">장면 {scene.seq}</span>
                    <Badge variant="outline" className="text-xs">
                      {scene.duration_sec}초
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {scene.image_url && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-500/10 text-green-400 border-green-500/30"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        이미지
                      </Badge>
                    )}
                    {scene.video_url && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        영상
                      </Badge>
                    )}
                    {project.status === "script_review" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteScene(scene.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    나레이션
                  </label>
                  {project.status === "script_review" ? (
                    <Textarea
                      value={scene.narration}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, { narration: e.target.value })
                      }
                      rows={2}
                      className="resize-none text-sm"
                    />
                  ) : (
                    <p className="text-sm bg-muted/30 rounded-md p-3">{scene.narration}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    이미지 프롬프트
                  </label>
                  {project.status === "script_review" ||
                  project.status === "image_review" ? (
                    <Textarea
                      value={scene.image_prompt}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, { image_prompt: e.target.value })
                      }
                      rows={2}
                      className="resize-none text-xs font-mono"
                    />
                  ) : (
                    <p className="text-xs font-mono bg-muted/30 rounded-md p-3">
                      {scene.image_prompt}
                    </p>
                  )}
                </div>

                {/* Image preview */}
                {scene.image_url && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">
                      생성된 이미지
                    </label>
                    <div className="relative aspect-[9/16] max-w-[200px] rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={scene.image_url}
                        alt={`장면 ${scene.seq}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {project.status === "image_review" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateScene(scene.id, "image")}
                        disabled={!!actionLoading}
                        className="gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        이미지 재생성
                      </Button>
                    )}
                  </div>
                )}

                {/* Video preview */}
                {scene.video_url && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">
                      생성된 영상
                    </label>
                    <video
                      src={scene.video_url}
                      controls
                      className="max-w-[200px] rounded-lg"
                    />
                    {project.status === "video_review" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateScene(scene.id, "video")}
                        disabled={!!actionLoading}
                        className="gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        영상 재생성
                      </Button>
                    )}
                  </div>
                )}

                {/* Duration */}
                {project.status === "script_review" && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">길이:</label>
                    <Input
                      type="number"
                      min={3}
                      max={15}
                      value={scene.duration_sec}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, {
                          duration_sec: Number(e.target.value),
                        })
                      }
                      className="w-20 h-7 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">초</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Voice review - 오디오 밸런스 컨트롤 */}
      {project.status === "voice_review" && (
        <div className="space-y-4">
          {/* 나레이션 플레이어 */}
          {project.narration_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  나레이션 오디오
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <audio controls src={project.narration_url} className="w-full" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">나레이션 볼륨</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[project.audio_settings.narration_volume * 100]}
                        onValueChange={(val) => handleUpdateAudio({ narration_volume: Number(val) / 100 })}
                        min={0} max={100} step={5}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round(project.audio_settings.narration_volume * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">TTS 속도</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[project.audio_settings.tts_speed * 100]}
                        onValueChange={(val) => handleUpdateAudio({ tts_speed: Number(val) / 100 })}
                        min={80} max={130} step={5}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {project.audio_settings.tts_speed.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">음성 안정성</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[project.audio_settings.tts_stability * 100]}
                        onValueChange={(val) => handleUpdateAudio({ tts_stability: Number(val) / 100 })}
                        min={0} max={100} step={5}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round(project.audio_settings.tts_stability * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">음성 유사도</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[project.audio_settings.tts_similarity * 100]}
                        onValueChange={(val) => handleUpdateAudio({ tts_similarity: Number(val) / 100 })}
                        min={0} max={100} step={5}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round(project.audio_settings.tts_similarity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate("voice")}
                  disabled={!!actionLoading}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  설정 변경 후 재생성
                </Button>
              </CardContent>
            </Card>
          )}

          {/* BGM 설정 + 자동 밸런싱 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Music className="h-4 w-4" />
                BGM 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">BGM URL (mp3/wav)</Label>
                <Input
                  type="text"
                  placeholder="https://... 또는 로컬 파일 경로"
                  value={project.audio_settings.bgm_url || ""}
                  onChange={(e) => handleUpdateAudio({ bgm_url: e.target.value || null })}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <p className="text-sm font-medium">LUFS 자동 밸런싱</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    나레이션 대비 BGM 볼륨을 자동 계산합니다
                  </p>
                </div>
                <Switch
                  checked={project.audio_settings.auto_balance}
                  onCheckedChange={(checked) => handleUpdateAudio({ auto_balance: checked })}
                />
              </div>

              {project.audio_settings.auto_balance ? (
                <div className="space-y-2">
                  <Label className="text-xs">
                    나레이션 대비 BGM 감소량: -{project.audio_settings.target_diff_db}dB
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[project.audio_settings.target_diff_db]}
                      onValueChange={(val) => handleUpdateAudio({ target_diff_db: Number(val) })}
                      min={10} max={30} step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      vol: {Math.pow(10, -project.audio_settings.target_diff_db / 20).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    추천: 18~22dB (나레이션이 명확히 들리는 수준)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">BGM 수동 볼륨</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[project.audio_settings.bgm_volume * 100]}
                      onValueChange={(val) => handleUpdateAudio({ bgm_volume: Number(val) / 100 })}
                      min={0} max={50} step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {Math.round(project.audio_settings.bgm_volume * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 자막 설정 — voice_review에서 조립 전에 설정 */}
      {project.status === "voice_review" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              자막 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">자막 표시</p>
                <p className="text-xs text-muted-foreground">
                  영상에 나레이션 텍스트를 자막으로 표시합니다
                </p>
              </div>
              <Switch
                checked={project.subtitle_settings.enabled}
                onCheckedChange={(checked) => handleUpdateSubtitle({ enabled: checked })}
              />
            </div>

            {project.subtitle_settings.enabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">자막 스타일</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(SUBTITLE_STYLE_LABELS) as [SubtitleStyle, string][]).map(
                      ([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleUpdateSubtitle({ style: value })}
                          className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                            project.subtitle_settings.style === value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">글자 크기: {project.subtitle_settings.font_size}px</Label>
                    <Slider
                      value={[project.subtitle_settings.font_size]}
                      onValueChange={(val) => handleUpdateSubtitle({ font_size: Number(val) })}
                      min={24} max={64} step={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">
                      세로 위치: {Math.round(project.subtitle_settings.position_y * 100)}%
                    </Label>
                    <Slider
                      value={[project.subtitle_settings.position_y * 100]}
                      onValueChange={(val) => handleUpdateSubtitle({ position_y: Number(val) / 100 })}
                      min={50} max={95} step={5}
                    />
                  </div>
                </div>

                {project.subtitle_settings.style === "stroke" && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      외곽선 두께: {project.subtitle_settings.stroke_width}px
                    </Label>
                    <Slider
                      value={[project.subtitle_settings.stroke_width]}
                      onValueChange={(val) => handleUpdateSubtitle({ stroke_width: Number(val) })}
                      min={1} max={6} step={0.5}
                    />
                  </div>
                )}

                {project.subtitle_settings.style === "semi_bg" && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      배경 투명도: {Math.round(project.subtitle_settings.bg_opacity * 100)}%
                    </Label>
                    <Slider
                      value={[project.subtitle_settings.bg_opacity * 100]}
                      onValueChange={(val) => handleUpdateSubtitle({ bg_opacity: Number(val) / 100 })}
                      min={10} max={80} step={5}
                    />
                  </div>
                )}

                {/* 자막 미리보기 */}
                <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', maxWidth: 200 }}>
                  <div className="absolute inset-0 flex items-end justify-center"
                    style={{ paddingBottom: `${Math.round((1 - project.subtitle_settings.position_y) * 100)}%` }}>
                    <span className="text-center px-2 py-1 max-w-[90%] text-xs font-bold"
                      style={{
                        color: project.subtitle_settings.font_color,
                        ...(project.subtitle_settings.style === 'stroke' ? {
                          WebkitTextStroke: `${project.subtitle_settings.stroke_width * 0.3}px ${project.subtitle_settings.stroke_color}`,
                          paintOrder: 'stroke fill',
                        } : {}),
                        ...(project.subtitle_settings.style === 'shadow' ? {
                          textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                        } : {}),
                        ...(project.subtitle_settings.style === 'semi_bg' ? {
                          background: `rgba(0,0,0,${project.subtitle_settings.bg_opacity})`,
                          borderRadius: 4,
                        } : {}),
                      }}>
                      자막 미리보기 텍스트
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Final review */}
      {project.status === "final_review" && project.output_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최종 영상</CardTitle>
          </CardHeader>
          <CardContent>
            <video controls src={project.output_url} className="w-full rounded-lg" />
          </CardContent>
        </Card>
      )}

      {/* Ready to publish */}
      {project.status === "ready" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">YouTube 게시 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                제목
              </label>
              <Input value={project.title} readOnly />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                설명
              </label>
              <Textarea value={project.topic} readOnly rows={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gate actions */}
      {isReviewState && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              이전 단계로
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="gap-2"
            >
              {actionLoading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : project.status === "ready" ? (
                <Upload className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {project.status === "ready"
                ? "게시하기"
                : `승인하고 ${
                    nextGate === "imaging"
                      ? "이미지 생성"
                      : nextGate === "animating"
                      ? "영상 변환"
                      : nextGate === "voicing"
                      ? "음성 생성"
                      : nextGate === "assembling"
                      ? "영상 조립"
                      : nextGate === "ready"
                      ? "완료"
                      : "다음 단계"
                  } →`}
            </Button>
          </div>
        </>
      )}

      {/* Published state */}
      {project.status === "published" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-green-400">게시 완료!</p>
            {project.youtube_id && (
              <p className="text-sm text-muted-foreground mt-1">
                YouTube ID: {project.youtube_id}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
