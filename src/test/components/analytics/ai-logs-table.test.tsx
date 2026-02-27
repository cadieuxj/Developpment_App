import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AILogsTable } from '@/components/analytics/ai-logs-table';
import type { AILog } from '@/lib/db/schema';

// ---- Helpers -----------------------------------------------------------------

function makeLog(overrides: Partial<AILog> = {}): AILog {
  return {
    id: 'log_1',
    tenantId: 'tenant_1',
    projectId: 'proj_1',
    taskId: null,
    model: 'gpt-4o-mini',
    provider: 'openai',
    promptTokens: 100,
    completionTokens: 200,
    totalTokens: 300,
    cost: 0.000645,
    prompt: JSON.stringify([{ role: 'user', content: 'Explain quantum entanglement' }]),
    completion: 'Quantum entanglement is a phenomenon where particles become interconnected.',
    operation: 'chat',
    metadata: {},
    traceId: 'trace_abc123',
    userId: 'user_1',
    createdAt: new Date('2026-02-27T10:00:00Z'),
    ...overrides,
  };
}

// ---- Tests -------------------------------------------------------------------

describe('AILogsTable', () => {
  it('shows empty state when no logs exist', () => {
    render(<AILogsTable logs={[]} />);
    expect(screen.getByText('No AI interactions yet')).toBeInTheDocument();
  });

  it('renders a row for each log entry', () => {
    const logs = [makeLog(), makeLog({ id: 'log_2', model: 'claude-3-5-sonnet' })];
    render(<AILogsTable logs={logs} />);
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByText('claude-3-5-sonnet')).toBeInTheDocument();
  });

  it('truncates long prompts in the table view', () => {
    const longContent = 'A'.repeat(200);
    const log = makeLog({
      prompt: JSON.stringify([{ role: 'user', content: longContent }]),
    });
    render(<AILogsTable logs={[log]} />);
    // Should show "[USER] AAA..." truncated, not the full 200 chars
    const cells = screen.getAllByText(/\[USER\]/);
    expect(cells.length).toBeGreaterThan(0);
    // The rendered text should be shorter than the full message
    const fullText = '[USER] ' + longContent;
    expect(cells[0].textContent!.length).toBeLessThan(fullText.length);
  });

  it('renders operation badge', () => {
    render(<AILogsTable logs={[makeLog()]} />);
    expect(screen.getByText('chat')).toBeInTheDocument();
  });

  it('renders cost formatted to 6 decimal places', () => {
    render(<AILogsTable logs={[makeLog({ cost: 0.000645 })]} />);
    expect(screen.getByText('$0.000645')).toBeInTheDocument();
  });

  it('shows detail dialog when a row is clicked', () => {
    render(<AILogsTable logs={[makeLog()]} />);

    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]); // rows[0] is the header

    // Radix Dialog renders in a portal — use document.body as the container
    expect(document.body).toHaveTextContent('AI Interaction Detail');
    expect(document.body).toHaveTextContent('Prompt');
    expect(document.body).toHaveTextContent('Completion');
  });

  it('shows full prompt text in dialog', () => {
    render(<AILogsTable logs={[makeLog()]} />);
    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]);

    expect(document.body).toHaveTextContent('Explain quantum entanglement');
  });

  it('shows full completion text in dialog', () => {
    render(<AILogsTable logs={[makeLog()]} />);
    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]);

    expect(document.body).toHaveTextContent('Quantum entanglement is a phenomenon');
  });

  it('shows token breakdown in dialog', () => {
    render(<AILogsTable logs={[makeLog()]} />);
    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]);

    expect(document.body).toHaveTextContent('Prompt Tokens');
    expect(document.body).toHaveTextContent('Completion Tokens');
    expect(document.body).toHaveTextContent('Total Tokens');
  });

  it('shows trace ID in dialog when present', () => {
    render(<AILogsTable logs={[makeLog()]} />);
    const rows = screen.getAllByRole('row');
    fireEvent.click(rows[1]);
    expect(screen.getByText(/trace_abc123/)).toBeInTheDocument();
  });

  it('shows dash when prompt is null', () => {
    const log = makeLog({ prompt: null });
    render(<AILogsTable logs={[log]} />);
    // Multiple "—" cells may appear, just check it doesn't throw
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});
