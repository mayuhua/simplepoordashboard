import React, { useState } from 'react';
import { BarChart3, AlertCircle, ArrowLeft } from 'lucide-react';
import SimpleFileUpload from './components/SimpleFileUpload';
import DynamicFilters from './components/DynamicFilters';
import ImprovedDynamicChart from './components/ImprovedDynamicChart';
import { WeeklyData } from './types';
import { DynamicDashboardProcessor, DashboardData } from './utils/dashboardProcessor';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<WeeklyData[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'dashboard'>('upload');
  const [selectedPSPs, setSelectedPSPs] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPaymentOptions, setSelectedPaymentOptions] = useState<string[]>([]);
  const [validPaymentOptions, setValidPaymentOptions] = useState<string[]>([]);

  const handleFileSelected = async (file: File) => {
    console.log('File selected for processing:', file);
    setIsProcessing(true);
    setProcessingProgress(0);

    // 添加处理超时
    const processingTimeout = setTimeout(() => {
      setError('File processing is taking too long. Please try with a smaller file or check if it\'s corrupted.');
      setIsProcessing(false);
      setProcessingProgress(0);
    }, 120000); // 2分钟超时

    try {
      setProcessingProgress(10);

      // 动态导入 XLSXParser，添加错误处理
      let XLSXParser;
      try {
        const modules = await Promise.all([
          import('./utils/xlsxParser')
        ]);
        XLSXParser = modules[0].XLSXParser;
      } catch (importError) {
        throw new Error('Failed to load processing modules. Please refresh the page and try again.');
      }

      setProcessingProgress(30);
      console.log('Starting file processing...');

      // 添加文件处理超时包装
      const result = await Promise.race([
        XLSXParser.parseFile(file),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('File parsing timeout - file may be too large or corrupted')), 90000)
        )
      ]);

      setProcessingProgress(70);
      console.log('File processing completed:', result);

      if (!result || !result.data || result.data.length === 0) {
        throw new Error('No valid data found in the file. Please check the file format and column names.');
      }

      setRawData(result.data);

      setProcessingProgress(85);

      // 处理数据为仪表板格式
      console.log('Processing data for dashboard...');
      const processedDashboardData = DynamicDashboardProcessor.processForDashboard(result.data);
      setDashboardData(processedDashboardData);

      setProcessingProgress(100);
      setError(null);

      // 切换到仪表板视图
      setTimeout(() => {
        setCurrentView('dashboard');
      }, 500);

    } catch (error) {
      console.error('Error processing file:', error);

      // 提供更友好的错误消息
      let errorMessage = 'Failed to process file';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Processing timeout - the file may be too large. Please try with a smaller file.';
        } else if (error.message.includes('size')) {
          errorMessage = error.message;
        } else if (error.message.includes('format') || error.message.includes('parse')) {
          errorMessage = 'Invalid file format. Please ensure this is a valid Excel file with the correct columns.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setRawData([]);
      setDashboardData(null);
    } finally {
      clearTimeout(processingTimeout);
      setIsProcessing(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleBackToUpload = () => {
    setCurrentView('upload');
    setDashboardData(null);
    setRawData([]);
    setSelectedPSPs([]);
    setSelectedWeeks([]);
    setSelectedCountries([]);
    setSelectedPaymentOptions([]);
    setValidPaymentOptions([]);
  };

  // 更新Payment Options有效性的函数
  const updateValidPaymentOptions = (
    psps: string[],
    weeks: string[],
    countries: string[]
  ) => {
    if (!rawData || rawData.length === 0) {
      setValidPaymentOptions([]);
      return;
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

    setValidPaymentOptions([...validOptions]);
  };

  // 当筛选器变化时更新有效的Payment Options
  React.useEffect(() => {
    updateValidPaymentOptions(selectedPSPs, selectedWeeks, selectedCountries);
  }, [selectedPSPs, selectedWeeks, selectedCountries, rawData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Simple Poor Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Dynamic payment service provider performance analysis
                </p>
              </div>
            </div>
            {currentView === 'dashboard' && (
              <button
                onClick={handleBackToUpload}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Upload New File</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {currentView === 'upload' && (
          <div className="space-y-8">
            {rawData.length === 0 && !isProcessing && (
              <>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Performance Analysis Dashboard
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Upload your Excel file to start analyzing payment service provider performance with dynamic filtering
                  </p>
                </div>
                <SimpleFileUpload onFileSelected={handleFileSelected} />
              </>
            )}

            {isProcessing && (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800 font-medium">Processing file... {processingProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    {processingProgress < 30 && 'Loading file...'}
                    {processingProgress >= 30 && processingProgress < 70 && 'Parsing Excel data...'}
                    {processingProgress >= 70 && processingProgress < 85 && 'Processing for dashboard...'}
                    {processingProgress >= 85 && 'Preparing dashboard...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Data Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.filterOptions.psps.length}
                  </div>
                  <div className="text-sm text-gray-600">PSPs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.filterOptions.countries.length}
                  </div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData.filterOptions.weeks.length}
                  </div>
                  <div className="text-sm text-gray-600">Weeks</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <DynamicFilters
              psps={dashboardData.filterOptions.psps.map(psp => ({ value: psp, label: psp }))}
              weeks={dashboardData.filterOptions.weeks.map(week => ({ value: week, label: week }))}
              countries={dashboardData.filterOptions.countries.map(country => ({ value: country, label: country }))}
              paymentOptions={dashboardData.filterOptions.paymentOptions.map(option => ({ value: option, label: option }))}
              validPaymentOptions={validPaymentOptions}
              rawData={rawData}
              onPSPChange={setSelectedPSPs}
              onWeekChange={setSelectedWeeks}
              onCountryChange={setSelectedCountries}
              onPaymentOptionChange={setSelectedPaymentOptions}
            />

            {/* Improved Dynamic Chart */}
            <ImprovedDynamicChart
              data={dashboardData.aggregatedData}
              originalData={rawData}
              selectedPSPs={selectedPSPs}
              selectedWeeks={selectedWeeks}
              selectedCountries={selectedCountries}
              selectedPaymentOptions={selectedPaymentOptions}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Simple Poor Dashboard - Dynamic payment service provider performance analysis</p>
            <p className="mt-1">Upload Excel files to visualize PSP metrics with interactive filtering</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;