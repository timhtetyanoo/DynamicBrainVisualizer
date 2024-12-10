import { useContext, useState, createContext, useEffect } from "react";
import { DataContext } from "../contexts/DataContext";
import SubjectInfo from "../components/SubjectInfo";
import SmallMultiples from "../components/SmallMultiples";
import Timeline from "../components/Timeline";

import {
  getMinMaxValues,
  createColorScale,
  filterData,
  reconstructMatrix,
} from "../helpers/util";
import { MAX_THRESHOLD, MIN_THRESHOLD } from "../helpers/constants";
import { select } from "d3";

export const SubjectViewContext = createContext();

const SubjectView = ({
  id,
  selectedSubject,
  setSelectedSubject,
  startWindow,
  selectedWindows,
  setSelectedWindows,
  data,
}) => {
  const { jsonData, windowSize, stepSize, minValue, maxValue, colorScale } =
    useContext(DataContext);
  const directed = jsonData.directed;
  const labels = jsonData.labels;
  // Interaction states
  const [threshold, setThreshold] = useState([minValue, maxValue]);
  // const windowValues = data.map((item) => item.value);
  // const { minValue, maxValue } = getMinMaxValues(windowValues.flat());
  // const colorScale = createColorScale(minValue, maxValue);

  // Assigning windows for timeline

  const windows = data.map((window) => {
    const reconstructedMatrix = reconstructMatrix(
      window.value,
      directed,
      labels.length
    );
    const filteredValue = filterData(
      reconstructedMatrix,
      minValue,
      maxValue,
      threshold[0],
      threshold[1]
    );

    return {
      ...window,
      value: filteredValue, // Create a new window object with the updated value
    };
  });
  return (
    <SubjectViewContext.Provider
      value={{
        id,
        selectedSubject,
        threshold,
        setThreshold,
        colorScale,
      }}
    >
      <div className="flex w-full h-full border ">
        <Timeline
          key={windowSize + stepSize}
          windows={windows}
          selectedWindows={selectedWindows}
          setSelectedWindows={setSelectedWindows}
          selectedSubject={selectedSubject}
          startWindow={startWindow}
        />
        <SubjectInfo
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      </div>
    </SubjectViewContext.Provider>
  );
};

export default SubjectView;
