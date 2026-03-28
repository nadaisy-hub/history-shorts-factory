import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";
import { getAllProjects } from "@/lib/storage";
import type { ProjectStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const allProjects = await getAllProjects();

  const projects = allProjects.filter((p) => {
    if (!filter || filter === 'all') return true;
    if (filter === 'in_progress') {
      return !(['draft', 'published'] as ProjectStatus[]).includes(p.status);
    }
    if (filter === 'published') return p.status === 'published';
    if (filter === 'draft') return p.status === 'draft';
    return true;
  });

  const counts = {
    all: allProjects.length,
    in_progress: allProjects.filter(
      (p) => !(['draft', 'published'] as ProjectStatus[]).includes(p.status)
    ).length,
    published: allProjects.filter((p) => p.status === 'published').length,
    draft: allProjects.filter((p) => p.status === 'draft').length,
  };

  const activeFilter = filter || 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-serif-kr)] tracking-tight">
            프로젝트
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {allProjects.length}개의 쇼츠 프로젝트
          </p>
        </div>
        <Link href="/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />새 쇼츠
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {([
          ['all', '전체'],
          ['in_progress', '제작중'],
          ['published', '게시됨'],
          ['draft', '초안'],
        ] as const).map(([key, label]) => (
          <Link key={key} href={key === 'all' ? '/' : `/?filter=${key}`}>
            <Button
              variant={activeFilter === key ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              {label}
              <span className="ml-1.5 opacity-60">{counts[key]}</span>
            </Button>
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">아직 프로젝트가 없습니다</p>
          <Link href="/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />첫 번째 쇼츠 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
