import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: string) => void;
  selectedFile?: string;
  accept?: string;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  accept = "image/jpeg,image/png",
  label = "Upload Home Plan Image"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onFileSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    onFileSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            cursor-pointer hover:border-blue-400 hover:bg-blue-50
            ${isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 bg-gray-50'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-3">
            <div className={`
              p-3 rounded-full transition-colors
              ${isDragging ? 'bg-blue-100' : 'bg-gray-200'}
            `}>
              <Upload 
                size={32} 
                className={isDragging ? 'text-blue-500' : 'text-gray-500'} 
              />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your image here, or 
                <span className="text-blue-500 hover:text-blue-600 ml-1 underline">
                  browse
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPEG and PNG files
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success Message */}
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="text-green-500" size={20} />
            <span className="text-green-700 font-medium">Image uploaded successfully</span>
            <button
              onClick={clearFile}
              className="ml-auto p-1 text-green-500 hover:text-green-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Image Preview */}
          <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <img
                src={selectedFile}
                alt="Home plan preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            <div className="absolute top-3 right-3">
              <button
                onClick={clearFile}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 
                         transition-colors shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Replace Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg 
                     hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <ImageIcon size={16} />
            <span>Choose Different Image</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;