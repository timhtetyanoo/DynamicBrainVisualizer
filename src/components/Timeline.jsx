import { useContext, useState, useEffect, useRef } from "react";
import Labels from "./Labels";
import LabelsRight from "./LabelsRight";
import NodeActivity from "./NodeActivity";
import BipartiteContainer from "./BipartiteContainer";
import SmallMultiples from "./SmallMultiples";
import { DataContext } from "../contexts/DataContext";
import NodeActivitySettings from "./NodeActivitySettings";
import {
  TIMELINE_END_INDEX,
  TIMELINE_INITIAL_NUM_WINDOWS,
  TIMELINE_START_INDEX,
  WIDTH_THRESHOLD,
  WINDOW_SIZE_PIXELS,
} from "../helpers/constants";

import { saveAs } from "file-saver";

const Timeline = ({
  windows,
  selectedWindows,
  setSelectedWindows,
  selectedSubject,
  startWindow,
}) => {
  const { jsonData } = useContext(DataContext);
  const labels = jsonData.labels;

  const [selectedLabels, setSelectedLabels] = useState(
    new Array(labels.length).fill(true)
  );
  const [selectedLabelsOther, setSelectedLabelsOther] = useState(
    new Array(labels.length).fill(true)
  );

  const [containerWidth, setContainerWidth] = useState({
    nodeActivity: 0,
    timeline: 0,
  });

  const [windowStartIndex, setWindowStartIndex] =
    useState(TIMELINE_START_INDEX);
  const [windowEndIndex, setWindowEndIndex] = useState(
    TIMELINE_START_INDEX + TIMELINE_INITIAL_NUM_WINDOWS
  );
  const [degree, setDegree] = useState("out");

  const nodeActivityRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const nodeActivityElement = nodeActivityRef.current;
    const timelineElement = timelineRef.current;

    const updateWidths = () => {
      if (nodeActivityElement) {
        setContainerWidth((prev) => ({
          ...prev,
          nodeActivity: nodeActivityElement.offsetWidth,
        }));
      }
      if (timelineElement) {
        setContainerWidth((prev) => ({
          ...prev,
          timeline: timelineElement.offsetWidth,
        }));
      }
    };

    const resizeObserver = new ResizeObserver(updateWidths);

    if (nodeActivityElement) resizeObserver.observe(nodeActivityElement);
    if (timelineElement) resizeObserver.observe(timelineElement);
    updateWidths();

    return () => {
      if (nodeActivityElement) resizeObserver.unobserve(nodeActivityElement);
      if (timelineElement) resizeObserver.unobserve(timelineElement);
    };
  }, []);

  useEffect(() => {
    setWindowStartIndex(startWindow);
    setWindowEndIndex(startWindow + TIMELINE_INITIAL_NUM_WINDOWS);
  }, [startWindow]);

  const sliced_windows = windows.slice(windowStartIndex, windowEndIndex);
  const numWindows = sliced_windows.length;
  const windowWidth = containerWidth.timeline / numWindows;
  const mode = windowWidth < WIDTH_THRESHOLD ? "bipartite" : "window";

  useEffect(() => {
    setSelectedWindows(sliced_windows.map((d) => d.id));
  }, [containerWidth, windowStartIndex, windowEndIndex]);
  useEffect(() => {
    // setWindowStartIndex(TIMELINE_START_INDEX);
    // setWindowEndIndex(TIMELINE_START_INDEX + TIMELINE_INITIAL_NUM_WINDOWS);
    setSelectedWindows(sliced_windows.map((d) => d.id));
  }, [selectedSubject]);
  const timelineHeight = Math.max(labels.length * 18, 200);

  const nodeActivityHeight = 120;

  const nodeActivityLabelsMargin = {
    top: 0,
    right: 0,
    bottom: 20,
    left: 0,
  };
  const timelineLabelsMargin = {
    top: 0,
    right: 0,
    bottom: 50,
    left: 0,
  };

  const downloadNodeActivitySVG = async () => {
    const svg = nodeActivityRef.current.querySelector("svg");
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    saveAs(blob, "node-activity.svg");
  };

  return (
    <div className="flex-1 flex-col max-w-[100%]">
      <div>
        <NodeActivitySettings
          selectedNodeActivity={degree}
          setSelectedNodeActivity={setDegree}
          downloadSVG={downloadNodeActivitySVG}
        />
      </div>
      <div className="flex">
        <Labels
          labels={labels}
          selectedLabels={selectedLabels}
          setSelectedLabels={setSelectedLabels}
          height={nodeActivityHeight}
          margin={nodeActivityLabelsMargin}
        />
        <div className="flex w-full mr-1" ref={nodeActivityRef}>
          <NodeActivity
            labels={labels}
            selectedLabels={selectedLabels}
            setSelectedLabels={setSelectedLabels}
            windows={windows}
            windowStartIndex={windowStartIndex}
            setWindowStartIndex={setWindowStartIndex}
            windowEndIndex={windowEndIndex}
            setWindowEndIndex={setWindowEndIndex}
            height={nodeActivityHeight}
            width={containerWidth.nodeActivity}
            degree={degree}
          />
        </div>
      </div>
      <div className="flex pt-1" ref={timelineRef}>
        {mode === "bipartite" ? (
          <>
            <div>
              <Labels
                display={mode === "bipartite"}
                labels={labels}
                selectedLabels={
                  degree == "out" ? selectedLabels : selectedLabelsOther
                }
                setSelectedLabels={
                  degree == "out" ? setSelectedLabels : setSelectedLabelsOther
                }
                height={timelineHeight}
                margin={timelineLabelsMargin}
              />
            </div>
            <div className="flex w-full">
              <BipartiteContainer
                labels={labels}
                selectedLabels={
                  degree == "out" ? selectedLabels : selectedLabelsOther
                }
                selectedLabelsRight={
                  degree == "in" ? selectedLabels : selectedLabelsOther
                }
                windows={windows}
                startIndex={windowStartIndex}
                endIndex={windowEndIndex}
                height={timelineHeight}
                width={containerWidth.timeline - 100}
                selectedWindows={selectedWindows}
                setSelectedWindows={setSelectedWindows}
              />
            </div>

            <div>
              <LabelsRight
                display={mode === "bipartite"}
                labels={labels}
                selectedLabels={
                  degree == "in" ? selectedLabels : selectedLabelsOther
                }
                setSelectedLabels={
                  degree == "in" ? setSelectedLabels : setSelectedLabelsOther
                }
                height={timelineHeight}
                margin={timelineLabelsMargin}
              />
            </div>
          </>
        ) : (
          <div className="flex justify-center w-full">
            <SmallMultiples
              key="small-multiples"
              windows={windows}
              startIndex={windowStartIndex}
              endIndex={windowEndIndex}
              setSelectedWindows={setSelectedWindows}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
