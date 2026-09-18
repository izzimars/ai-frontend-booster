import { Check, X } from 'lucide-react';
import { evaluatePassword } from '../../../services/authService';

type PasswordStrengthRulesProps = {
  password: string;
};

export function PasswordStrengthRules({ password }: PasswordStrengthRulesProps) {
  if (!password) return null;

  const rules = evaluatePassword(password);

  const items: Array<{ met: boolean; label: string }> = [
    { met: rules.minLength, label: '8–128 characters' },
    { met: rules.hasUpper, label: 'One uppercase letter' },
    { met: rules.hasLower, label: 'One lowercase letter' },
    { met: rules.hasNumber, label: 'One number' },
    { met: rules.hasSpecial, label: 'One special character (@$!%*?&)' },
  ];

  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          {item.met ? (
            <Check className="h-4 w-4 text-register-green" />
          ) : (
            <X className="h-4 w-4 text-slate" />
          )}
          <span className={item.met ? 'text-register-green' : 'text-slate'}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
