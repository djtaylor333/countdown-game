'use client';

interface Props {
  value: number;
  index: number;
  used?: boolean;
  isLarge?: boolean;
  onClick?: (index: number) => void;
  size?: 'sm' | 'md' | 'lg';
  animDelay?: number;
}

const sizeMap = {
  sm: 'text-xs sm:text-sm',
  md: 'text-sm sm:text-base',
  lg: 'text-base sm:text-2xl',
};

export default function NumberTile({ value, index, used, isLarge, onClick, size = 'md', animDelay = 0 }: Props) {
  const sizeClass = sizeMap[size];
  const typeClass = isLarge
    ? 'number-tile large'
    : 'number-tile small';
  const usedClass = used ? 'used' : '';
  const animClass = 'animate-tile-drop';

  return (
    <button
      className={`${typeClass} ${sizeClass} ${usedClass} ${animClass} w-full font-tile rounded-xl select-none`}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={() => !used && onClick?.(index)}
      disabled={used}
      aria-label={`Number ${value}${isLarge ? ' (large)' : ''}`}
    >
      {value}
    </button>
  );
}
