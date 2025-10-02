import React, { useState, useEffect } from 'react';
import { MapPin, Loader, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { LocationData } from '../types';
import MapView from './MapView';

interface LocationSelectorProps {
  location: LocationData | null;
  district: string;
  subdivision: string;
  onLocationUpdate: (location: LocationData) => void;
  onDistrictChange: (district: string) => void;
  onSubdivisionChange: (subdivision: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  location,
  district,
  subdivision,
  onLocationUpdate,
  onDistrictChange,
  onSubdivisionChange
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualPincode, setManualPincode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // State for districts and subdistricts from backend
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<string[]>([]);

  // Fetch districts and subdistricts from backend
  useEffect(() => {
    fetch('http://localhost:5000/api/meta')
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data.districts || []);
        if (district) {
          setSubdistricts((data.subdistricts && data.subdistricts[district]) || []);
        }
      })
      .catch(() => setDistricts([]));
  }, []);

  // Update subdistricts when district changes
  useEffect(() => {
    if (!district) {
      setSubdistricts([]);
      return;
    }
    fetch('http://localhost:5000/api/meta')
      .then((res) => res.json())
      .then((data) => {
        setSubdistricts((data.subdistricts && data.subdistricts[district]) || []);
      })
      .catch(() => setSubdistricts([]));
  }, [district]);

  const handleDistrictChange = (districtName: string) => {
    onDistrictChange(districtName);
    onSubdivisionChange(''); // reset subdivision when district changes
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setIsDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mockAddress = `${subdivision}, ${district || 'Unknown District'}`;

        onLocationUpdate({
          latitude,
          longitude,
          address: mockAddress,
          district,
          subdivision
        });
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        setError(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualLocation = () => {
    if (!manualPincode || manualPincode.length !== 6) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    const coords = {
      lat: 11.1271 + (Math.random() - 0.5) * 2,
      lng: 78.6569 + (Math.random() - 0.5) * 2
    };

    onLocationUpdate({
      latitude: coords.lat,
      longitude: coords.lng,
      address: `${subdivision}, ${district}, PIN: ${manualPincode}`,
      district,
      subdivision
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
          <MapPin className="text-blue-500" size={24} />
          <span>Location Information</span>
        </h3>

        {/* District + Subdivision */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          {/* Subdivision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subdivision <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={subdivision}
                onChange={(e) => onSubdivisionChange(e.target.value)}
                disabled={!district}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10 disabled:bg-gray-100"
              >
                <option value="">Select Subdivision</option>
                {subdistricts.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Optional map + location */}
      {location && location.latitude && location.longitude && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Location on Map</h4>
          <div className="h-64 rounded-lg overflow-hidden">
            <MapView location={location} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
