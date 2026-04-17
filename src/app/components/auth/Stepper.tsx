import { Check } from 'lucide-react';
import { motion } from 'motion/react';

export type SetupStage =
  | 'pending'
  | 'session_created'
  | 'term_created'
  | 'level_created'
  | 'levels_created'
  | 'classes_created';

const stageToStepMap: Record<SetupStage, number> = {
  pending: 1,
  session_created: 2,
  term_created: 3,
  level_created: 4,
  levels_created: 4,
  classes_created: 4,
};

export const mapSetupStageToStepIndex = (setupStage: SetupStage | string | undefined | null) => {
  if (!setupStage) return 1;
  if (setupStage in stageToStepMap) {
    return stageToStepMap[setupStage as SetupStage];
  }
  return 1;
};

type StepperProps = {
  activeStep: number;
};

const steps = [
  { id: 1, label: 'Academic Session' },
  { id: 2, label: 'Term Configuration' },
  { id: 3, label: 'School Levels' },
  { id: 4, label: 'Class Creation' },
];

export function Stepper({ activeStep }: StepperProps) {
  const clampedStep = Math.min(Math.max(activeStep, 1), steps.length);
  const progressPercent = ((clampedStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-6">
      <div className="relative">
        <div className="absolute left-5 right-5 top-5 h-[3px] rounded-full bg-slate-200" />

        <motion.div
          className="absolute left-5 top-5 h-[3px] rounded-full bg-emerald-500"
          initial={{ width: '0%' }}
          animate={{ width: `calc(${progressPercent}% - 0.25rem)` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        <ol className="relative flex items-start justify-between gap-2">
          {steps.map((step) => {
            const isCompleted = step.id < clampedStep;
            const isActive = step.id === clampedStep;

            return (
              <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="relative">
                  {isActive ? (
                    <span className="absolute inset-0 rounded-full bg-blue-400/35 animate-ping" />
                  ) : null}

                  <motion.div
                    layout
                    transition={{ duration: 0.25 }}
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : isActive
                          ? 'border-2 border-blue-600 bg-white text-blue-700'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                  </motion.div>
                </div>

                <p className="mt-2 hidden text-center text-xs font-medium text-slate-700 md:block">{step.label}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}