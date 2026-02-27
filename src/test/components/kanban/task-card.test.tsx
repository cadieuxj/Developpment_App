import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/kanban/task-card';
import type { Task } from '@/lib/db/schema';

// Mock dnd-kit (requires DOM features not available in jsdom)
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn().mockReturnValue('') } },
}));

// ---- Helpers -----------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_1',
    tenantId: 'tenant_1',
    projectId: 'proj_1',
    title: 'Implement auth flow',
    description: 'Add Clerk authentication to the app',
    status: 'todo',
    priority: 'medium',
    columnId: 'todo',
    position: 0,
    assignedTo: null,
    dueDate: null,
    wrikeTaskId: null,
    wrikeSyncedAt: null,
    aiContext: null,
    metadata: {},
    createdBy: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---- Tests -------------------------------------------------------------------

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText('Implement auth flow')).toBeInTheDocument();
  });

  it('renders task description when provided', () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByText('Add Clerk authentication to the app')).toBeInTheDocument();
  });

  it('does not render description section when absent', () => {
    render(<TaskCard task={makeTask({ description: null })} />);
    expect(screen.queryByText('Add Clerk authentication to the app')).not.toBeInTheDocument();
  });

  it('shows the priority badge', () => {
    render(<TaskCard task={makeTask({ priority: 'high' })} />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows AI context indicator when aiContext is populated', () => {
    render(
      <TaskCard
        task={makeTask({
          priority: 'high', // avoid collision with 'medium' complexity badge
          aiContext: { suggestedApproach: 'Use OAuth', estimatedComplexity: 'medium' },
        })}
      />
    );
    expect(screen.getByText('AI context attached')).toBeInTheDocument();
    // 'medium' appears as the complexity badge inside the AI context section
    const mediumBadges = screen.getAllByText('medium');
    expect(mediumBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show AI context indicator when aiContext is empty', () => {
    render(<TaskCard task={makeTask({ aiContext: {} })} />);
    expect(screen.queryByText('AI context attached')).not.toBeInTheDocument();
  });

  it('shows Wrike badge when wrikeTaskId is set', () => {
    render(<TaskCard task={makeTask({ wrikeTaskId: 'ITEM_123' })} />);
    expect(screen.getByText('Wrike')).toBeInTheDocument();
  });

  it('does not show Wrike badge when wrikeTaskId is absent', () => {
    render(<TaskCard task={makeTask({ wrikeTaskId: null })} />);
    expect(screen.queryByText('Wrike')).not.toBeInTheDocument();
  });

  it('shows due date when provided', () => {
    const dueDate = new Date('2026-03-15');
    render(<TaskCard task={makeTask({ dueDate })} />);
    // The component formats as "Mar 15"
    expect(screen.getByText(/Mar 15/)).toBeInTheDocument();
  });

  it('applies dragging opacity when isDragging is true', () => {
    const { container } = render(<TaskCard task={makeTask()} isDragging={true} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.opacity).toBe('0.4');
  });
});
