import { useContext, useMemo } from "react";
import Bipartite from "./Bipartite";

import { SubjectViewContext } from "../pages/SubjectView";

const BipartiteContainer = ({
  labels,
  selectedLabels,
  selectedLabelsRight,
  windows,
  startIndex,
  endIndex,
  height,
  width,
}) => {
  const windowHeight = height;
  const windowWidth = width / (endIndex - startIndex);
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };

  const { colorScale } = useContext(SubjectViewContext);
  const renderedWindows = useMemo(() => {
    return windows.map((window, index) => {
      return (
        <div
          key={index}
          className="flex flex-col w-fit"
          style={{ width: windowWidth }} // Ensure each window gets the correct width
        >
          <Bipartite
            margin={margin}
            data={window.value}
            labels={labels}
            showLabel={false}
            selectedLabels={selectedLabels}
            selectedLabelsRight={selectedLabelsRight}
            colorScale={colorScale}
            height={windowHeight}
            width={windowWidth}
          />
          <div className="flex flex-col justify-center items-center text-xs">
            <p>|</p>
            <button data-value={index}>{index}</button>
          </div>
        </div>
      );
    });
  }, [
    windows,
    labels,
    selectedLabels,
    selectedLabelsRight,
    colorScale,
    windowWidth,
    windowHeight,
  ]);
  const visibleWindows = renderedWindows.slice(startIndex, endIndex);

  return <>{visibleWindows}</>;
};

export default BipartiteContainer;
