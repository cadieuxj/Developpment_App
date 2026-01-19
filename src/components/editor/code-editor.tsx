'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { FileTree } from './file-tree';
import { CodeExecutor } from './code-executor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
}

interface FileNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  language?: string;
  content?: string;
  parentId?: string | null;
}

interface CodeEditorProps {
  projects: Project[];
  selectedProject: Project | null;
  initialFiles: FileNode[];
  organizationId: string;
}

export function CodeEditor({
  projects,
  selectedProject,
  initialFiles,
  organizationId,
}: CodeEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [code, setCode] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [creatingFile, setCreatingFile] = useState<{
    parentId: string | null;
    isDirectory: boolean;
  } | null>(null);

  // Detect language from file extension
  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      json: 'json',
      html: 'html',
      css: 'css',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleProjectChange = (projectId: string) => {
    router.push(`/dashboard/editor?projectId=${projectId}`);
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.isDirectory) return;

    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }

    setSelectedFile(file);
    setCode(file.content || '');
    setHasUnsavedChanges(false);
  };

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedFile || !selectedProject) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: selectedFile.id,
          content: code,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save file');
      }

      setHasUnsavedChanges(false);
      toast.success('File saved successfully');

      // Update local state
      setFiles((prev) =>
        prev.map((f) =>
          f.id === selectedFile.id ? { ...f, content: code } : f
        )
      );
      setSelectedFile({ ...selectedFile, content: code });
    } catch (error) {
      toast.error('Failed to save file');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (parentId: string | null, isDirectory: boolean) => {
    setCreatingFile({ parentId, isDirectory });
  };

  const handleCreateFileSubmit = async () => {
    if (!newFileName || !selectedProject || !creatingFile) return;

    try {
      const parent = creatingFile.parentId
        ? files.find((f) => f.id === creatingFile.parentId)
        : null;
      const path = parent
        ? `${parent.path}/${newFileName}`
        : newFileName;

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          name: newFileName,
          path,
          isDirectory: creatingFile.isDirectory,
          parentId: creatingFile.parentId,
          language: creatingFile.isDirectory
            ? undefined
            : getLanguageFromPath(newFileName),
          content: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create file');
      }

      const newFile = await response.json();
      setFiles((prev) => [...prev, newFile]);
      toast.success(
        `${creatingFile.isDirectory ? 'Folder' : 'File'} created successfully`
      );
      setNewFileName('');
      setCreatingFile(null);
      router.refresh();
    } catch (error) {
      toast.error('Failed to create file');
      console.error(error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files?fileId=${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setCode('');
      }
      toast.success('File deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Select
          value={selectedProject?.id || ''}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedFile && (
          <>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFile.path}
              </span>
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-500">● Unsaved</span>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        )}
      </div>

      {/* New File Dialog */}
      {creatingFile && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              Create New {creatingFile.isDirectory ? 'Folder' : 'File'}
            </h3>
            <Input
              placeholder={creatingFile.isDirectory ? 'Folder name' : 'File name'}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFileSubmit();
                if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreateFileSubmit} className="flex-1">
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingFile(null);
                  setNewFileName('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 flex-shrink-0">
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Editor and Output */}
        <div className="flex-1 flex flex-col">
          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            {selectedFile ? (
              <Editor
                height="100%"
                language={selectedFile.language || 'plaintext'}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  rulers: [80, 120],
                  wordWrap: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  fixedOverflowWidgets: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a file to start editing
              </div>
            )}
          </div>

          {/* Code Executor */}
          {selectedFile && selectedProject && (
            <div className="h-64 border-t border-gray-200 dark:border-gray-700">
              <CodeExecutor
                code={code}
                language={selectedFile.language || 'plaintext'}
                projectId={selectedProject.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
