import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ExternalLink, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectStatus = 'draft' | 'scanning' | 'scanned' | 'graduated' | 'failed';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  score?: number;
  reportCID?: string | null;
  lastScanned?: string;
  vulnerabilities?: number;
}

interface ProjectCardProps {
  project?: Project;
  loading?: boolean;
  error?: string | null;
  onOpen?: (id: string) => void;
  onRetry?: () => void;
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; icon: typeof Shield }> = {
  draft: { label: 'DRAFT', color: 'bg-muted text-muted-foreground', icon: Clock },
  scanning: { label: 'SCANNING', color: 'bg-accent/20 text-accent', icon: Shield },
  scanned: { label: 'SCANNED', color: 'bg-primary/20 text-primary', icon: CheckCircle },
  graduated: { label: 'GRADUATED', color: 'bg-primary/20 text-primary', icon: CheckCircle },
  failed: { label: 'FAILED', color: 'bg-destructive/20 text-destructive', icon: AlertTriangle },
};

function ProjectCardSkeleton() {
  return (
    <Card className="bg-card border-border animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-12" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCardError({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <Card className="bg-card border-destructive/50">
      <CardContent className="py-8 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCardEmpty() {
  return (
    <Card className="bg-card border-dashed border-border">
      <CardContent className="py-12 text-center">
        <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
        <p className="text-xs text-muted-foreground">Start a new security scan to see results here</p>
      </CardContent>
    </Card>
  );
}

export default function ProjectCard({ 
  project, 
  loading = false, 
  error = null,
  onOpen, 
  onRetry 
}: ProjectCardProps) {
  if (loading) return <ProjectCardSkeleton />;
  if (error) return <ProjectCardError error={error} onRetry={onRetry} />;
  if (!project) return <ProjectCardEmpty />;

  const status = statusConfig[project.status];
  const StatusIcon = status.icon;
  
  const scoreColor = project.score 
    ? project.score >= 80 ? 'text-primary bg-primary/10 border-primary' 
    : project.score >= 60 ? 'text-accent bg-accent/10 border-accent' 
    : 'text-destructive bg-destructive/10 border-destructive'
    : 'text-muted-foreground bg-muted border-border';

  return (
    <Card 
      className="bg-card border-border hover:border-primary/50 transition-all group"
      role="article"
      aria-labelledby={`project-${project.id}-title`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle 
            id={`project-${project.id}-title`}
            className="text-base font-mono truncate pr-2"
          >
            {project.name}
          </CardTitle>
          <div className={cn(
            "text-lg font-bold font-mono px-2 py-1 border",
            scoreColor
          )}>
            {project.score ?? '—'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 text-xs font-mono", status.color)}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </div>
          {project.vulnerabilities !== undefined && project.vulnerabilities > 0 && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" />
              {project.vulnerabilities}
            </div>
          )}
        </div>
        
        {project.lastScanned && (
          <p className="text-xs text-muted-foreground font-mono">
            Last scan: {project.lastScanned}
          </p>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpen?.(project.id)}
            className="font-mono text-xs"
          >
            OPEN
          </Button>
          {project.reportCID && (
            <Button 
              variant="default" 
              size="sm" 
              asChild
              className="font-mono text-xs"
            >
              <a 
                href={project.reportCID} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={`View report for ${project.name}`}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                VIEW REPORT
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ProjectCardSkeleton, ProjectCardEmpty, ProjectCardError };