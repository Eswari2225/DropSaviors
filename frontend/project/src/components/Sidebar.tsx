import React, { useState } from 'react';
import { CloudRain, Wrench, Shield, Phone, ExternalLink, ArrowLeft, Mail, MapPin, Clock } from 'lucide-react';

interface SidebarProps {
  onNavigateBack?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigateBack }) => {
  const [currentView, setCurrentView] = useState<string | null>(null);

  const menuItems = [
    {
      id: 'rain-to-resource',
      title: 'Rain to Resource',
      description: 'Environmental benefits and sustainability',
      icon: CloudRain,
      color: 'blue'
    },
    {
      id: 'way-to-harvest',
      title: 'Way to Harvest Rain',
      description: 'Technical methods and systems',
      icon: Wrench,
      color: 'green'
    },
    {
      id: 'saving-water',
      title: 'Saving Water, Securing Future',
      description: 'Conservation tips and community impact',
      icon: Shield,
      color: 'blue'
    },
    {
      id: 'contact',
      title: 'Contact Us',
      description: 'Get in touch with our experts',
      icon: Phone,
      color: 'yellow'
    }
  ];

  const handleMenuClick = (id: string) => {
    setCurrentView(id);
  };

  const handleBackToMenu = () => {
    setCurrentView(null);
  };

  const renderArticleContent = () => {
    switch (currentView) {
      case 'rain-to-resource':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={handleBackToMenu}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <CloudRain className="text-blue-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Rain to Resource</h2>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-blue-600">The Importance of Rainwater Harvesting</h3>
              <p>
                Rainwater harvesting transforms every drop of rain into a valuable resource for your home and community. 
                This ancient practice has gained renewed importance in our modern world facing water scarcity challenges.
              </p>

              <h4 className="font-semibold text-gray-800">Environmental Benefits:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Reduces groundwater depletion and helps recharge aquifers</li>
                <li>Minimizes urban flooding by managing stormwater runoff</li>
                <li>Decreases soil erosion and prevents waterlogging</li>
                <li>Reduces dependency on municipal water supply systems</li>
                <li>Lowers carbon footprint by reducing water transportation needs</li>
              </ul>

              <h4 className="font-semibold text-gray-800">Sustainability Impact:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provides a renewable source of clean water</li>
                <li>Supports biodiversity by maintaining natural water cycles</li>
                <li>Creates resilient communities prepared for water shortages</li>
                <li>Promotes water conservation awareness and responsible usage</li>
                <li>Contributes to achieving UN Sustainable Development Goals</li>
              </ul>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">
                  💡 Did you know? A 1000 sq ft roof can collect approximately 600 gallons of water from just 1 inch of rainfall!
                </p>
              </div>
            </div>
          </div>
        );

      case 'way-to-harvest':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={handleBackToMenu}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Wrench className="text-green-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Way to Harvest Rain</h2>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-green-600">Technical Methods & Systems</h3>
              <p>
                Effective rainwater harvesting combines multiple techniques to capture, store, and utilize rainwater efficiently. 
                Here are the key methods and components:
              </p>

              <h4 className="font-semibold text-gray-800">Collection Systems:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Rooftop Collection:</strong> Gutters and downspouts channel water from roof surfaces</li>
                <li><strong>Surface Runoff:</strong> Capture water from driveways, patios, and other hard surfaces</li>
                <li><strong>First Flush Diverters:</strong> Remove initial contaminated water for cleaner collection</li>
              </ul>

              <h4 className="font-semibold text-gray-800">Storage Solutions:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Underground Tanks:</strong> Space-efficient, temperature-stable storage</li>
                <li><strong>Above-ground Tanks:</strong> Easy maintenance and installation</li>
                <li><strong>Modular Systems:</strong> Expandable storage for growing needs</li>
              </ul>

              <h4 className="font-semibold text-gray-800">Recharge Methods:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Recharge Pits:</strong> Direct groundwater replenishment</li>
                <li><strong>Recharge Trenches:</strong> Linear infiltration systems</li>
                <li><strong>Recharge Wells:</strong> Deep aquifer recharging</li>
                <li><strong>Percolation Tanks:</strong> Large-scale groundwater recharge</li>
              </ul>

              <h4 className="font-semibold text-gray-800">Filtration Systems:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Mesh Filters:</strong> Remove leaves and large debris</li>
                <li><strong>Sand Filters:</strong> Multi-stage filtration for cleaner water</li>
                <li><strong>Carbon Filters:</strong> Remove odors and chemical contaminants</li>
                <li><strong>UV Sterilization:</strong> Eliminate harmful microorganisms</li>
              </ul>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">
                  🔧 Pro Tip: Combine multiple methods for maximum efficiency - use tanks for immediate use and recharge systems for long-term groundwater benefits!
                </p>
              </div>
            </div>
          </div>
        );

      case 'saving-water':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={handleBackToMenu}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Shield className="text-blue-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Saving Water, Securing Future</h2>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-blue-600">Water Conservation & Community Impact</h3>
              <p>
                Water conservation through rainwater harvesting creates lasting benefits for individuals, communities, 
                and future generations. Every drop saved today secures tomorrow's water supply.
              </p>

              <h4 className="font-semibold text-gray-800">Conservation Tips:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Install low-flow fixtures and appliances to reduce water consumption</li>
                <li>Use harvested rainwater for irrigation, toilet flushing, and washing</li>
                <li>Implement drip irrigation systems for efficient garden watering</li>
                <li>Fix leaks promptly - a single drip can waste thousands of gallons annually</li>
                <li>Choose drought-resistant plants for landscaping</li>
                <li>Collect and reuse greywater from sinks and showers</li>
              </ul>

              <h4 className="font-semibold text-gray-800">Long-term Benefits:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Economic:</strong> Reduced water bills and increased property value</li>
                <li><strong>Environmental:</strong> Preserved ecosystems and reduced water stress</li>
                <li><strong>Social:</strong> Enhanced community resilience and water security</li>
                <li><strong>Health:</strong> Improved water quality and reduced waterborne diseases</li>
              </ul>

              <h4 className="font-semibold text-gray-800">Community Impact:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Reduces strain on municipal water infrastructure</li>
                <li>Creates local employment in installation and maintenance</li>
                <li>Builds community awareness about water conservation</li>
                <li>Establishes neighborhood resilience during droughts</li>
                <li>Promotes sustainable development practices</li>
              </ul>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">
                  🌍 Global Impact: If every household implemented rainwater harvesting, we could reduce global water stress by up to 30%!
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 rounded-lg text-white">
                <h5 className="font-semibold mb-2">Take Action Today:</h5>
                <p className="text-sm">
                  Start your water conservation journey with our rainwater harvesting advisor. 
                  Together, we can build a water-secure future for all.
                </p>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={handleBackToMenu}
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <Phone className="text-yellow-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Contact Us</h2>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 rounded-xl text-white">
                <h3 className="text-2xl font-bold mb-2">DropSaviors</h3>
                <p className="text-blue-100">Your Partner in Water Conservation</p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="text-blue-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-gray-600">support@dropsaviors.in</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Phone</p>
                    <p className="text-gray-600">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="text-red-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Location</p>
                    <p className="text-gray-600">Tottiyam, Tamil Nadu, India</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="text-purple-500" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Support Hours</p>
                    <p className="text-gray-600">Mon–Fri, 9:00 AM to 6:00 PM IST</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Get Expert Consultation</h4>
                <p className="text-yellow-700 text-sm">
                  Our team of water conservation experts is ready to help you design and implement 
                  the perfect rainwater harvesting solution for your home. Contact us for personalized 
                  guidance and professional installation services.
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={onNavigateBack}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white 
                           rounded-lg font-medium hover:from-blue-600 hover:to-green-600 
                           transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Back to Form
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (currentView) {
    return (
      <div className="h-full bg-white shadow-xl border-r border-gray-200 overflow-y-auto">
        {renderArticleContent()}
      </div>
    );
  }

  return (
    <div className="h-full bg-white shadow-xl border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Learn & Explore
        </h2>
        
        <div className="space-y-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const colorClasses = {
              blue: {
                gradient: 'from-blue-50 to-blue-100',
                border: 'border-blue-200 hover:border-blue-300',
                iconBg: 'bg-blue-500',
                iconText: 'text-white',
                titleText: 'text-blue-800',
                dotColor: 'bg-blue-500'
              },
              green: {
                gradient: 'from-green-50 to-green-100',
                border: 'border-green-200 hover:border-green-300',
                iconBg: 'bg-green-500',
                iconText: 'text-white',
                titleText: 'text-green-800',
                dotColor: 'bg-green-500'
              },
              yellow: {
                gradient: 'from-yellow-50 to-yellow-100',
                border: 'border-yellow-200 hover:border-yellow-300',
                iconBg: 'bg-yellow-500',
                iconText: 'text-white',
                titleText: 'text-yellow-800',
                dotColor: 'bg-yellow-500'
              }
            };
            
            const colors = colorClasses[item.color as keyof typeof colorClasses];
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full p-4 text-left rounded-xl transition-all duration-200
                  hover:shadow-md hover:-translate-y-1 group
                  bg-gradient-to-r ${colors.gradient}
                  border ${colors.border}
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    p-2 rounded-lg ${colors.iconBg} ${colors.iconText}
                    group-hover:scale-110 transition-transform
                  `}>
                    <IconComponent size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${colors.dotColor}`}></div>
                      <h3 className={`font-medium ${colors.titleText}`}>
                        {item.title}
                      </h3>
                      <ExternalLink 
                        size={14} 
                        className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white">
          <h3 className="font-semibold mb-2">Did You Know?</h3>
          <p className="text-sm opacity-90">
            Rainwater harvesting can reduce your water bill by up to 50% and help conserve groundwater.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;