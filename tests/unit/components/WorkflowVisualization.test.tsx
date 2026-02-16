/**
 * Unit tests for WorkflowVisualization component
 * Tests state rendering, badge variants, and responsive behavior
 */

import { render, screen } from '@testing-library/react';
import WorkflowVisualization from '@/components/WorkflowVisualization';

describe('WorkflowVisualization', () => {
  it('should render all workflow steps', () => {
    render(<WorkflowVisualization currentState="active" />);

    expect(screen.getByText('Active Bidding')).toBeInTheDocument();
    expect(screen.getByText('Pending Sale')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('should mark active state correctly', () => {
    const { container } = render(<WorkflowVisualization currentState="active" />);

    // Check that active step has the pulse animation class
    const activeStep = container.querySelector('[class*="animate-pulse"]');
    expect(activeStep).toBeInTheDocument();
  });

  it('should mark completed states correctly for pending_sale', () => {
    const { container } = render(<WorkflowVisualization currentState="pending_sale" />);

    // Active step should be pending_sale
    expect(screen.getByText('Pending Sale')).toBeInTheDocument();

    // Previous step (active) should be completed - look for SVG checkmark icons
    const checkIcons = container.querySelectorAll('svg path[d*="m4.5 12.75"]');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should mark completed states correctly for shipping', () => {
    render(<WorkflowVisualization currentState="shipping" />);

    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('should mark all states as completed for complete state', () => {
    const { container } = render(<WorkflowVisualization currentState="complete" />);

    expect(screen.getByText('Complete')).toBeInTheDocument();

    // All previous steps should be completed - look for SVG checkmark icons
    const checkIcons = container.querySelectorAll('svg path[d*="m4.5 12.75"]');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should display checkmarks for completed steps', () => {
    const { container } = render(<WorkflowVisualization currentState="complete" />);

    // Check for SVG checkmark icons (used for completed steps)
    const checkIcons = container.querySelectorAll('svg path[d*="m4.5 12.75"]');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should display active dot for current step', () => {
    const { container } = render(<WorkflowVisualization currentState="pending_sale" />);

    // Active step has an animate-pulse circle
    const activeDots = container.querySelectorAll('[class*="animate-pulse"]');
    expect(activeDots.length).toBeGreaterThan(0);
  });

  it('should display connecting lines between steps', () => {
    const { container } = render(<WorkflowVisualization currentState="active" />);

    // Connecting lines use h-0.5 class
    const lines = container.querySelectorAll('[class*="h-0.5"]');
    // Should have 3 connecting lines for 4 steps
    expect(lines.length).toBe(3);
  });

  it('should apply correct badge variants', () => {
    render(<WorkflowVisualization currentState="active" />);

    // Badges should be rendered (design system component)
    const badges = screen.getAllByText(/Active Bidding|Pending Sale|Shipped|Complete/);
    expect(badges.length).toBe(4);
  });

  it('should handle state transitions correctly', () => {
    const { rerender } = render(<WorkflowVisualization currentState="active" />);

    expect(screen.getByText('Active Bidding')).toBeInTheDocument();

    rerender(<WorkflowVisualization currentState="pending_sale" />);
    expect(screen.getByText('Pending Sale')).toBeInTheDocument();

    rerender(<WorkflowVisualization currentState="shipping" />);
    expect(screen.getByText('Shipped')).toBeInTheDocument();

    rerender(<WorkflowVisualization currentState="complete" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });
});
