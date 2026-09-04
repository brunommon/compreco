import { Unit } from '../types';

const UNIDADES: Unit[] = ['g', 'kg', 'ml', 'L', 'un'];

interface UnitPickerProps {
  value: Unit;
  onChange: (unidade: Unit) => void;
}

export function UnitPicker({ value, onChange }: UnitPickerProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Unidade">
      {UNIDADES.map((unidade) => (
        <button
          key={unidade}
          type="button"
          onClick={() => onChange(unidade)}
          aria-pressed={unidade === value}
          className={`rounded-full px-3 py-1 text-sm ${unidade === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          {unidade}
        </button>
      ))}
    </div>
  );
}
