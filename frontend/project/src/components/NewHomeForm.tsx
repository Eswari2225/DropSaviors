import React, { useState } from 'react';
import { ChevronRight, User, CreditCard, MapPin, Upload, Scan, Home } from 'lucide-react';
import { UserData } from '../types';
import LocationSelector from './LocationSelector';
import FileUpload from './FileUpload';

interface NewHomeFormProps {
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
  onSubmit: () => void;
}

const NewHomeForm: React.FC<NewHomeFormProps> = ({
  userData,
  onUpdateUserData,
  onSubmit
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cadDetection, setCadDetection] = useState<{
    roofArea: number;
    openArea: number;
    confidence: string;
    isDetecting: boolean;
    isDetected: boolean;
  }>({
    roofArea: 0,
    openArea: 0,
    confidence: '',
    isDetecting: false,
    isDetected: false
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userData.aadhaarNumber || userData.aadhaarNumber.length !== 12) {
      newErrors.aadhaarNumber = 'Valid 12-digit Aadhaar number is required';
    }

    if (!userData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!userData.district) {
      newErrors.district = 'District selection is required';
    }

    if (!userData.subdivision) {
      newErrors.subdivision = 'Subdivision selection is required';
    }

    if (!userData.homePlanImage) {
      newErrors.homePlanImage = 'Home plan image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    }
  };

  const handleInputChange = (field: keyof UserData, value: any) => {
    onUpdateUserData({ [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const detectAreasFromCAD = async (file: File) => {
    setCadDetection(prev => ({ ...prev, isDetecting: true, isDetected: false }));
    
    try {
      const formData = new FormData();
      formData.append('cad_file', file);

      const response = await fetch('http://127.0.0.1:5000/api/detect_areas', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setCadDetection({
          roofArea: data.roof_area,
          openArea: data.open_area,
          confidence: data.confidence,
          isDetecting: false,
          isDetected: true
        });

        // Update userData with detected areas
        onUpdateUserData({ 
          roofArea: data.roof_area,
          openSpaceArea: data.open_area,
          hasOpenSpace: data.open_area > 0
        });
      } else {
        setCadDetection(prev => ({ 
          ...prev, 
          isDetecting: false, 
          isDetected: false 
        }));
        alert('CAD detection failed: ' + data.error);
      }
    } catch (error) {
      setCadDetection(prev => ({ 
        ...prev, 
        isDetecting: false, 
        isDetected: false 
      }));
      console.error('Error detecting areas:', error);
      alert('Error detecting areas from CAD file');
    }
  };

  const handleFileSelect = (file: File | null) => {
    handleInputChange('homePlanImage', file);
    if (file) {
      detectAreasFromCAD(file);
    } else {
      setCadDetection({
        roofArea: 0,
        openArea: 0,
        confidence: '',
        isDetecting: false,
        isDetected: false
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          New Home Information
        </h2>
        <p className="text-gray-600">
          Let's gather information about your new construction project to design 
          the perfect rainwater harvesting system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
            <User className="text-blue-500" size={24} />
            <span>Personal Information</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                          focus:border-transparent transition-all ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={userData.aadhaarNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    handleInputChange('aadhaarNumber', value);
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                            focus:border-transparent transition-all ${
                              errors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                  placeholder="Enter 12-digit Aadhaar number"
                />
              </div>
              {errors.aadhaarNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.aadhaarNumber}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
              <textarea
                value={userData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                          focus:border-transparent transition-all resize-none ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                placeholder="Enter your complete address"
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Home Plan Upload */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
            <Upload className="text-green-500" size={24} />
            <span>Home Plan</span>
          </h3>

          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={userData.homePlanImage}
            label="Upload Home Plan Image (JPEG/PNG)"
          />
          {errors.homePlanImage && (
            <p className="mt-2 text-sm text-red-600">{errors.homePlanImage}</p>
          )}

          {/* CAD Detection Status */}
          {cadDetection.isDetecting && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Scan className="animate-spin text-blue-500" size={20} />
                <span className="text-blue-700 font-medium">Analyzing CAD file...</span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                Detecting roof area and open space from your uploaded plan.
              </p>
            </div>
          )}

          {/* CAD Detection Results */}
          {cadDetection.isDetected && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Home className="text-green-500" size={20} />
                <span className="text-green-700 font-medium">Areas Detected Successfully!</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-1">🏠 Roof Area</h4>
                  <p className="text-2xl font-bold text-blue-600">{cadDetection.roofArea} m²</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-1">🌲 Open Space</h4>
                  <p className="text-2xl font-bold text-green-600">{cadDetection.openArea} m²</p>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">Detection Confidence:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  cadDetection.confidence === 'high' 
                    ? 'bg-green-100 text-green-800'
                    : cadDetection.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {cadDetection.confidence.toUpperCase()}
                </span>
              </div>
              
              <p className="text-green-600 text-sm mt-2">
                ✅ Areas have been automatically filled in your assessment.
              </p>
            </div>
          )}
        </div>

        {/* Location Detection */}
        <LocationSelector
          location={userData.location || null}
          district={userData.district || ''}
          subdivision={userData.subdivision || ''}
          onLocationUpdate={(location) => handleInputChange('location', location)}
          onDistrictChange={(district) => handleInputChange('district', district)}
          onSubdivisionChange={(subdivision) => handleInputChange('subdivision', subdivision)}
        />
        {(errors.district || errors.subdivision) && (
          <div className="text-sm text-red-600 -mt-4 space-y-1">
            {errors.district && <p>{errors.district}</p>}
            {errors.subdivision && <p>{errors.subdivision}</p>}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center pt-8">
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white 
                     font-semibold text-lg rounded-xl hover:from-green-600 hover:to-green-700 
                     transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                     flex items-center space-x-2"
          >
            <span>Submit Information</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewHomeForm;