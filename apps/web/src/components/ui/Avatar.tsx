import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showOnline?: boolean;
  className?: string;
}

// Deterministic color from name
const AVATAR_COLORS = [
  'bg-brand-default',
  'bg-success-default',
  'bg-warning-default',
  'bg-danger-default',
  'bg-info-default',
  'bg-brand-strong',
  'bg-brand-500',
  'bg-brand-400',
];

function colorFromName(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

const SIZE_CLS: Record<string, string> = {
  sm: 'h-7  w-7  text-[10px]',
  md: 'h-9  w-9  text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base',
  '2xl': 'h-16 w-16 text-lg',
};

const DOT_CLS: Record<string, string> = {
  sm: 'h-2 w-2 border',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-3.5 w-3.5 border-2',
  '2xl': 'h-4 w-4 border-2',
};

export function Avatar({
  name,
  size = 'md',
  showOnline = false,
  className,
}: AvatarProps) {
  const bg = colorFromName(name);
  return (
    <div className={cn('relative flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center font-black text-white',
          bg,
          SIZE_CLS[size],
        )}
      >
        {initials(name)}
      </div>
      {showOnline && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-success-default border-surface-card',
            DOT_CLS[size],
          )}
        />
      )}
    </div>
  );
}
