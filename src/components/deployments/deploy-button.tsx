'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { DeployDialog } from './deploy-dialog';

interface Project {
  id: string;
  name: string;
  githubRepoUrl?: string | null;
}

interface DeployButtonProps {
  projects: Project[];
}

export function DeployButton({ projects }: DeployButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Rocket className="w-4 h-4 mr-2" />
        New Deployment
      </Button>
      <DeployDialog open={open} onOpenChange={setOpen} projects={projects} />
    </>
  );
}
