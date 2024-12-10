import React from "react";

const GroupInfo = ({ windowSize, stepSize, umapParams, preprocessParams }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg space-y-4">
      {/* Row 1: Window Size and Step Size */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <strong className="text-sm text-gray-700">Window Size</strong>
          <p className="text-gray-800">{windowSize}</p>
        </div>
        <div className="flex flex-col">
          <strong className="text-sm text-gray-700">Step Size</strong>
          <p className="text-gray-800">{stepSize}</p>
        </div>
      </div>

      {/* Row 2: Preprocessing Parameters */}
      <div className="space-y-2">
        <strong className="block text-sm text-gray-700">
          Preprocessing Parameters
        </strong>
        <ul className="flex flex-wrap space-x-4">
          {Object.entries(preprocessParams).map(([key, value]) => (
            <li key={key} className="text-gray-800">
              {key}: {value ? "Yes" : "No"}
            </li>
          ))}
        </ul>
      </div>

      {/* Row 3: UMAP Parameters */}
      <div className="space-y-2">
        <strong className="block text-sm text-gray-700">UMAP Parameters</strong>
        <ul className="flex flex-wrap space-x-4">
          {Object.entries(umapParams).map(([key, value]) => (
            <li key={key} className="text-gray-800">
              {key}: {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GroupInfo;
