'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deployProject } from '@/lib/actions/deployments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  githubRepoUrl?: string | null;
}

interface DeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

export function DeployDialog({ open, onOpenChange, projects }: DeployDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    branch: 'main',
    envVars: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Parse environment variables
      const environmentVariables: Record<string, string> = {};
      if (formData.envVars.trim()) {
        const lines = formData.envVars.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            environmentVariables[key.trim()] = valueParts.join('=').trim();
          }
        }
      }

      await deployProject({
        projectId: formData.projectId,
        branch: formData.branch,
        environmentVariables,
      });

      toast.success('Deployment started successfully');
      onOpenChange(false);
      setFormData({
        projectId: '',
        branch: 'main',
        envVars: '',
      });
      router.refresh();
    } catch (error) {
      toast.error('Failed to start deployment');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === formData.projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Deploy to Vercel</DialogTitle>
          <DialogDescription>
            Deploy your project to Vercel with automated CI/CD pipeline
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, projectId: value }))
                }
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                      {project.githubRepoUrl && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({project.githubRepoUrl})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && !selectedProject.githubRepoUrl && (
                <p className="text-sm text-yellow-600">
                  Warning: This project does not have a GitHub repository configured
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                placeholder="main"
                value={formData.branch}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, branch: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500">
                The branch to deploy from your repository
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="envVars">Environment Variables (Optional)</Label>
              <Textarea
                id="envVars"
                placeholder="KEY1=value1&#10;KEY2=value2&#10;DATABASE_URL=postgresql://..."
                value={formData.envVars}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, envVars: e.target.value }))
                }
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Add environment variables in KEY=value format, one per line. These will be
                encrypted automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.projectId}>
              {isLoading ? 'Deploying...' : 'Deploy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
