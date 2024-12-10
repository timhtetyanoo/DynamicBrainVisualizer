import { useState, useContext, useEffect } from "react";
import ConnectivityState from "./ConnectivityState";
import RangeSlider from "./RangeSlider";
import Window from "./Window";
import { BUTTON_STYLE } from "../helpers/constants";
import { DataContext } from "../contexts/DataContext";
import { SettingsContext } from "../contexts/SettingsContext";
import {
  createColorScale,
  getMinMaxValues,
  reconstructMatrix,
} from "../helpers/util";
const GroupStates = ({
  group1,
  group2,
  state,
  setState,
  nrWindows,
  setSubjectA,
  setSubjectB,
}) => {
  const { subjects, jsonData, minValue, maxValue } = useContext(DataContext);
  const { settings, toggleComponent } = useContext(SettingsContext);

  const margin = { top: 30, right: 10, bottom: 5, left: 35 };

  const directed = jsonData.directed;
  const labels = jsonData.labels;

  const [method, setMethod] = useState("Average");

  const [visType, setVisType] = useState("heatmap");

  const [isRelativeColor, setIsRelativeColor] = useState(false);

  const [showDifference, setShowDifference] = useState(false);

  const [threshold, setThreshold] = useState([0, maxValue]);

  const [state1Data, setState1Data] = useState([]);
  const [state2Data, setState2Data] = useState([]);
  const changeVis = () => {
    setVisType(
      visType === "heatmap"
        ? "bipartite"
        : visType === "bipartite"
        ? "adjacency-list"
        : visType === "adjacency-list"
        ? "node-link"
        : "heatmap"
    );
  };
  const changeMethod = () => {
    setMethod((prev) => {
      if (prev == "Average") return "Median";
      else if (prev == "Median") return "Maximum";
      else if (prev == "Maximum") return "Minimum";
      else return "Average";
    });
  };

  const changeColorScale = () => {
    setIsRelativeColor(!isRelativeColor);
    if (isRelativeColor) setThreshold([0, maxValue]);
    else setThreshold([0, 100]);
  };

  const differenceData =
    state1Data && state2Data && state1Data.length === state2Data.length
      ? state1Data.map((value, index) =>
          value ? Math.abs(state2Data[index] - value) : null
        )
      : [];
  const hasNegativeNumbers = differenceData.some((value) => value < 0);
  if (hasNegativeNumbers) {
    console.log("There are negative numbers in differenceData");
  }

  const minmaxVal = getMinMaxValues(differenceData);
  const colorScale = createColorScale(minmaxVal.minValue, minmaxVal.maxValue);

  return (
    <div className="flex space-x-6 w-[800px] h-[550px]">
      <div className="flex flex-col justify-center items-center">
        <div className="flex space-x-2 w-full">
          <div className="flex w-full">
            <ConnectivityState
              id={1}
              group={group1}
              method={method}
              visType={visType}
              isRelativeColor={isRelativeColor}
              threshold={threshold}
              state={state}
              setState={setState}
              nrWindows={nrWindows}
              setSubject={setSubjectA}
              showDifference={showDifference}
              setStateData={setState1Data}
            />
          </div>
          <div className="flex w-full">
            <ConnectivityState
              id={2}
              group={group2}
              method={method}
              visType={visType}
              isRelativeColor={isRelativeColor}
              threshold={threshold}
              state={state}
              setState={setState}
              nrWindows={nrWindows}
              setSubject={
                settings["Show Subject B"] ? setSubjectB : setSubjectA
              }
              showDifference={showDifference}
              setStateData={setState2Data}
            />
          </div>
        </div>
        {showDifference && (
          <Window
            index={"Difference"}
            data={differenceData}
            labels={labels}
            colorScale={colorScale}
            visType={visType}
            margin={margin}
            width={250}
            height={250}
          />
        )}
      </div>
      <div className="flex items-center">
        <div className="flex flex-col space-y-4">
          <button className={`${BUTTON_STYLE}`} onClick={changeMethod}>
            {method}
          </button>
          <RangeSlider
            sliderWidth={100}
            stepSize={10}
            minValue={0}
            maxValue={isRelativeColor ? 100 : maxValue}
            threshold={threshold}
            setThreshold={setThreshold}
            isRelativeColor={isRelativeColor}
          />
          <button className={BUTTON_STYLE} onClick={changeVis}>
            Change Layout
          </button>
          <button className={BUTTON_STYLE} onClick={changeColorScale}>
            Change Color Scale
          </button>
          <button
            className={BUTTON_STYLE}
            onClick={() => setShowDifference(!showDifference)}
          >
            Show Difference
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupStates;
