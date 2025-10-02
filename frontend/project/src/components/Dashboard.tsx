import React from 'react';
import { Home, Building, ChevronRight } from 'lucide-react';

interface DashboardProps {
  selectedOption: 'new' | 'existing' | null;
  onSelectOption: (option: 'new' | 'existing') => void;
  onContinue: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  selectedOption,
  onSelectOption,
  onContinue
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
          Welcome to Your Water Conservation Journey
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let's create a customized rainwater harvesting plan for your home. 
          Choose your situation to get started.
        </p>
      </div>

      {/* Option Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Existing Home Card */}
        <div
          onClick={() => onSelectOption('existing')}
          className={`
            relative p-8 rounded-2xl cursor-pointer transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2 group
            ${selectedOption === 'existing' 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl scale-105' 
              : 'bg-white hover:bg-gray-50 shadow-lg border-2 border-transparent hover:border-blue-200'
            }
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <Home 
              size={48} 
              className={`
                ${selectedOption === 'existing' ? 'text-white' : 'text-blue-500'}
                group-hover:scale-110 transition-transform
              `} 
            />
            {selectedOption === 'existing' && (
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
          
          <h3 className={`text-2xl font-bold mb-4 ${
            selectedOption === 'existing' ? 'text-white' : 'text-gray-800'
          }`}>
            🏠 Existing Home
          </h3>
          
          <p className={`text-lg mb-6 ${
            selectedOption === 'existing' ? 'text-blue-100' : 'text-gray-600'
          }`}>
            Perfect for homeowners looking to retrofit their existing property with 
            rainwater harvesting systems.
          </p>

          <ul className={`space-y-2 text-sm ${
            selectedOption === 'existing' ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <li>• Assess current roof and space</li>
            <li>• Retrofit-friendly solutions</li>
            <li>• Cost-effective upgrades</li>
            <li>• Quick implementation</li>
          </ul>
        </div>

        {/* New Home Card */}
        <div
          onClick={() => onSelectOption('new')}
          className={`
            relative p-8 rounded-2xl cursor-pointer transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2 group
            ${selectedOption === 'new' 
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl scale-105' 
              : 'bg-white hover:bg-gray-50 shadow-lg border-2 border-transparent hover:border-green-200'
            }
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <Building 
              size={48} 
              className={`
                ${selectedOption === 'new' ? 'text-white' : 'text-green-500'}
                group-hover:scale-110 transition-transform
              `} 
            />
            {selectedOption === 'new' && (
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            )}
          </div>
          
          <h3 className={`text-2xl font-bold mb-4 ${
            selectedOption === 'new' ? 'text-white' : 'text-gray-800'
          }`}>
            🏗️ New Home
          </h3>
          
          <p className={`text-lg mb-6 ${
            selectedOption === 'new' ? 'text-green-100' : 'text-gray-600'
          }`}>
            Ideal for new construction projects where you can integrate rainwater 
            harvesting from the ground up.
          </p>

          <ul className={`space-y-2 text-sm ${
            selectedOption === 'new' ? 'text-green-100' : 'text-gray-500'
          }`}>
            <li>• Integrated system design</li>
            <li>• Home plan optimization</li>
            <li>• Maximum efficiency</li>
            <li>• Future-ready infrastructure</li>
          </ul>
        </div>
      </div>

      {/* Continue Button */}
      {selectedOption && (
        <div className="text-center">
          <button
            onClick={onContinue}
            className={`
              px-8 py-4 rounded-xl text-white font-semibold text-lg
              transition-all duration-300 hover:shadow-xl hover:-translate-y-1
              flex items-center space-x-2 mx-auto
              ${selectedOption === 'existing' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }
            `}
          >
            <span>Continue with {selectedOption === 'existing' ? 'Existing' : 'New'} Home</span>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;