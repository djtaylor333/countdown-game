'use client';

import type { Operation } from '../logic/types';

interface Props {
  op: Operation;
  selected?: boolean;
  onClick: (op: Operation) => void;
  disabled?: boolean;
}

const opLabels: Record<Operation, string> = {
  '+': '+',
  '-': '−',
  '×': '×',
  '÷': '÷',
};

export default function OperationButton({ op, selected, onClick, disabled }: Props) {
  return (
    <button
      onClick={() => !disabled && onClick(op)}
      disabled={disabled}
      aria-pressed={selected}
      className={`
        w-12 h-12 rounded-xl font-rajdhani font-bold text-xl select-none
        transition-all duration-120 active:scale-90
        ${selected
          ? 'bg-[#f6c90e] text-[#070e1c] shadow-[0_0_14px_rgba(246,201,14,0.5)] scale-105'
          : disabled
          ? 'bg-[#0f1f38] border-2 border-[#1a3560] text-slate-600 cursor-not-allowed'
          : 'bg-[#1a3560] border-2 border-[#2c5fa8] text-white hover:border-[#f6c90e] hover:bg-[#2c5fa8]'}
      `}
    >
      {opLabels[op]}
    </button>
  );
}
