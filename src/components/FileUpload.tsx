import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import { WeeklyData, FilterOptions } from '../types';
import { XLSXParser } from '../utils/xlsxParser';

interface FileUploadProps {
  onDataLoaded: (data: WeeklyData[], filterOptions: FilterOptions) => void;
  onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      onError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const result = await XLSXParser.parseFile(file);
      onDataLoaded(result.data, result.filterOptions);
    } catch (error) {
      console.error('Error processing file:', error);
      onError(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg font-medium text-gray-900">Processing file...</p>
            <p className="text-sm text-gray-600">This may take a moment for large files</p>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-8 h-8" />
              <span className="text-lg font-medium">File uploaded successfully!</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <File className="w-5 h-5" />
              <span className="text-sm">{uploadedFile.name}</span>
            </div>
            <label className="inline-block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                Upload a different file
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your Excel file here, or click to browse
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Supports .xlsx and .xls files
              </p>
            </div>
            <label className="inline-block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                Choose File
              </span>
            </label>
          </div>
        )}
      </div>

      {!uploadedFile && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Expected file format:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Excel file with weekly PSP performance data</li>
                <li>Columns should include: Country, PSP, Week, Press Buy Count, Converted Count</li>
                <li>Optional: Last Selected Payment Option</li>
                <li>Data will be automatically processed to calculate conversion rates and shares</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;