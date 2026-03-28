"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STYLE_PRESETS, STATUS_LABELS, type Project, type ProjectStatus } from "@/lib/types";
import { Clock, Image, Film, Mic, Package } from "lucide-react";

function getStatusColor(status: ProjectStatus) {
  if (status === 'published') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (status === 'ready') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (status.endsWith('_review')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (status === 'draft') return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
}

function getStepIcon(status: ProjectStatus) {
  if (['scripting', 'script_review'].includes(status)) return <Clock className="h-3.5 w-3.5" />;
  if (['imaging', 'image_review'].includes(status)) return <Image className="h-3.5 w-3.5" />;
  if (['animating', 'video_review'].includes(status)) return <Film className="h-3.5 w-3.5" />;
  if (['voicing', 'voice_review'].includes(status)) return <Mic className="h-3.5 w-3.5" />;
  if (['assembling', 'final_review'].includes(status)) return <Package className="h-3.5 w-3.5" />;
  return null;
}

export function ProjectCard({ project }: { project: Project }) {
  const timeAgo = getTimeAgo(project.updated_at);

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="hover:border-primary/30 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-[family-name:var(--font-serif-kr)] leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {project.title}
            </CardTitle>
            <Badge variant="outline" className={`shrink-0 text-xs ${getStatusColor(project.status)}`}>
              {getStepIcon(project.status)}
              <span className="ml-1">{STATUS_LABELS[project.status]}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{project.topic}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{STYLE_PRESETS[project.style_preset]}</span>
            <span className="text-border">|</span>
            <span>{project.duration_sec}초</span>
            <span className="text-border">|</span>
            <span>{project.scenes.length}장면</span>
            <span className="ml-auto">{timeAgo}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${Math.floor(days / 30)}개월 전`;
}
