import React, { useState } from "react";
import { UserData } from "./types";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import NewHomeForm from "./components/NewHomeForm";
import ExistingHomeForm from "./components/ExistingHomeForm";
import AssessmentResults from "./components/AssessmentResults";

type AppState = "dashboard" | "new-home-form" | "existing-home-form" | "results";

function App() {
  const [currentState, setCurrentState] = useState<AppState>("dashboard");
  const [selectedOption, setSelectedOption] = useState<"new" | "existing" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    name: "",
    aadhaarNumber: "",
    address: "",
    location: undefined,
    district: "",
    subdivision: "",
    homeType: "existing",
    roofTypes: [],
    roofAreas: {}
  });

  const [results, setResults] = useState<any>(null);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const handleOptionSelect = (option: "new" | "existing") => {
    setSelectedOption(option);
    updateUserData({ homeType: option });
  };

  const handleContinueFromDashboard = () => {
    if (selectedOption === "new") {
      setCurrentState("new-home-form");
    } else if (selectedOption === "existing") {
      setCurrentState("existing-home-form");
    }
  };

  // Enhanced form submission with proper data handling
  const handleFormSubmit = async () => {
    try {
      let payload;

      if (userData.homeType === "new") {
        // For new homes, use detected areas from CAD
        payload = {
          username: userData.name,
          district: userData.district || (userData.location && userData.location.district) || "",
          subdistrict: userData.subdivision || (userData.location && userData.location.subdivision) || "",
          roof_type: "concrete", // Default for new construction
          roof_area: userData.roofArea || 100, // From CAD detection
          has_open_space: userData.hasOpenSpace,
          open_area: userData.openSpaceArea || 0
        };
      } else {
        // For existing homes, use form data
        const firstRoofType = userData.roofTypes && userData.roofTypes.length > 0 ? userData.roofTypes[0] : "concrete";
        
        payload = {
          username: userData.name,
          district: userData.district || (userData.location && userData.location.district) || "",
          subdistrict: userData.subdivision || (userData.location && userData.location.subdivision) || "",
          roof_type: firstRoofType,
          roof_area: firstRoofType ? userData.roofAreas?.[firstRoofType] || 0 : 0,
          has_open_space: userData.hasOpenSpace,
          open_area: userData.openSpaceArea || 0
        };
      }

      console.log("Submitting payload:", payload);

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data.results);
        setCurrentState("results");
      } else {
        alert(data.error || "Prediction failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }
  };

  const handleNavigateBack = () => {
    setCurrentState("dashboard");
    setSelectedOption(null);
    setResults(null);
  };

  const renderCurrentView = () => {
    switch (currentState) {
      case "dashboard":
        return <Dashboard selectedOption={selectedOption} onSelectOption={handleOptionSelect} onContinue={handleContinueFromDashboard} />;

      case "new-home-form":
        return <NewHomeForm userData={userData} onUpdateUserData={updateUserData} onSubmit={handleFormSubmit} />;

      case "existing-home-form":
        return <ExistingHomeForm userData={userData} onUpdateUserData={updateUserData} onSubmit={handleFormSubmit} />;

      case "results":
        return <AssessmentResults results={results} onBack={handleNavigateBack} />;

      default:
        return null;
    }
  };

  return (
    <Layout showSidebar={currentState !== "results"} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} onNavigateBack={handleNavigateBack}>
      {renderCurrentView()}
    </Layout>
  );
}

export default App;
