import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

// ── Badge ────────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'amber' | 'gray' | 'red' | 'purple';
const badgeStyles: Record<BadgeVariant, string> = {
  blue:  'bg-blue-50 text-blue-800 border-blue-200',
  green: 'bg-green-50 text-green-800 border-green-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  gray:  'bg-gray-100 text-gray-600 border-gray-200',
  red:   'bg-red-50 text-red-700 border-red-200',
  purple:'bg-purple-50 text-purple-700 border-purple-200',
};
export function Badge({ children, variant = 'gray' }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[variant]}`}>{children}</span>;
}

export function DomainBadge({ domain }: { domain: string }) {
  const v = domain === 'תשתיות' ? 'green' : domain === 'בינוי' ? 'blue' : 'amber';
  return <Badge variant={v}>{domain}</Badge>;
}

export function StatusPill({ submitted, sent }: { submitted?: string | null; sent?: string | null }) {
  if (submitted) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">מילא</span>;
  if (sent)      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">ממתין</span>;
  return             <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">לא נשלח</span>;
}

// ── Button ───────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md';
}
const btnBase = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnVariants = {
  primary:   'bg-[#1B3A6B] text-white hover:bg-[#2E75B6] border border-transparent',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  danger:    'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  ghost:     'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100',
};
const btnSizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
export function Button({ variant='secondary', loading, size='md', children, className='', ...props }: BtnProps) {
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="text-sm font-medium text-gray-500 mb-4 pb-3 border-b border-gray-100">{children}</div>;
}

// ── Stat Card ────────────────────────────────────────────────
export function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className={`text-2xl font-medium mb-1 ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

// ── Form fields ──────────────────────────────────────────────
const fieldBase = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors';

interface FieldProps { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode; className?: string; }
export function Field({ label, required, hint, error, children, className="" }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-gray-600">
        {required && <span className="text-red-500 ml-0.5">*</span>}{label}
      </label>
      {children}
      {hint  && <span className="text-xs text-gray-400">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} ${className}`} {...props}>{children}</select>;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} min-h-[72px] resize-y ${className}`} {...props} />;
}

// ── Avatar ───────────────────────────────────────────────────
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-blue-50 text-blue-800 flex items-center justify-center font-medium flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Loading / Empty ──────────────────────────────────────────
export function Loading({ text = 'טוען...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> {text}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-gray-400">{text}</div>;
}

// ── Alert ────────────────────────────────────────────────────
export function Alert({ type, children }: { type: 'success' | 'error' | 'info'; children: ReactNode }) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-700',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  };
  return <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>{children}</div>;
}
