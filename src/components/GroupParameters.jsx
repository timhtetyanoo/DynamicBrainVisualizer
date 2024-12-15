import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";
import FeatureSelection from "./FeatureSelection";

import { BUTTON_STYLE } from "../helpers/constants";
import { reconstructMatrix, processDRData } from "../helpers/util";

import { scaleOrdinal, schemeSet1 } from "d3";

import RangeSlider from "./RangeSlider";

const Tooltip = ({ text }) => {
  return (
    <div className="relative group inline-block">
      <span className="cursor-pointer text-xs">ℹ️</span>
      <div className="absolute left-0 hidden group-hover:block bg-gray-700 text-white text-xs rounded-md p-2 z-10">
        {text}
      </div>
    </div>
  );
};

const GroupParameters = ({
  umapParams,
  setUmapParams,
  preprocessParams,
  setPreprocessParams,
  features,
  setFeatures,
  subjectsData,
  selectedDemographics,
  setSelectedDemographics,
  selectedSubjects,
  setSelectedSubjects,
  fetchData,
  loading,
  threshold,
  setThreshold,
}) => {
  const possibleNNeighbors = [5, 10, 15, 20, 25, 30, 40, 50, 100, 200];
  const possibleMinDist = [0.1, 0.2, 0.3, 0.4, 0.5];
  const possibleMetric = ["euclidean", "manhattan", "cosine"];

  const { jsonData, patientIDs, controlIDs } = useContext(DataContext);
  const labels = jsonData.labels;
  const directed = jsonData.directed;
  const demographicsColumns = jsonData.demographicsColumns;
  const colorScale = scaleOrdinal(schemeSet1).domain(["patient", "control"]);

  const subjectIDs = [...new Set(subjectsData.map((item) => item.subject))];

  const patientsData = subjectsData
    .filter((item) => patientIDs.includes(item.subject))
    .map((item) => {
      return item.value;
    });
  const controlsData = subjectsData
    .filter((item) => controlIDs.includes(item.subject))
    .map((item) => {
      return item.value;
    });
  const averagePatientsData = patientsData[0].map(
    (_, colIndex) =>
      patientsData.reduce((acc, row) => acc + row[colIndex], 0) /
      patientsData.length
  );
  const averageControlsData = controlsData[0].map(
    (_, colIndex) =>
      controlsData.reduce((acc, row) => acc + row[colIndex], 0) /
      controlsData.length
  );
  let absoluteDifference = averagePatientsData.map((value, index) =>
    Math.abs(value - averageControlsData[index])
  );
  absoluteDifference = reconstructMatrix(
    absoluteDifference,
    directed,
    labels.length
  );

  const handleUmapChange = (key, value) => {
    setUmapParams((prev) => ({
      ...prev,
      [key]: key === "n_neighbors" ? parseInt(value, 10) : parseFloat(value),
      [key]: key === "min_dist" ? parseFloat(value) : value,
      [key]: value,
    }));
  };

  const handleFeatureChange = (key) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFeatureChangeIncoming = (_, label) => {
    setFeatures((prev) => {
      const updatedPairs = { ...prev };
      const allFalse = labels
        .filter((l2) => l2 !== label)
        .every((l2) => !updatedPairs[`${l2}_${label}`]);
      Object.keys(updatedPairs).forEach((key) => {
        if (key.endsWith(`${label}`)) {
          updatedPairs[key] = allFalse;
        }
      });
      return updatedPairs;
    });
  };

  const handleFeatureChangeOutgoing = (_, label) => {
    setFeatures((prev) => {
      const updatedPairs = { ...prev };
      const allFalse = labels
        .filter((l2) => l2 !== label)
        .every((l2) => !updatedPairs[`${label}_${l2}`]);
      Object.keys(updatedPairs).forEach((key) => {
        if (key.startsWith(`${label}`)) {
          updatedPairs[key] = allFalse;
        }
      });
      return updatedPairs;
    });
  };

  const selectAllFeatures = () => {
    setFeatures((prev) => {
      const updatedPairs = { ...prev };
      Object.keys(updatedPairs).forEach((key) => {
        updatedPairs[key] = true;
      });
      return updatedPairs;
    });
  };
  const deselectAllFeatures = () => {
    setFeatures((prev) => {
      const updatedPairs = { ...prev };
      Object.keys(updatedPairs).forEach((key) => {
        updatedPairs[key] = false;
      });
      return updatedPairs;
    });
  };
  return (
    <div className="p-2 bg-white space-y-1 w-64">
      <div>
        {/* <div className="grid grid-cols-1 sm:grid-cols-3 text-xs">
          <div className="flex flex-col items-start space-x-2 ">
            <label className="text-gray-600 flex-shrink-0">
              <Tooltip text="Enter a random seed value. 0 means randomized." />{" "}
              Seed:
            </label>
            <input
              type="number"
              min="0"
              value={preprocessParams.seed}
              onChange={(e) =>
                setPreprocessParams((prev) => ({
                  ...prev,
                  seed: parseInt(e.target.value, 10),
                }))
              }
              className="px-2 py-2 rounded-md border border-gray-300 w-16"
            />
          </div>
          <div className="flex flex-col items-start space-x-2 ">
            <label className="text-gray-600 flex-shrink-0">
              <Tooltip text="Normalize the input data" />
              Scaler:
            </label>
            <button
              onClick={() =>
                setPreprocessParams((prev) => ({
                  ...prev,
                  scale: !prev.scale,
                }))
              }
              className={`px-2 py-2 rounded-md ${
                preprocessParams.scale
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {preprocessParams.scale ? "Yes" : "No"}
            </button>
          </div>
          <div className="flex flex-col items-start space-x-2 ">
            <label className="text-gray-600 flex-shrink-0">
              <Tooltip text="Normalize the input data" />
              Normalizer:
            </label>
            <button
              onClick={() =>
                setPreprocessParams((prev) => ({
                  ...prev,
                  normalize: !prev.normalize,
                }))
              }
              className={`px-2 py-2 rounded-md ${
                preprocessParams.normalize
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {preprocessParams.normalize ? "Yes" : "No"}
            </button>
          </div>
        </div> */}
      </div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0.5">
          {[
            {
              label: "n_neighbors",
              value: umapParams.n_neighbors,
              options: possibleNNeighbors,
              tooltip: "Number of neighboring points to consider.",
            },
            {
              label: "min_dist",
              value: umapParams.min_dist,
              options: possibleMinDist,
              tooltip:
                "Minimum distance between points in the UMAP projection.",
            },
            {
              label: "metric",
              value: umapParams.metric,
              options: possibleMetric,
              tooltip: "Distance metric used in UMAP.",
            },
          ].map(({ label, value, options, tooltip }) => (
            <div key={label} className="space-y-1">
              <label
                className="block text-gray-700"
                style={{ fontSize: "9px" }}
              >
                <Tooltip text={tooltip} /> {label}
              </label>
              <select
                value={value}
                onChange={(e) => handleUmapChange(label, e.target.value)}
                className="b</div>lock w-full p-1 border-gray-300 rounded-md text-xs focus:outline-none focus:ring-gray-400 focus:border-gray-500"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Selection */}
      <div className="flex">
        <FeatureSelection
          features={features}
          labels={labels}
          handleFeatureChange={handleFeatureChange}
          handleFeatureChangeIncoming={handleFeatureChangeIncoming}
          handleFeatureChangeOutgoing={handleFeatureChangeOutgoing}
          selectAllFeatures={selectAllFeatures}
          deselectAllFeatures={deselectAllFeatures}
          data={absoluteDifference}
        />
        {/* <RangeSlider
          sliderWidth={200}
          threshold={threshold}
          setThreshold={setThreshold}
        /> */}
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <label className="text-xs text-gray-600">Subjects:</label>
          <button
            className="bg-gray-500 text-white text-xs rounded py-1 px-1"
            onClick={() => setSelectedSubjects(subjectIDs)}
          >
            Select All
          </button>
        </div>
        <select
          multiple
          value={selectedSubjects}
          onChange={(e) => {
            const selectedOptions = Array.from(
              e.target.selectedOptions,
              (option) => option.value
            );
            setSelectedSubjects(selectedOptions);
          }}
          className="px-2 py-2 rounded-md border border-gray-300 text-xs"
        >
          {subjectIDs.map((subject) => (
            <option
              key={subject}
              value={subject}
              style={{
                color: colorScale(
                  patientIDs.includes(subject) ? "patient" : "control"
                ),
              }}
            >
              {subject}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-center pt-1">
        <button
          onClick={
            !loading
              ? fetchData
              : () => {
                  console.log("Loading...");
                }
          }
          className={BUTTON_STYLE}
        >
          Compute
        </button>
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-600">Demographics:</label>
          <select
            value={selectedDemographics}
            onChange={(e) => setSelectedDemographics(e.target.value)}
            className="px-2 py-2 rounded-md border w-24 border-gray-300 text-xs overflow-hidden truncate whitespace-nowrap"
          >
            {demographicsColumns.map((category) => (
              <option
                key={category}
                value={category}
                className="truncate"
                title={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default GroupParameters;
