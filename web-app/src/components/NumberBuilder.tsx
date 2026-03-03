'use client';

import type { Operation, EquationStep } from '../logic/types';
import OperationButton from './OperationButton';

interface Props {
  numbers: number[];
  usedIndices: number[];
  availableNumbers: number[];       // updated pool after each step
  currentLeft: number | null;
  currentOp: Operation | null;
  steps: EquationStep[];
  target: number;
  onPickLeft: (n: number) => void;
  onPickOp: (op: Operation) => void;
  onPickRight: (n: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

const OPS: Operation[] = ['+', '-', '×', '÷'];

export default function NumberBuilder({
  numbers,
  usedIndices,
  availableNumbers,
  currentLeft,
  currentOp,
  steps,
  target,
  onPickLeft,
  onPickOp,
  onPickRight,
  onUndo,
  onClear,
}: Props) {
  const LARGE = new Set([25, 50, 75, 100]);
  const lastResult = steps.length > 0 ? steps[steps.length - 1].result : null;
  const diff = lastResult !== null ? Math.abs(lastResult - target) : null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Steps so far */}
      {steps.length > 0 && (
        <div className="bg-[#0a1628] rounded-xl p-3 flex flex-col gap-1 border border-[#1a3560]">
          {steps.map((s, i) => (
            <div key={i} className="text-sm font-rajdhani text-slate-300 flex items-center gap-1">
              <span className="text-slate-400">{s.left}</span>
              <span className="text-[#f6c90e] mx-1">{s.op}</span>
              <span className="text-slate-400">{s.right}</span>
              <span className="text-slate-500 mx-1">=</span>
              <span className={`font-bold ${s.result === target ? 'text-green-400' : 'text-white'}`}>
                {s.result}
              </span>
              {s.result === target && <span className="ml-1 text-green-400">✓</span>}
            </div>
          ))}
          {diff !== null && diff > 0 && (
            <p className="text-xs text-slate-500 mt-1 border-t border-[#1a3560] pt-1">
              {diff} away from {target}
            </p>
          )}
        </div>
      )}

      {/* Current step build */}
      <div className="flex items-center justify-center gap-2 min-h-[44px] bg-[#0f1f38] rounded-xl border-2 border-[#1a3560] px-4 py-2">
        {currentLeft !== null ? (
          <>
            <span className="font-rajdhani font-bold text-xl text-[#f6c90e]">{currentLeft}</span>
            {currentOp && (
              <>
                <span className="font-rajdhani font-bold text-xl text-white mx-1">{currentOp}</span>
                <span className="font-rajdhani text-slate-400 text-xl">?</span>
              </>
            )}
          </>
        ) : (
          <span className="text-slate-500 text-sm italic">Pick a number to start</span>
        )}
      </div>

      {/* Available numbers */}
      <div className="flex flex-wrap gap-2 justify-center">
        {availableNumbers.map((n, i) => {
          const isPickable = currentLeft === null || (currentOp !== null && currentLeft !== null);
          return (
            <button
              key={i}
              onClick={() => {
                if (currentLeft === null) onPickLeft(n);
                else if (currentOp !== null) onPickRight(n);
              }}
              disabled={!isPickable}
              className={`
                number-tile ${LARGE.has(n) ? 'large' : 'small'} w-12 h-12 text-base font-rajdhani font-bold rounded-xl
                ${!isPickable ? 'opacity-40 cursor-not-allowed' : 'active:scale-90'}
              `}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Operation buttons */}
      {currentLeft !== null && currentOp === null && (
        <div className="flex gap-2 justify-center">
          {OPS.map(op => (
            <OperationButton
              key={op}
              op={op}
              selected={currentOp === op}
              onClick={onPickOp}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={steps.length === 0 && currentLeft === null}
          className="flex-1 py-2 rounded-xl border-2 border-[#1a3560] bg-[#0f1f38] text-sm font-medium text-slate-300
            disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2c5fa8] active:scale-95 transition-all"
        >
          ↩ Undo
        </button>
        <button
          onClick={onClear}
          disabled={steps.length === 0 && currentLeft === null}
          className="flex-1 py-2 rounded-xl border-2 border-[#1a3560] bg-[#0f1f38] text-sm font-medium text-slate-300
            disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2c5fa8] active:scale-95 transition-all"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
