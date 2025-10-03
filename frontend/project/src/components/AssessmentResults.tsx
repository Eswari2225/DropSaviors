import React, { useState } from "react";

interface AssessmentResultsProps {
  results: any;
  onBack: () => void;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({ results, onBack }) => {
  const [customSystem, setCustomSystem] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string>("");
  const [systemDesign, setSystemDesign] = useState({
    systemType: "Storage Tank",
    shape: "Cuboid (L × W × H)",
    material: "Plastic",
    dimensions: {
      length: 2.5,
      width: 2.0,
      depth: 2.0
    },
    lined: true
  });

  if (!results) return null;

  const handleDownloadPDF = async () => {
    try {
      console.log('Starting PDF download...');
      
      // Store current results in localStorage as backup for PDF generation
      if (results) {
        localStorage.setItem('assessment_results', JSON.stringify(results));
        console.log('Stored results in localStorage');
      }

      const requestData = {
        username: results?.username || 'User'
      };
      
      console.log('Sending request with data:', requestData);

      const response = await fetch("/api/download_pdf", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: 'include' // Include cookies for session management
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      
      if (data.success && data.pdf_data) {
        console.log('PDF data received, size:', data.pdf_data.length);
        
        // Create blob from base64 data
        try {
          const byteCharacters = atob(data.pdf_data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          
          console.log('Blob created, size:', blob.size);
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = data.filename || 'rainwater_report.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('Download completed successfully');
          alert('✅ Detailed PDF report downloaded successfully!');
          
        } catch (blobError) {
          console.error('Error creating blob:', blobError);
          throw new Error('Failed to process PDF data');
        }
      } else {
        console.error('Invalid response data:', data);
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert(`Error downloading PDF report: ${error.message}\n\nPlease try again or check the console for details.`);
    }
  };

  const handleCustomSystemCalculation = async () => {
    try {
      const response = await fetch("/api/calculate_system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          harvested_liters: results.harvested_liters,
          system_type: systemDesign.systemType,
          shape: systemDesign.shape.includes("Cuboid") ? "rectangular" : "circular",
          material: systemDesign.material.toLowerCase(),
          lined: systemDesign.lined,
          dimensions: systemDesign.shape.includes("Cuboid") ? {
            length: systemDesign.dimensions.length,
            width: systemDesign.dimensions.width,
            depth: systemDesign.dimensions.depth
          } : {
            diameter: systemDesign.dimensions.length,
            depth: systemDesign.dimensions.depth
          }
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCustomSystem(data);
        setShowComparison(true);
      } else {
        alert('Error calculating custom system: ' + data.error);
      }
    } catch (error) {
      console.error('Error calculating custom system:', error);
      alert('Error calculating custom system');
    }
  };

  const saveUserChoice = async (choice: string) => {
    try {
      await fetch("/api/user_choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice })
      });
      setSelectedChoice(choice);
    } catch (error) {
      console.error('Error saving choice:', error);
    }
  };

  const handleSimplePDFDownload = () => {
    try {
      const username = results?.username || 'User';
      const url = `http://127.0.0.1:5000/api/simple_pdf_download?username=${encodeURIComponent(username)}`;
      
      // Open in new window to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `rainwater_report_${username}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Simple PDF download initiated');
    } catch (error) {
      console.error('Simple download error:', error);
      alert('Error with simple download. Please try again.');
    }
  };

  const renderStructureVisualization = (svgContent: string) => {
    if (!svgContent) return null;
    return (
      <div className="bg-white rounded-lg p-4 border">
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-xl p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            🌧️ Assessment Results
          </h1>
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            📄 Download PDF Report
          </button>
        </div>

        {/* User Info Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">👤 User:</span>
              <span className="font-medium">{results.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">📍 District:</span>
              <span className="font-medium">{results.district}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🏢 Station:</span>
              <span className="font-medium">{results.subdistrict}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🏠 Roof Type:</span>
              <span className="font-medium">{results.roof_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">📐 Roof Area:</span>
              <span className="font-medium">{results.roof_area} m²</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🌲 Open Space:</span>
              <span className="font-medium">{results.has_open_space !== false ? `${results.open_area || 139.3545} m²` : 'Not Available'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">💧 Runoff Coeff:</span>
              <span className="font-medium">{results.runoff_coeff}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Principal Aquifer Information */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
          🌍 Principal Aquifer Information
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Type:</span> Alluvial
            </div>
            <div>
              <span className="font-semibold">Description:</span> Based on regional geological patterns - alluvial formations are common in most Indian districts
            </div>
            <div>
              <span className="font-semibold">Recharge Potential:</span>
              <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Moderate to High
              </span>
            </div>
            <div>
              <span className="font-semibold">Recommended Recharge Structures:</span>
              <ul className="mt-2 space-y-1">
                <li>• Percolation pits</li>
                <li>• Recharge trenches</li>
                <li>• Storage tanks</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Suitability:</span> Good for standard recharge structures
            </div>
            <div>
              <span className="font-semibold">Porosity:</span> 15-30% (estimated)
            </div>
            <div>
              <span className="font-semibold">Permeability:</span> Moderate
            </div>
          </div>
        </div>
      </div>

      {/* Open Space Feasibility Check */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          📐 Open Space Feasibility Check
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Recommended Structure:</span> Pit
            </div>
            <div>
              <span className="font-semibold">Required Footprint:</span> 2.25 m²
            </div>
            <div>
              <span className="font-semibold">Available Space:</span> {results.has_open_space !== false ? `${results.open_area || 139.3545} m²` : '0 m²'}
            </div>
            <div>
              <span className="font-semibold">Feasibility:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                results.feasibility === 'NO' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {results.feasibility === 'NO' ? 'No' : 'Yes'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Recommendation:</span> {results.feasibility === 'NO' ? 'Storage Tank (no recharge space)' : 'Standard Pit (fits available space)'}
            </div>
            <div>
              <span className="font-semibold">Recharge Volume:</span> {results.feasibility === 'NO' ? 'N/A (Storage Only)' : '1800 L'}
            </div>
          </div>
        </div>
      </div>

      {/* Predicted Annual Rainfall */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          📊 Predicted Annual Rainfall (2025–2036)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="border px-4 py-2 text-left font-semibold">Year</th>
                <th className="border px-4 py-2 text-left font-semibold">Rain (mm)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results.rainfall_series || {}).map(([year, rain]) => (
                <tr key={year} className={year === results.max_year?.toString() ? "bg-green-50" : ""}>
                  <td className="border px-4 py-2">
                    {year}
                    {year === results.max_year?.toString() && (
                      <span className="ml-2 bg-green-500 text-white px-2 py-1 text-xs rounded">Max</span>
                    )}
                  </td>
                  <td className="border px-4 py-2">{Number(rain).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Water Potential Analysis */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
          💧 Water Potential Analysis
        </h2>
        <div className="space-y-4">
          <div>
            <span className="text-lg">Max predicted rainfall: <strong>{results.max_rain_mm} mm</strong> in {results.max_year}</span>
          </div>
          <div>
            <span className="text-lg">Harvestable water: <strong>{results.harvested_liters} liters</strong></span>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Groundwater Status:</h3>
            <div className="space-y-2">
              <div>Dominant depth category: 45048 - (46.2% of stations)</div>
              <div>Estimated recharge fraction: <strong>84.0%</strong></div>
              <div>Estimated recharge to groundwater: <strong>419.22 liters/year</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended System */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold text-purple-600 mb-4 flex items-center gap-2">
          ⚙️ Recommended System
        </h2>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">{results.recommendation?.type || 'Percolation Pit'}</h3>
          
          {results.feasibility === 'NO' && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="text-orange-800">
                <strong>⚠️ Note:</strong> {results.recommendation?.message || 'Not suitable for recharge due to no open space, but you can store and reuse water.'}
              </div>
            </div>
          )}

          <div>
            <span className="font-semibold">Recommended recharge capacity:</span> {results.feasibility === 'NO' ? 'N/A' : '399 liters'}
          </div>

          {/* 3D Visualization for Recommended System */}
          {results.recommendation?.structure_svg && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">🏗️ 3D Structure Visualization</h4>
              {renderStructureVisualization(results.recommendation.structure_svg)}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Suggested Configuration:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">1 ×</span>
                <span>{results.feasibility === 'NO' ? 'Storage Tank (2m³)' : 'Small Pit (2m³)'}</span>
              </div>
              <div>
                <span className="font-semibold">Volume:</span> 2000 L each
              </div>
              <div>
                <span className="font-semibold">Dimensions:</span> {results.feasibility === 'NO' ? 
                  results.recommendation?.dimensions ? 
                    `${results.recommendation.dimensions.length}m × ${results.recommendation.dimensions.width}m × ${results.recommendation.dimensions.depth}m`
                    : '2.0m × 1.5m × 1.5m'
                  : '1.13m diameter × 2.0m height'
                }
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <h4 className="bg-orange-100 px-4 py-3 font-semibold flex items-center gap-2">
              💰 Cost Breakdown
            </h4>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Component</th>
                  <th className="px-4 py-2 text-left">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2">Excavation Total</td>
                  <td className="px-4 py-2">₹800</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Lining Total</td>
                  <td className="px-4 py-2">₹10000</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Media Total</td>
                  <td className="px-4 py-2">₹2500</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2">Labour Total</td>
                  <td className="px-4 py-2">₹3500</td>
                </tr>
                <tr className="border-t bg-blue-50">
                  <td className="px-4 py-2 font-bold">Total</td>
                  <td className="px-4 py-2 font-bold">₹{results.recommendation?.breakdown?.summary?.total || 16800}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom System Design */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
          🔧 Custom System Design
        </h2>
        <p className="text-gray-700 mb-6">
          If the recommended system doesn't meet your needs, design a custom alternative:
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Option Type</label>
            <select
              value={systemDesign.systemType}
              onChange={(e) => setSystemDesign({...systemDesign, systemType: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Storage Tank">Storage Tank</option>
              <option value="Recharge Pit">Recharge Pit</option>
              <option value="Recharge Trench">Recharge Trench</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shape</label>
            <select
              value={systemDesign.shape}
              onChange={(e) => setSystemDesign({...systemDesign, shape: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cuboid (L × W × H)">Cuboid (L × W × H)</option>
              <option value="Cylindrical (D × H)">Cylindrical (D × H)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
            <select
              value={systemDesign.material}
              onChange={(e) => setSystemDesign({...systemDesign, material: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Plastic">Plastic</option>
              <option value="RCC">RCC</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Enter dimensions in meters:</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {systemDesign.shape.includes("Cuboid") ? "Length" : "Diameter"}
              </label>
              <input
                type="number"
                step="0.1"
                value={systemDesign.dimensions.length}
                onChange={(e) => setSystemDesign({
                  ...systemDesign,
                  dimensions: {...systemDesign.dimensions, length: parseFloat(e.target.value) || 0}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {systemDesign.shape.includes("Cuboid") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                <input
                  type="number"
                  step="0.1"
                  value={systemDesign.dimensions.width}
                  onChange={(e) => setSystemDesign({
                    ...systemDesign,
                    dimensions: {...systemDesign.dimensions, width: parseFloat(e.target.value) || 0}
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Depth/Height</label>
              <input
                type="number"
                step="0.1"
                value={systemDesign.dimensions.depth}
                onChange={(e) => setSystemDesign({
                  ...systemDesign,
                  dimensions: {...systemDesign.dimensions, depth: parseFloat(e.target.value) || 0}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {systemDesign.systemType !== "Storage Tank" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Lining</label>
            <select
              value={systemDesign.lined ? "Lined (PCC)" : "Unlined"}
              onChange={(e) => setSystemDesign({...systemDesign, lined: e.target.value === "Lined (PCC)"})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Lined (PCC)">Lined (PCC)</option>
              <option value="Unlined">Unlined</option>
            </select>
          </div>
        )}

        <button
          onClick={handleCustomSystemCalculation}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Compare & Calculate Cost
        </button>
      </div>

      {/* Comparison Results */}
      {showComparison && customSystem && (
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📊 Comparison Results
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Cost Comparison</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Recommended System:</span> ₹{results.recommendation?.breakdown?.summary?.total || 16800}
                </div>
                <div>
                  <span className="font-semibold">Your Custom Design:</span> ₹{customSystem.cost_breakdown?.summary?.total}
                </div>
                <div className={`font-semibold ${
                  (customSystem.cost_breakdown?.summary?.total || 0) > (results.recommendation?.breakdown?.summary?.total || 16800)
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  Difference: ₹{Math.abs((customSystem.cost_breakdown?.summary?.total || 0) - (results.recommendation?.breakdown?.summary?.total || 16800))} 
                  {(customSystem.cost_breakdown?.summary?.total || 0) > (results.recommendation?.breakdown?.summary?.total || 16800)
                    ? ' (Additional Cost)' : ' (Savings)'}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Custom Design Details</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Type:</span> {systemDesign.systemType}</div>
                  <div><span className="font-medium">Shape:</span> {systemDesign.shape.includes("Cuboid") ? "Rectangular" : "Cylindrical"}</div>
                  <div><span className="font-medium">Units Needed:</span> 1</div>
                  <div><span className="font-medium">Volume per Unit:</span> {customSystem.required_capacity_l?.toLocaleString()} L</div>
                </div>

                <div className="mt-3">
                  <h5 className="font-semibold mb-2">Cost Breakdown</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(customSystem.cost_breakdown?.summary || {}).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> ₹{Number(value).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Structure Visualization</h3>
              {customSystem.structure_svg ? (
                renderStructureVisualization(customSystem.structure_svg)
              ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">📐</div>
                  <p className="text-gray-600">Visual representation of your custom design</p>
                </div>
              )}
            </div>
          </div>

          {/* Choice Selection */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Select Your Preferred Option:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedChoice === 'recommended' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => saveUserChoice('recommended')}
              >
                <h4 className="font-semibold text-green-700">Recommended System</h4>
                <p className="text-sm text-gray-600 mt-1">{results.recommendation?.type}</p>
                <p className="font-semibold text-lg text-green-600 mt-2">₹{results.recommendation?.breakdown?.summary?.total || 16800}</p>
              </div>
              
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedChoice === 'custom' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => saveUserChoice('custom')}
              >
                <h4 className="font-semibold text-blue-700">Custom Design</h4>
                <p className="text-sm text-gray-600 mt-1">{systemDesign.systemType}</p>
                <p className="font-semibold text-lg text-blue-600 mt-2">₹{customSystem.cost_breakdown?.summary?.total?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          📄 Download Detailed PDF Report
        </button>
        <button
          onClick={handleSimplePDFDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          title="Alternative download method if main download fails"
        >
          📋 Quick PDF Download
        </button>
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          🏠 New Assessment
        </button>
      </div>
    </div>
  );
};

export default AssessmentResults;
