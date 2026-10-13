import React from "react";
import { Check } from "lucide-react";
import { CREATOR_STEPS } from "./criador-data";

interface AvatarCreationStepperProps {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
  completedSteps?: number[];
}

export const AvatarCreationStepper: React.FC<AvatarCreationStepperProps> = ({
  currentStep,
  onSelectStep,
  completedSteps = [],
}) => {
  return (
    <div className="w-full bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-2.5 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {CREATOR_STEPS.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = completedSteps.includes(step.number);

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onSelectStep(step.number)}
              className={`relative flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/70 shadow-sm shadow-orange-500/10"
                  : isCompleted
                  ? "bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-500/50"
                  : "bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              {/* Step circle indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/40"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  step.number
                )}
              </div>

              {/* Step labels */}
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-semibold truncate ${
                    isActive
                      ? "text-orange-400"
                      : isCompleted
                      ? "text-slate-200"
                      : "text-slate-300"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {step.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarCreationStepper;
