import React, { useRef, useEffect, useState, useContext } from "react";
import { select, scaleLinear, extent, zoom, zoomIdentity } from "d3";

import { DataContext } from "../contexts/DataContext";
import ScatterPlot from "./ScatterPlot";

import ClusterPlot from "./ClusterPlot";
const DRPlot = ({
  size,
  data,
  demographics,
  selectedDemographics,
  setSubjectA,
  setSubjectB,
  setWindowA,
  setWindowB,
  selectedWindowsA,
  selectedWindowsB,
  selectedGroup1,
  setSelectedGroup1,
  selectedGroup2,
  setSelectedGroup2,
  hoveredWindow,
  setHoveredWindow,
  clickedWindow,
  setClickedWindow,
  state,
  clustering,
}) => {
  const { jsonData } = useContext(DataContext);
  const demographicsType = jsonData.demographicsType;
  const [selectedDemographicCategory, setSelectedDemographicCategory] =
    useState("All");

  const [DRPlotSize, setDRPlotSize] = useState(0);

  const [zoomTransform, setZoomTransform] = useState(null); // State for storing the zoom transform

  const [lassoPath1, setLassoPath1] = useState([]);
  const [lassoPath2, setLassoPath2] = useState([]);
  const handleZoomChange = (newTransform) => {
    setZoomTransform(newTransform); // Update the zoom state in parent
  };

  const DRContainerRef = useRef();
  const width = DRPlotSize;
  const height = DRPlotSize;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const newWidth = Math.min(
          entries[0].contentRect.width,
          entries[0].contentRect.height
        );
        setDRPlotSize(newWidth); // Update size when the container's width changes
      }
    });

    // Observe the parent container for size changes
    if (DRContainerRef.current) {
      resizeObserver.observe(DRContainerRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (DRContainerRef.current) {
        resizeObserver.unobserve(DRContainerRef.current);
      }
    };
  }, []);
  useEffect(() => {
    setSelectedDemographicCategory("All");
  }, [selectedDemographics]);
  if (!data || data.length == 0) return;
  const xExtent = extent(data, (d) => d.value[0]);
  const yExtent = extent(data, (d) => d.value[1]);
  const x = scaleLinear()
    .domain(xExtent)
    .range([0 + margin.left, width - margin.right]);
  const y = scaleLinear()
    .domain(yExtent)
    .range([height - margin.bottom, 0 + margin.top]);

  const updatedCircles = data.map((circle) => {
    const cx = x(circle.value[0]);
    const cy = y(circle.value[1]);

    return {
      ...circle,
      cx,
      cy,
    };
  });

  const circles = updatedCircles.filter((d) => {
    if (selectedDemographicCategory === "All") return true;

    if (demographicsType[selectedDemographics] === "numerical") {
      if (selectedDemographicCategory === null) {
        return demographics[d.subject][selectedDemographics] !== null;
      }
      const [min, max] = selectedDemographicCategory.split(" - ").map(Number);
      if (
        demographics[d.subject][selectedDemographics] >= min &&
        demographics[d.subject][selectedDemographics] < max
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return (
        demographics[d.subject][selectedDemographics] ===
        selectedDemographicCategory
      );
    }
  });

  return (
    <div ref={DRContainerRef} className="flex w-full h-full">
      {clustering ? (
        <ClusterPlot
          data={circles}
          width={DRPlotSize}
          height={DRPlotSize}
          demographics={demographics}
          selectedDemographics={selectedDemographics}
          selectedDemographicCategory={selectedDemographicCategory}
          setSelectedDemographicCategory={setSelectedDemographicCategory}
          hoveredWindow={hoveredWindow}
          setHoveredWindow={setHoveredWindow}
          clickedWindow={clickedWindow}
          setClickedWindow={setClickedWindow}
          selectedWindowsA={selectedWindowsA}
          selectedWindowsB={selectedWindowsB}
          selectedGroup1={selectedGroup1}
          setSelectedGroup1={setSelectedGroup1}
          selectedGroup2={selectedGroup2}
          setSelectedGroup2={setSelectedGroup2}
          state={state}
          lassoPath1={lassoPath1}
          setLassoPath1={setLassoPath1}
          lassoPath2={lassoPath2}
          setLassoPath2={setLassoPath2}
          zoomTransform={zoomTransform}
          onZoomChange={handleZoomChange}
        />
      ) : (
        <ScatterPlot
          data={circles}
          width={DRPlotSize}
          height={DRPlotSize}
          demographics={demographics}
          selectedDemographics={selectedDemographics}
          selectedDemographicCategory={selectedDemographicCategory}
          setSelectedDemographicCategory={setSelectedDemographicCategory}
          hoveredWindow={hoveredWindow}
          setHoveredWindow={setHoveredWindow}
          clickedWindow={clickedWindow}
          setClickedWindow={setClickedWindow}
          selectedWindowsA={selectedWindowsA}
          selectedWindowsB={selectedWindowsB}
          lassoPath1={lassoPath1}
          lassoPath2={lassoPath2}
          zoomTransform={zoomTransform}
          onZoomChange={handleZoomChange}
        />
      )}
    </div>
  );
};

export default DRPlot;
