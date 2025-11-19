import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface DynamicFiltersProps {
  psps: FilterOption[];
  weeks: FilterOption[];
  countries: FilterOption[];
  paymentOptions: FilterOption[];
  validPaymentOptions?: string[]; // 动态有效的Payment Options
  rawData?: WeeklyData[]; // 原始数据用于联动过滤
  onPSPChange: (selected: string[]) => void;
  onWeekChange: (selected: string[]) => void;
  onCountryChange: (selected: string[]) => void;
  onPaymentOptionChange: (selected: string[]) => void;
}

// WeeklyData 类型定义（如果还没有导入的话）
interface WeeklyData {
  week: string;
  country: string;
  psp: string;
  lastSelectedPaymentOption?: string;
}

const MultiSelectDropdown: React.FC<{
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}> = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    onChange(options.map(opt => opt.value));
    setIsOpen(false);
  };

  const handleClearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-700">
            {selected.length === 0 ? placeholder : `${selected.length} selected`}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {options.map(option => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => handleSelect(option.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DynamicFilters: React.FC<DynamicFiltersProps> = ({
  psps,
  weeks,
  countries,
  paymentOptions,
  validPaymentOptions = [],
  rawData = [],
  onPSPChange,
  onWeekChange,
  onCountryChange,
  onPaymentOptionChange
}) => {
  const [selectedPSPs, setSelectedPSPs] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPaymentOptions, setSelectedPaymentOptions] = useState<string[]>([]);
  const [dynamicValidPaymentOptions, setDynamicValidPaymentOptions] = useState<string[]>([]);

  // 计算基于当前筛选器的有效支付选项
  const calculateValidPaymentOptions = (
    psps: string[],
    weeks: string[],
    countries: string[]
  ): string[] => {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    const validOptions = new Set<string>();
    rawData.forEach(item => {
      const pspMatch = psps.length === 0 || psps.includes(item.psp);
      const weekMatch = weeks.length === 0 || weeks.includes(item.week);
      const countryMatch = countries.length === 0 || countries.includes(item.country);

      if (pspMatch && weekMatch && countryMatch && item.lastSelectedPaymentOption) {
        validOptions.add(item.lastSelectedPaymentOption);
      }
    });

    return [...validOptions];
  };

  // 当国家、PSP或周筛选变化时，更新有效的支付选项
  useEffect(() => {
    const newValidOptions = calculateValidPaymentOptions(selectedPSPs, selectedWeeks, selectedCountries);
    setDynamicValidPaymentOptions(newValidOptions);

    // 清除已选择但不再有效的支付选项
    if (selectedPaymentOptions.length > 0) {
      const stillValidOptions = selectedPaymentOptions.filter(option => newValidOptions.includes(option));
      if (stillValidOptions.length !== selectedPaymentOptions.length) {
        setSelectedPaymentOptions(stillValidOptions);
      }
    }
  }, [selectedPSPs, selectedWeeks, selectedCountries, rawData]);

  // 使用动态计算的有效选项或传入的有效选项
  const effectiveValidPaymentOptions = dynamicValidPaymentOptions.length > 0
    ? dynamicValidPaymentOptions
    : validPaymentOptions;

  React.useEffect(() => {
    onPSPChange(selectedPSPs);
  }, [selectedPSPs, onPSPChange]);

  React.useEffect(() => {
    onWeekChange(selectedWeeks);
  }, [selectedWeeks, onWeekChange]);

  React.useEffect(() => {
    onCountryChange(selectedCountries);
  }, [selectedCountries, onCountryChange]);

  React.useEffect(() => {
    onPaymentOptionChange(selectedPaymentOptions);
  }, [selectedPaymentOptions, onPaymentOptionChange]);

  const clearAllFilters = () => {
    setSelectedPSPs([]);
    setSelectedWeeks([]);
    setSelectedCountries([]);
    setSelectedPaymentOptions([]);
  };

  const hasActiveFilters = selectedPSPs.length > 0 || selectedWeeks.length > 0 ||
                          selectedCountries.length > 0 || selectedPaymentOptions.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Dynamic Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PSP Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PSP ({selectedPSPs.length}/{psps.length})
          </label>
          <MultiSelectDropdown
            options={psps}
            selected={selectedPSPs}
            onChange={setSelectedPSPs}
            placeholder="Select PSPs"
          />
        </div>

        {/* Week Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Week ({selectedWeeks.length}/{weeks.length})
          </label>
          <MultiSelectDropdown
            options={weeks}
            selected={selectedWeeks}
            onChange={setSelectedWeeks}
            placeholder="Select Weeks"
          />
        </div>

        {/* Country Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country ({selectedCountries.length}/{countries.length})
          </label>
          <MultiSelectDropdown
            options={countries}
            selected={selectedCountries}
            onChange={setSelectedCountries}
            placeholder="Select Countries"
          />
        </div>

        {/* Payment Option Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Option ({selectedPaymentOptions.length}/{effectiveValidPaymentOptions.length || paymentOptions.length})
          </label>
          <MultiSelectDropdown
            options={
              effectiveValidPaymentOptions.length > 0
                ? effectiveValidPaymentOptions.map(po => ({ value: po, label: po }))
                : paymentOptions
            }
            selected={selectedPaymentOptions}
            onChange={setSelectedPaymentOptions}
            placeholder={effectiveValidPaymentOptions.length > 0 ? "Select Payment Options" : "No payment options available"}
          />
          {effectiveValidPaymentOptions.length === 0 && paymentOptions.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Select countries or other filters to see available payment options
            </p>
          )}
          {effectiveValidPaymentOptions.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {effectiveValidPaymentOptions.length} payment option{effectiveValidPaymentOptions.length !== 1 ? 's' : ''} available for your selection
            </p>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-2">
            {selectedPSPs.map(psp => (
              <span
                key={psp}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                PSP: {psp}
                <button
                  onClick={() => setSelectedPSPs(selectedPSPs.filter(s => s !== psp))}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedWeeks.map(week => (
              <span
                key={week}
                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
              >
                Week: {week}
                <button
                  onClick={() => setSelectedWeeks(selectedWeeks.filter(s => s !== week))}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedCountries.map(country => (
              <span
                key={country}
                className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
              >
                Country: {country}
                <button
                  onClick={() => setSelectedCountries(selectedCountries.filter(s => s !== country))}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedPaymentOptions.map(option => (
              <span
                key={option}
                className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full"
              >
                Payment: {option}
                <button
                  onClick={() => setSelectedPaymentOptions(selectedPaymentOptions.filter(s => s !== option))}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicFilters;