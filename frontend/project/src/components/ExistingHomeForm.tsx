import React, { useState } from 'react';
import { ChevronRight, User, CreditCard, MapPin, Home, Users, Square } from 'lucide-react';
import { UserData, ROOF_TYPES } from '../types';
import LocationSelector from './LocationSelector';

interface ExistingHomeFormProps {
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
  onSubmit: () => void;
}

const ExistingHomeForm: React.FC<ExistingHomeFormProps> = ({
  userData,
  onUpdateUserData,
  onSubmit
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    if (!userData.roofTypes || userData.roofTypes.length === 0) {
      newErrors.roofTypes = 'Please select at least one roof type';
    }

    if (userData.roofTypes) {
      for (const roofType of userData.roofTypes) {
        const area = userData.roofAreas?.[roofType];
        if (!area || area <= 0) {
          newErrors[`roofArea_${roofType}`] = `Area is required for ${roofType} roof`;
        }
      }
    }

    if (!userData.numberOfDwellers || userData.numberOfDwellers <= 0) {
      newErrors.numberOfDwellers = 'Number of dwellers is required';
    }

    if (userData.hasOpenSpace && (!userData.openSpaceArea || userData.openSpaceArea <= 0)) {
      newErrors.openSpaceArea = 'Open space area is required';
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

  const handleRoofTypeChange = (roofTypeId: string, checked: boolean) => {
    const currentRoofTypes = userData.roofTypes || [];
    const currentRoofAreas = userData.roofAreas || {};

    if (checked) {
      handleInputChange('roofTypes', [...currentRoofTypes, roofTypeId]);
    } else {
      const newRoofTypes = currentRoofTypes.filter(id => id !== roofTypeId);
      const newRoofAreas = { ...currentRoofAreas };
      delete newRoofAreas[roofTypeId];
      
      handleInputChange('roofTypes', newRoofTypes);
      handleInputChange('roofAreas', newRoofAreas);
    }
  };

  const handleRoofAreaChange = (roofTypeId: string, area: number) => {
    const currentRoofAreas = userData.roofAreas || {};
    handleInputChange('roofAreas', {
      ...currentRoofAreas,
      [roofTypeId]: area
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Existing Home Assessment
        </h2>
        <p className="text-gray-600">
          Tell us about your current home to create a customized rainwater harvesting plan 
          that fits your existing structure and needs.
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

        {/* Home Details */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
            <Home className="text-green-500" size={24} />
            <span>Home Details</span>
          </h3>

          {/* Roof Types */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Roof Type(s) <span className="text-red-500">*</span>
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              {ROOF_TYPES.map((roofType) => (
                <div key={roofType.id} className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={userData.roofTypes?.includes(roofType.id) || false}
                      onChange={(e) => handleRoofTypeChange(roofType.id, e.target.checked)}
                      className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-2xl">{roofType.icon}</span>
                    <span className="font-medium text-gray-700">{roofType.name}</span>
                  </label>

                  {userData.roofTypes?.includes(roofType.id) && (
                    <div className="ml-6">
                      <label className="block text-sm text-gray-600 mb-1">
                        {roofType.name} Roof Area (m²)
                      </label>
                      <div className="relative">
                        <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="number"
                          min="1"
                          step="0.1"
                          value={userData.roofAreas?.[roofType.id] || ''}
                          onChange={(e) => handleRoofAreaChange(roofType.id, parseFloat(e.target.value) || 0)}
                          className={`w-full pl-8 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 
                                    focus:border-transparent transition-all ${
                                      errors[`roofArea_${roofType.id}`] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                          placeholder="Enter area in m²"
                        />
                      </div>
                      {errors[`roofArea_${roofType.id}`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`roofArea_${roofType.id}`]}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.roofTypes && (
              <p className="mt-2 text-sm text-red-600">{errors.roofTypes}</p>
            )}
          </div>

          {/* Number of Dwellers */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Dwellers <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-xs">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                min="1"
                value={userData.numberOfDwellers || ''}
                onChange={(e) => handleInputChange('numberOfDwellers', parseInt(e.target.value) || 0)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                          focus:border-transparent transition-all ${
                            errors.numberOfDwellers ? 'border-red-500' : 'border-gray-300'
                          }`}
                placeholder="Enter number of people"
              />
            </div>
            {errors.numberOfDwellers && (
              <p className="mt-1 text-sm text-red-600">{errors.numberOfDwellers}</p>
            )}
          </div>

          {/* Open Space */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Open Space Available?
            </label>
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasOpenSpace"
                  checked={userData.hasOpenSpace === true}
                  onChange={() => handleInputChange('hasOpenSpace', true)}
                  className="w-4 h-4 text-green-500 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-green-600 font-medium">Yes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasOpenSpace"
                  checked={userData.hasOpenSpace === false}
                  onChange={() => handleInputChange('hasOpenSpace', false)}
                  className="w-4 h-4 text-red-500 focus:ring-2 focus:ring-red-500"
                />
                <span className="text-red-600 font-medium">No</span>
              </label>
            </div>

            {userData.hasOpenSpace && (
              <div className="max-w-xs">
                <label className="block text-sm text-gray-600 mb-2">
                  Open Space Area (m²) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={userData.openSpaceArea || ''}
                    onChange={(e) => handleInputChange('openSpaceArea', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                              focus:border-transparent transition-all ${
                                errors.openSpaceArea ? 'border-red-500' : 'border-gray-300'
                              }`}
                    placeholder="Enter area in m²"
                  />
                </div>
                {errors.openSpaceArea && (
                  <p className="mt-1 text-sm text-red-600">{errors.openSpaceArea}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-8">
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                     font-semibold text-lg rounded-xl hover:from-blue-600 hover:to-blue-700 
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

export default ExistingHomeForm;