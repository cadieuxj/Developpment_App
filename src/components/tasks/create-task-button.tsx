'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTaskDialog } from './create-task-dialog';

export function CreateTaskButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        New Task
      </Button>
      <CreateTaskDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
