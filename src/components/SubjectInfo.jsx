import { useState, useContext, useEffect } from "react";

import { DataContext } from "../contexts/DataContext";
import { SubjectViewContext } from "../pages/SubjectView";
import RangeSlider from "./RangeSlider";

const SubjectInfo = ({ selectedSubject, setSelectedSubject }) => {
  const { jsonData, patientIDs, controlIDs, minValue, maxValue } =
    useContext(DataContext);
  const { id, threshold, setThreshold } = useContext(SubjectViewContext);

  const demographic = jsonData.demographicsData[selectedSubject];
  const [group, setGroup] = useState(demographic.group);

  useEffect(() => {
    setGroup(demographic.group);
  }, [selectedSubject]);
  const subjectIDs = patientIDs.concat(controlIDs);
  const numSubjects = subjectIDs.length;

  const sliderWidth = 200;

  const renderOptions = () => {
    const options = [];
    for (let i = 0; i < numSubjects; i++) {
      const value = subjectIDs[i];
      options.push(
        <option key={i} value={value}>
          {value}
        </option>
      );
    }
    return options;
  };
  const renderDemographics = () => {
    return Object.keys(demographic).map((item) => {
      return (
        <div key={item} className="flex flex-col text-[9px] w-16">
          <p className="ml-1">
            <strong>{item}: </strong>
            {demographic[item] ? demographic[item] : "N/A"}
          </p>
        </div>
      );
    });
  };

  const handleSubjectChange = (event) => {
    const value = event.target.value;
    setSelectedSubject(value);
  };

  const labelStyle = id === "A" ? "bg-yellow-500" : "bg-teal-500";

  return (
    <div className="flex flex-col w-16 items-center gap-20 bg-gray-600 text-white text-xs">
      <div className="m-2">
        <div className={`p-1 ${labelStyle}`}>
          <label htmlFor="number-select"> Subject:{id}</label>
        </div>
        <select
          id="number-select"
          value={selectedSubject}
          onChange={handleSubjectChange}
          className=" bg-gray-800 text-white rounded border border-gray-600 focus:ring-2 focus:ring-gray-400"
        >
          {renderOptions()}
        </select>
      </div>
      <div>
        <p className="mb-2 ml-1 font-bold text-[8px]">Demographics</p>
        <div className="max-h-[50px] w-16 overflow-auto">
          {renderDemographics()}
        </div>
      </div>
      <div>
        <RangeSlider
          width={sliderWidth}
          stepSize={5}
          minValue={minValue}
          maxValue={maxValue}
          threshold={threshold}
          setThreshold={setThreshold}
        />
      </div>
    </div>
  );
};

export default SubjectInfo;
