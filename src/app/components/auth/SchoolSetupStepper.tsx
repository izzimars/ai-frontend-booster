type SchoolSetupStepperProps = {
  currentStep: number;
};

const steps = [
  { step: 1, label: 'Academic Session' },
  { step: 2, label: 'Term Configuration' },
  { step: 3, label: 'School Levels' },
  { step: 4, label: 'Class Creation' },
];

export function SchoolSetupStepper({ currentStep }: SchoolSetupStepperProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => {
          const isActive = currentStep === item.step;
          const isComplete = currentStep > item.step;

          return (
            <li
              key={item.step}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50'
                  : isActive
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                }`}
              >
                {item.step}
              </span>
              <span className="text-sm font-medium text-slate-800">{item.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}