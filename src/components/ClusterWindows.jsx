import { useState, useContext } from "react";
import { DataContext } from "../contexts/DataContext";
import { SettingsContext } from "../contexts/SettingsContext";

import Window from "./Window";
import {
  reconstructMatrix,
  getMinMaxValues,
  createColorScale,
  filterData,
} from "../helpers/util";
import {
  BUTTON_STYLE,
  SUBJECT_A_COLOR,
  SUBJECT_B_COLOR,
} from "../helpers/constants";

const ClusterWindows = ({
  clickedWindow,
  setClickedWindow,
  hoveredWindow,
  setHoveredWindow,
  setSubjectA,
  setSubjectB,
}) => {
  const { jsonData, colorScale, minValue, maxValue } = useContext(DataContext);
  const { settings, toggleComponent } = useContext(SettingsContext);

  const labels = jsonData.labels;

  const margin = { top: 30, right: 10, bottom: 10, left: 30 };

  const [visType, setVisType] = useState("heatmap");

  const changeVis = () => {
    setVisType(
      visType === "heatmap"
        ? "bipartite"
        : // : visType === "node-link"
        // ? "bipartite"
        visType === "bipartite"
        ? "adjacency-list"
        : "heatmap"
    );
  };

  const renderWindow = (w) => {
    // const { minValue, maxValue } = getMinMaxValues(w.value.flat());
    // const colorScale = createColorScale(minValue, maxValue);
    const data = filterData(w.value, 0, 1, minValue, maxValue);
    return (
      <>
        <Window
          index={w.window}
          data={data}
          labels={labels}
          colorScale={colorScale}
          visType={visType}
          margin={margin}
          width={250}
          height={250}
        />
        <p className="flex justify-center">Subject : {w.subject}</p>

        <div className="flex gap-2 items-center justify-center">
          <button
            className={BUTTON_STYLE}
            style={{ backgroundColor: SUBJECT_A_COLOR }}
            onClick={() => setSubjectA(w.subject)}
          >
            Select A
          </button>
          {settings["Show Subject B"] && (
            <button
              className={BUTTON_STYLE}
              style={{ backgroundColor: SUBJECT_B_COLOR }}
              onClick={() => setSubjectB(w.subject)}
            >
              Select B
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col space-x-6 border border-gray-500 w-[800px] h-[550px]">
      <div className="flex space-x-8 w-full justify-center pb-5">
        <div className="flex flex-col items-center">
          <p>Clicked Window</p>
          {clickedWindow != null && clickedWindow.value != null
            ? renderWindow(clickedWindow)
            : null}
        </div>
        <div className="flex flex-col items-center">
          <p>Hovered Window</p>

          {hoveredWindow != null && hoveredWindow.value != null
            ? renderWindow(hoveredWindow)
            : null}
        </div>
      </div>
      <div className="flex items-center justify-center gap-10">
        <button className={BUTTON_STYLE} onClick={() => changeVis()}>
          Change Layout
        </button>
        <button
          className={BUTTON_STYLE}
          onClick={() => {
            setClickedWindow(null);
            setHoveredWindow(null);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ClusterWindows;
