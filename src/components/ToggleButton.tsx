import React from 'react';

interface ToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  isOn,
  onToggle,
  onLabel,
  offLabel,
  disabled = false
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : isOn
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
      `}
    >
      <div className="flex items-center space-x-2">
        <span>{isOn ? onLabel : offLabel}</span>
        <div
          className={`
            relative w-10 h-6 rounded-full transition-colors duration-200
            ${isOn ? 'bg-blue-500' : 'bg-gray-300'}
          `}
        >
          <div
            className={`
              absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
              ${isOn ? 'translate-x-5' : 'translate-x-0.5'}
            `}
          />
        </div>
      </div>
    </button>
  );
};

export default ToggleButton;