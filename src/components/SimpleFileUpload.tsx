import React, { useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';

interface SimpleFileUploadProps {
  onFileSelected: (file: File) => void;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({ onFileSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];

        // 文件类型验证
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          alert('Please upload an Excel file (.xlsx or .xls)');
          return;
        }

        // 文件大小检查 (50MB限制)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          alert(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
          return;
        }

        console.log('Dropped file:', file.name, file.type, file.size);
        setUploadedFile(file);
        onFileSelected(file);
      }
    } catch (error) {
      console.error('Error handling file drop:', error);
      alert('Failed to process dropped file. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // 文件类型验证
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      // 文件大小检查 (50MB限制)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
        return;
      }

      console.log('Selected file:', file.name, file.type, file.size);
      setUploadedFile(file);
      onFileSelected(file);
    }
  };

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
        {uploadedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-8 h-8" />
              <span className="text-lg font-medium">File selected!</span>
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
                Choose a different file
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
    </div>
  );
};

export default SimpleFileUpload;