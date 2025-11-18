import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { FilterOptions } from '../types';

interface FilterPanelProps {
  filterOptions: FilterOptions;
  selectedCountries: string[];
  selectedPSPs: string[];
  selectedPaymentOptions: string[];
  onCountryChange: (countries: string[]) => void;
  onPSPChange: (psps: string[]) => void;
  onPaymentOptionChange: (options: string[]) => void;
  onClearAll: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filterOptions,
  selectedCountries,
  selectedPSPs,
  selectedPaymentOptions,
  onCountryChange,
  onPSPChange,
  onPaymentOptionChange,
  onClearAll
}) => {
  const [expandedSections, setExpandedSections] = useState({
    countries: true,
    psps: true,
    paymentOptions: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleMultiSelect = (
    value: string,
    currentSelection: string[],
    onChange: (selection: string[]) => void
  ) => {
    if (value === 'all') {
      onChange([]);
    } else {
      if (currentSelection.includes(value)) {
        onChange(currentSelection.filter(item => item !== value));
      } else {
        onChange([...currentSelection, value]);
      }
    }
  };

  const FilterSection: React.FC<{
    title: string;
    sectionKey: keyof typeof expandedSections;
    options: string[];
    selected: string[];
    onChange: (selection: string[]) => void;
  }> = ({ title, sectionKey, options, selected, onChange }) => (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            expandedSections[sectionKey] ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expandedSections[sectionKey] && (
        <div className="p-4 border-t bg-white">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={selected.length === 0}
                onChange={() => onChange([])}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">All ({options.length})</span>
            </label>

            {options.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => handleMultiSelect(option, selected, onChange)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const hasActiveFilters = selectedCountries.length > 0 ||
                           selectedPSPs.length > 0 ||
                           selectedPaymentOptions.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <FilterSection
          title="Countries"
          sectionKey="countries"
          options={filterOptions.countries}
          selected={selectedCountries}
          onChange={onCountryChange}
        />

        <FilterSection
          title="PSPs"
          sectionKey="psps"
          options={filterOptions.psps}
          selected={selectedPSPs}
          onChange={onPSPChange}
        />

        {filterOptions.lastSelectedPaymentOptions.length > 0 && (
          <FilterSection
            title="Last Selected Payment Option"
            sectionKey="paymentOptions"
            options={filterOptions.lastSelectedPaymentOptions}
            selected={selectedPaymentOptions}
            onChange={onPaymentOptionChange}
          />
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <div>Active Filters:</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedCountries.map(country => (
                <span
                  key={country}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {country}
                  <button
                    onClick={() => onCountryChange(selectedCountries.filter(c => c !== country))}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedPSPs.map(psp => (
                <span
                  key={psp}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {psp}
                  <button
                    onClick={() => onPSPChange(selectedPSPs.filter(p => p !== psp))}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedPaymentOptions.map(option => (
                <span
                  key={option}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {option}
                  <button
                    onClick={() => onPaymentOptionChange(selectedPaymentOptions.filter(o => o !== option))}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;