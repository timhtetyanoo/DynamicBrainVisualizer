import React, { createContext, useState } from "react";

// Create the context
const SettingsContext = createContext();

// Create the provider component
const SettingsProvider = ({ children }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    "Preprocessing Parameters": true,
    "Dimensionality Reduction Parameters": true,
    "Feature Selection": true,
    "Clustered Distribution across Subjects": true,
    "Clustered Distribution across Demographics": true,
    "Number of Bins for Histogram": false,
    "Show Subject B": true,
  });

  // Function to toggle a component on/off
  const toggleComponent = (componentName) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [componentName]: !prevSettings[componentName],
    }));
    console.log(
      `Turning ${settings[componentName] ? "off" : "on"} ${componentName}.`
    );
  };

  return (
    <SettingsContext.Provider
      value={{ settings, toggleComponent, showSettings, setShowSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Export the context to use in other components
export { SettingsProvider, SettingsContext };
