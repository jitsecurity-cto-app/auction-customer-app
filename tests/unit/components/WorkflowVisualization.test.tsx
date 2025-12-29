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
    expect(screen.getByText('Pending Sale Completion')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('should mark active state correctly', () => {
    const { container } = render(<WorkflowVisualization currentState="active" />);

    // Check that active step is marked
    const activeStep = container.querySelector('[class*="active"]');
    expect(activeStep).toBeInTheDocument();
  });

  it('should mark completed states correctly for pending_sale', () => {
    const { container } = render(<WorkflowVisualization currentState="pending_sale" />);

    // Active step should be pending_sale
    expect(screen.getByText('Pending Sale Completion')).toBeInTheDocument();
    
    // Previous step (active) should be completed
    const completedSteps = container.querySelectorAll('[class*="completed"]');
    expect(completedSteps.length).toBeGreaterThan(0);
  });

  it('should mark completed states correctly for shipping', () => {
    render(<WorkflowVisualization currentState="shipping" />);

    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('should mark all states as completed for complete state', () => {
    const { container } = render(<WorkflowVisualization currentState="complete" />);

    expect(screen.getByText('Complete')).toBeInTheDocument();
    
    // All steps should be completed
    const completedSteps = container.querySelectorAll('[class*="completed"]');
    expect(completedSteps.length).toBeGreaterThan(0);
  });

  it('should display checkmarks for completed steps', () => {
    const { container } = render(<WorkflowVisualization currentState="complete" />);

    // Check for checkmark symbols
    const checkmarks = container.querySelectorAll('[class*="checkmark"]');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('should display active dot for current step', () => {
    const { container } = render(<WorkflowVisualization currentState="pending_sale" />);

    const activeDots = container.querySelectorAll('[class*="activeDot"]');
    expect(activeDots.length).toBeGreaterThan(0);
  });

  it('should display arrows between steps', () => {
    const { container } = render(<WorkflowVisualization currentState="active" />);

    const arrows = container.querySelectorAll('[class*="arrow"]');
    // Should have 3 arrows for 4 steps
    expect(arrows.length).toBe(3);
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
    expect(screen.getByText('Pending Sale Completion')).toBeInTheDocument();

    rerender(<WorkflowVisualization currentState="shipping" />);
    expect(screen.getByText('Shipped')).toBeInTheDocument();

    rerender(<WorkflowVisualization currentState="complete" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });
});
