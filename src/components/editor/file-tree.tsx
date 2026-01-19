'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  language?: string;
  content?: string;
  parentId?: string | null;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (parentId: string | null, isDirectory: boolean) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileTree({
  files,
  selectedFile,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (files: FileNode[]): FileNode[] => {
    const fileMap = new Map<string, FileNode>();
    const rootFiles: FileNode[] = [];

    // First pass: create map of all files
    files.forEach((file) => {
      fileMap.set(file.id, { ...file, children: [] });
    });

    // Second pass: build tree structure
    files.forEach((file) => {
      const node = fileMap.get(file.id)!;
      if (file.parentId) {
        const parent = fileMap.get(file.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          rootFiles.push(node);
        }
      } else {
        rootFiles.push(node);
      }
    });

    return rootFiles;
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFile?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group',
            isSelected && 'bg-blue-50 dark:bg-blue-900/20'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.isDirectory ? (
            <>
              <button
                onClick={() => toggleFolder(node.id)}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onFileSelect(node)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
                <span className="text-sm truncate">{node.name}</span>
              </button>
            </>
          ) : (
            <>
              <div className="w-4" />
              <button
                onClick={() => onFileSelect(node)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm truncate">{node.name}</span>
              </button>
            </>
          )}
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            {node.isDirectory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(node.id, false);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="New File"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(node.id);
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </div>
        {node.isDirectory && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree(files);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-semibold">Files</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFile(null, false)}
            title="New File"
          >
            <File className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFile(null, true)}
            title="New Folder"
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No files yet. Create your first file to get started.
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}
