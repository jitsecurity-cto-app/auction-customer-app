'use client';

type WorkflowState = 'active' | 'pending_sale' | 'shipping' | 'complete';

interface WorkflowVisualizationProps {
  currentState: WorkflowState;
}

const workflowSteps = [
  { id: 'active', label: 'Active Bidding', key: 'active' as WorkflowState },
  { id: 'pending_sale', label: 'Pending Sale', key: 'pending_sale' as WorkflowState },
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

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {workflowSteps.map((step, index) => {
          const status = getStepStatus(step.key);
          const isLast = index === workflowSteps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    status === 'completed'
                      ? 'bg-primary-600 border-primary-600'
                      : status === 'active'
                      ? 'bg-primary-600 border-primary-600 animate-pulse'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {status === 'completed' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {status === 'active' && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                  {status === 'pending' && (
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                    status === 'completed' || status === 'active'
                      ? 'text-primary-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex-1 mx-2 mb-6">
                  <div
                    className={`h-0.5 w-full ${
                      status === 'completed' ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
