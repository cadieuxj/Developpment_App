'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateProjectDialog } from './create-project-dialog';

export function CreateProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Project
      </button>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
