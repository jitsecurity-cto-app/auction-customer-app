'use client';

import { Badge } from '@design-system/components';
import styles from './WorkflowVisualization.module.css';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface WorkflowVisualizationProps {
  currentState: WorkflowState;
}

const workflowSteps = [
  { id: 'active', label: 'Active Bidding', key: 'active' as WorkflowState },
  { id: 'pending_sale', label: 'Pending Sale Completion', key: 'pending_sale' as WorkflowState },
  { id: 'shipping', label: 'Shipped', key: 'shipping' as WorkflowState },
  { id: 'complete', label: 'Complete', key: 'complete' as WorkflowState },
];

export default function WorkflowVisualization({ currentState }: WorkflowVisualizationProps) {
  const getStepStatus = (stepKey: WorkflowState) => {
    const currentIndex = workflowSteps.findIndex(s => s.key === currentState);
    const stepIndex = workflowSteps.findIndex(s => s.key === stepKey);
    
    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.workflowSteps}>
        {workflowSteps.map((step, index) => {
          const status = getStepStatus(step.key);
          const isLast = index === workflowSteps.length - 1;
          const prevStatus = index > 0 ? getStepStatus(workflowSteps[index - 1].key) : null;
          
          return (
            <div key={step.id} className={styles.stepContainer}>
              <div className={styles.step}>
                <div className={`${styles.stepCircle} ${styles[status]}`}>
                  {status === 'completed' && <span className={styles.checkmark}>✓</span>}
                  {status === 'active' && <span className={styles.activeDot}></span>}
                  {status === 'pending' && <span className={styles.pendingDot}></span>}
                </div>
                <Badge variant={getBadgeVariant(status)} size="sm" className={styles.stepBadge}>
                  {step.label}
                </Badge>
              </div>
              {!isLast && (
                <div className={`${styles.arrow} ${prevStatus === 'completed' || status === 'completed' ? styles.completed : ''}`}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
