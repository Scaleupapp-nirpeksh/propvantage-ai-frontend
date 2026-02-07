import React, { createContext, useContext, useState, useCallback } from 'react';
import CoachMark from './CoachMark';

const STORAGE_KEY = 'propvantage_coach_marks';

// Get completed flows from localStorage
const getCompletedFlows = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

// Save completed flow
const markFlowComplete = (flowId) => {
  try {
    const completed = getCompletedFlows();
    completed[flowId] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  } catch { /* silent */ }
};

// Context
const CoachMarkContext = createContext({
  startFlow: () => {},
  resetFlow: () => {},
  resetAll: () => {},
  isFlowComplete: () => false,
  isActive: false,
});

export const useCoachMark = () => useContext(CoachMarkContext);

/**
 * CoachMarkProvider — wraps the app and manages coach mark flows.
 *
 * Usage:
 *   const { startFlow, isFlowComplete } = useCoachMark();
 *   useEffect(() => { if (!isFlowComplete('dashboard')) startFlow('dashboard'); }, []);
 */
const CoachMarkProvider = ({ children, flows = {} }) => {
  const [activeFlow, setActiveFlow] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedFlows, setCompletedFlows] = useState(getCompletedFlows);

  const isFlowComplete = useCallback(
    (flowId) => !!completedFlows[flowId],
    [completedFlows],
  );

  const startFlow = useCallback(
    (flowId, force = false) => {
      const flow = flows[flowId];
      if (!flow || (!force && isFlowComplete(flowId))) return;
      // Delay to ensure DOM is ready
      setTimeout(() => {
        setActiveFlow(flowId);
        setCurrentStep(0);
      }, 800);
    },
    [flows, isFlowComplete],
  );

  const endFlow = useCallback(
    (complete = true) => {
      if (activeFlow && complete) {
        markFlowComplete(activeFlow);
        setCompletedFlows(getCompletedFlows());
      }
      setActiveFlow(null);
      setCurrentStep(0);
    },
    [activeFlow],
  );

  const handleNext = useCallback(() => {
    const flow = flows[activeFlow];
    if (!flow) return;
    if (currentStep < flow.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [activeFlow, currentStep, flows]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => endFlow(true), [endFlow]);
  const handleComplete = useCallback(() => endFlow(true), [endFlow]);

  const resetFlow = useCallback((flowId) => {
    const completed = getCompletedFlows();
    delete completed[flowId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    setCompletedFlows({ ...completed });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCompletedFlows({});
  }, []);

  // Current step data
  const flow = activeFlow ? flows[activeFlow] : null;
  const stepData = flow?.steps?.[currentStep];

  return (
    <CoachMarkContext.Provider
      value={{
        startFlow,
        resetFlow,
        resetAll,
        isFlowComplete,
        isActive: !!activeFlow,
      }}
    >
      {children}

      {stepData && (
        <CoachMark
          open
          target={stepData.target}
          title={stepData.title}
          description={stepData.description}
          placement={stepData.placement || 'bottom'}
          step={currentStep + 1}
          totalSteps={flow.steps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onComplete={handleComplete}
        />
      )}
    </CoachMarkContext.Provider>
  );
};

export default CoachMarkProvider;
