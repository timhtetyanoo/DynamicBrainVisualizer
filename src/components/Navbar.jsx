import { useState, useContext } from "react";
import { DataContext } from "../contexts/DataContext";
import { SettingsContext } from "../contexts/SettingsContext";
import validateJson from "../helpers/validateJson";
import { toast } from "react-toastify"; // Assuming you are using react-toastify for notifications
import { BUTTON_STYLE } from "../helpers/constants";

const Navbar = () => {
  const {
    jsonData,
    windowSize,
    setWindowSize,
    stepSize,
    setStepSize,
    stepSizes,
    binarize,
    setBinarize,
    binarizeThreshold,
    setBinarizeThreshold,
    updateJsonData,
    loading,
  } = useContext(DataContext);

  const { showSettings, setShowSettings } = useContext(SettingsContext);

  const windowSizes = jsonData ? Object.keys(jsonData.windowSizes) : [];

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Assuming validateJson is a function that returns a Promise
          validateJson(data)
            .then((isValid) => {
              if (isValid) {
                updateJsonData(data);
                toast.success("Data submitted successfully!");
              } else {
                toast.error("Validation failed");
              }
            })
            .catch((err) => {
              toast.error(err.message);
            });
        } catch (error) {
          console.error(error);
          toast.error("Invalid JSON format");
        }
      };
      reader.readAsText(file);
    }
    setSelectedFile(event.target.files[0]);
    event.target.value = null;
  };

  const handleWindowSizeChange = (event) => {
    setWindowSize(event.target.value);
  };

  const handleStepSizeChange = (event) => {
    setStepSize(event.target.value);
  };

  const renderParameters = () => {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="windowSize-select">Window Size:</label>
          <select
            id="windowSize-select"
            value={windowSize}
            onChange={handleWindowSizeChange}
            className="px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 focus:ring-2 focus:ring-gray-400"
          >
            {windowSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="stepSize-select">Step Size:</label>
          <select
            id="stepSize-select"
            value={stepSize}
            onChange={handleStepSizeChange}
            className="px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 focus:ring-2 focus:ring-gray-400"
          >
            {stepSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2 ">
          <label>Binarize:</label>
          <button
            onClick={() => setBinarize(!binarize)}
            className={`px-2 py-1 rounded-md ${
              binarize ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {binarize ? "Yes" : "No"}
          </button>
        </div>
        {binarize && (
          <div className="flex items-center space-x-2">
            <label>Threshold:</label>
            <select
              value={binarizeThreshold}
              onChange={(e) => setBinarizeThreshold(e.target.value)}
              className="px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 focus:ring-2 focus:ring-gray-400"
            >
              {Array.from({ length: 9 }, (_, index) => (
                <option key={index} value={(index + 1) / 10}>
                  {(index + 1) / 10}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  if (!jsonData || loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="flex justify-between items-center top-0 left-0 w-full h-8 bg-gray-800 text-white px-4 text-xs">
      <div className="flex items-center space-x-4">
        {/* File Upload Section */}
        <label htmlFor="file-upload" className={BUTTON_STYLE}>
          Upload JSON
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
      {/* Parameters Section */}
      {renderParameters()}

      {/* Display Metric */}
      <div className="flex items-center space-x-2">
        <div>
          <p>
            Current Metric: <strong>{jsonData.metric}</strong>
          </p>
          <p>
            Directed: <strong>{jsonData.directed ? "Yes" : "No"}</strong>
          </p>
        </div>
        <div>
          <p>
            Number of Patients: <strong>{jsonData.numPatients}</strong>
          </p>
          <p>
            Number of Controls: <strong>{jsonData.numControls}</strong>
          </p>
        </div>
        <div>
          <p>
            TR: <strong>{jsonData.TR}</strong>
          </p>
          <p>
            Time Series Length: <strong>{jsonData.timeSeriesLength}</strong>
          </p>
        </div>
        <div>
          Time per Window: <strong>{jsonData.TR * windowSize} secs</strong>
        </div>
      </div>
      {/* Settings Button */}
      <div>
        <button
          className={BUTTON_STYLE}
          onClick={() => setShowSettings(!showSettings)}
        >
          Settings
        </button>
      </div>
    </div>
  );
};

export default Navbar;
