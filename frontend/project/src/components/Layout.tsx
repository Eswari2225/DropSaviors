import React from 'react';
import { Droplets, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onNavigateBack?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showSidebar = true, 
  onToggleSidebar, 
  sidebarOpen = false,
  onNavigateBack
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-blue-100">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            {showSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            <div className="flex items-center space-x-2">
              <Droplets className="text-blue-600" size={32} />
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                  Rainwater Harvesting Advisor
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Sustainable Water Solutions for Your Home
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div 
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onToggleSidebar}
              />
            )}
            
            {/* Sidebar */}
            <div className={`
              fixed lg:static inset-y-0 left-0 z-50 
              transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
              lg:transform-none transition-transform duration-300 ease-in-out
              w-80 lg:w-80
            `}>
              <Sidebar onNavigateBack={onNavigateBack} />
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;