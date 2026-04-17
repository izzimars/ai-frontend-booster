import { ReactNode } from 'react';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f2f7ff_0%,#f8fafc_30%,#eef2ff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200/70 bg-white/80 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <div className="grid min-h-[680px] lg:grid-cols-[1.1fr_1fr]">
          <div className="hidden border-r border-slate-200/70 bg-[linear-gradient(160deg,#0f172a_0%,#1e3a8a_45%,#0ea5e9_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                SchoolOS Access
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-tight">Secure onboarding for school leadership teams.</h1>
              <p className="mt-4 text-sm text-blue-100/95">
                Set up your school account, verify institution details, and continue into your operational dashboard.
              </p>
            </div>
            <div className="space-y-3 text-sm text-blue-100/95">
              <p>Trusted by administrators across multi-campus school systems.</p>
              <p>Data protected with enterprise-grade controls.</p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </div>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 text-sm text-slate-600">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
