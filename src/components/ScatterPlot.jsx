import { useRef, useEffect, useContext, useState } from "react";
import { DataContext } from "../contexts/DataContext";
import { select, scaleOrdinal, schemeSet1, zoom, zoomIdentity } from "d3";
import {
  SUBJECT_A_COLOR,
  SUBJECT_B_COLOR,
  SUBJECT_HOVER_COLOR,
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
} from "../helpers/constants";
import ToolTip from "./ToolTip";
import DensityPlot from "./DensityPlot";

const ScatterPlot = ({
  data,
  width,
  height,
  demographics,
  selectedDemographics,
  selectedDemographicCategory,
  setSelectedDemographicCategory,
  hoveredWindow,
  setHoveredWindow,
  clickedWindow,
  setClickedWindow,
  selectedWindowsA,
  selectedWindowsB,
  lassoPath1,
  lassoPath2,
  zoomTransform,
  onZoomChange,
}) => {
  const { jsonData } = useContext(DataContext);

  const demographicsCategories = jsonData.demographicsCategories;
  const demographicsType = jsonData.demographicsType;
  const colorCategories =
    selectedDemographics == "group"
      ? ["patient", "control"]
      : demographicsCategories[selectedDemographics];
  const colorScale = scaleOrdinal(schemeSet1).domain(colorCategories);

  const svgRef = useRef();
  const zoomBehaviorRef = useRef();
  const zoomTransformRef = useRef(zoomIdentity);

  const [hover, setHover] = useState({ visible: false, x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const [showSelectedWindowsA, setShowSelectedWindowsA] = useState(false);
  const [showSelectedWindowsB, setShowSelectedWindowsB] = useState(false);

  const setColor = (d) => {
    const demographicValue = demographics[d.subject][selectedDemographics];
    if (demographicsType[selectedDemographics] === "numerical") {
      for (let category of colorCategories) {
        const [min, max] = category.split(" - ").map(Number);
        if (demographicValue == null) return "grey";
        if (demographicValue >= min && demographicValue < max) {
          return colorScale(category);
        }
      }
    } else {
      return colorScale(demographicValue);
    }
    return "black"; // Default color if no match found
  };

  const applyWindowStyles = (circles, selectedWindows, showWindows, color) => {
    if (showWindows) {
      circles
        .filter((d) => selectedWindows.includes(d.id))
        .raise()
        .attr("r", 7)
        .attr("opacity", 1)
        .attr("fill", color);
    }
  };

  useEffect(() => {
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black")
      .on("click", () => setContextMenu({ visible: false }))
      .on("contextmenu", handleRightClick);

    let circlesGroup = svg.select("g");
    if (circlesGroup.empty()) {
      circlesGroup = svg.append("g");
    }

    // Bind the data and update the circles
    const circlesSelection = circlesGroup
      .selectAll("circle")
      .data(data, (d) => d.id);

    // Apply the update pattern
    circlesSelection
      .enter()
      .append("circle")
      .attr("class", (d) => `sub_${d.subject}`)
      .merge(circlesSelection) // Ensure updates apply to existing circles
      .attr("r", 5)
      .attr("cx", (d) => zoomTransformRef.current.applyX(d.cx)) // Use pre-calculated cx from the data
      .attr("cy", (d) => zoomTransformRef.current.applyX(d.cy)) // Use pre-calculated cy from the data
      .attr("fill", (d) => setColor(d))
      .attr("opacity", (d) => 0.2)
      .attr("cursor", "pointer")
      .on("mouseover", (event, d) => handleCircleEnter(event, d, circlesGroup))
      .on("mouseout", (event, d) => handleCircleLeave(event, d, circlesGroup))
      .on("click", (event, d) => handleCircleClick(event, d));

    applyWindowStyles(
      circlesSelection,
      selectedWindowsA,
      showSelectedWindowsA,
      SUBJECT_A_COLOR
    );

    applyWindowStyles(
      circlesSelection,
      selectedWindowsB,
      showSelectedWindowsB,
      SUBJECT_B_COLOR
    );

    // Remove old circles
    circlesSelection.exit().remove();

    if (lassoPath1.length > 1) {
      svg
        .selectAll("polygon.lasso1")
        .data([lassoPath1])
        .join("polygon")
        .attr("class", "lasso1")
        .attr("points", (d) => d.map((p) => p.join(",")).join(" "))
        .attr("fill", CLUSTER1_COLOR)
        .attr("opacity", 0.5)
        .style("pointer-events", "none"); // Allow mouse events to pass through
    } else {
      svg.selectAll("polygon.lasso1").remove();
    }
    if (lassoPath2.length > 1) {
      svg
        .selectAll("polygon.lasso2")
        .data([lassoPath2])
        .join("polygon")
        .attr("class", "lasso2")
        .attr("points", (d) => d.map((p) => p.join(",")).join(" "))
        .attr("fill", CLUSTER2_COLOR)
        .attr("opacity", 0.5)
        .style("pointer-events", "none"); // Allow mouse events to pass through
    } else {
      svg.selectAll("polygon.lasso2").remove();
    }

    // Add Color Legend to the top-right corner
    let legendGroup = svg.select(".legend");
    if (legendGroup.empty()) {
      legendGroup = svg.append("g").attr("class", "legend");
    }

    // Clear old legend items
    legendGroup.selectAll("*").remove();

    legendGroup
      .append("g")
      .attr("transform", `translate(${10}, 15)`)
      .append("text")
      .text(selectedDemographics.toUpperCase())
      .attr("font-weight", "bold")
      .attr("cursor", "pointer")
      .on("click", () => {
        if (selectedDemographicCategory === "All")
          setSelectedDemographicCategory("None");
        else {
          setSelectedDemographicCategory("All");
        }
      })
      .on("mouseover", function () {
        select(this).attr("font-size", "18px");
      })
      .on("mouseout", function () {
        select(this).attr("font-size", "16px");
      });

    const nullLegendRow = legendGroup
      .append("g")
      .attr("transform", `translate(${10}, 20)`);
    nullLegendRow
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "grey");
    nullLegendRow
      .append("text")
      .attr("x", 15)
      .attr("y", 5)
      .text("Null")
      .attr("font-size", "12px")
      .attr("alignment-baseline", "middle");

    nullLegendRow
      .attr("cursor", "pointer")
      .on("click", () => setSelectedDemographicCategory(null))
      .on("mouseover", function () {
        select(this).select("text").attr("font-size", "16px");
      })
      .on("mouseout", function () {
        select(this).select("text").attr("font-size", "12px");
      });

    colorCategories.forEach((category, i) => {
      const legendRow = legendGroup
        .append("g")
        .attr("transform", `translate(${10}, ${20 + (i + 1) * 15})`);

      legendRow
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale(category));

      legendRow
        .append("text")
        .attr("x", 15)
        .attr("y", 5)
        .text(category)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");

      legendRow
        .attr("cursor", "pointer")
        .on("click", () => setSelectedDemographicCategory(category))
        .on("mouseover", function () {
          select(this).select("text").attr("font-size", "16px");
        })
        .on("mouseout", function () {
          select(this).select("text").attr("font-size", "12px");
        });
    });

    // Zoom behavior
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 20]) // Zoom limits
      .on("zoom", (event) => {
        const transform = event.transform;
        zoomTransformRef.current = transform;

        // Sync zoom with the parent component
        onZoomChange(transform);

        circlesGroup
          .selectAll("circle")
          .attr("cx", (d) => transform.applyX(d.cx))
          .attr("cy", (d) => transform.applyY(d.cy));

        svg
          .selectAll("polygon")
          .attr("points", (d) =>
            d
              .map((p) =>
                [transform.applyX(p[0]), transform.applyY(p[1])].join(",")
              )
              .join(" ")
          );
        svg
          .selectAll("polygon.lasso2")
          .attr("points", (d) =>
            d
              .map((p) =>
                [transform.applyX(p[0]), transform.applyY(p[1])].join(",")
              )
              .join(" ")
          );
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // If zoomTransform is provided by the parent, apply it to the scatterplot
    if (zoomTransform) {
      svg.call(zoomBehavior.transform, zoomTransform);
    }
  }, [
    width,
    height,
    selectedWindowsA,
    selectedWindowsB,
    showSelectedWindowsA,
    showSelectedWindowsB,
    selectedDemographics,
    selectedDemographicCategory,
  ]);

  const handleCircleEnter = (event, d, circlesGroup) => {
    setHover({ visible: true, x: event.pageX, y: event.pageY });
    setHoveredWindow(d);
    circlesGroup
      .selectAll(`.sub_${d.subject}`)
      .attr("fill", SUBJECT_HOVER_COLOR)
      .attr("opacity", 1);
  };
  const handleCircleLeave = (event, d, circlesGroup) => {
    setHover({ ...hover, visible: false });
    const circles = circlesGroup
      .selectAll(`.sub_${d.subject}`)
      .attr("fill", setColor(d))
      .attr("opacity", 0.2);
    applyWindowStyles(
      circles,
      selectedWindowsA,
      showSelectedWindowsA,
      SUBJECT_A_COLOR
    );
    applyWindowStyles(
      circles,
      selectedWindowsB,
      showSelectedWindowsB,
      SUBJECT_B_COLOR
    );
  };
  const handleCircleClick = (event, d) => {
    event.stopPropagation();
    setClickedWindow(d);
  };
  const handleRightClick = (event) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.pageX, y: event.pageY });
  };
  const handleResetZoom = () => {
    const svg = select(svgRef.current);
    svg.call(zoomBehaviorRef.current.transform, zoomIdentity);
    svg
      .selectAll("circle")
      .attr("cx", (d) => zoomIdentity.applyX(d.cx))
      .attr("cy", (d) => zoomIdentity.applyY(d.cy));
  };
  return (
    <div className="flex">
      <svg ref={svgRef}></svg>
      {hover.visible && (
        <ToolTip
          x={hover.x}
          y={hover.y}
          content={
            <>
              <p>Group: {demographics[hoveredWindow.subject].group}</p>
              <p>Subject: {hoveredWindow.subject}</p>
              <p>Window: {hoveredWindow.window}</p>
            </>
          }
        />
      )}
      {contextMenu.visible && (
        <ToolTip
          x={contextMenu.x}
          y={contextMenu.y}
          content={
            <div className="flex flex-col border border-gray-300 shadow-lg rounded-md bg-white w-40">
              <button
                className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
                onClick={() => {
                  setShowSelectedWindowsA(!showSelectedWindowsA);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                {!showSelectedWindowsA
                  ? "Hightlight Subject A"
                  : "Unhighlight Subject A"}
              </button>
              <button
                className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
                onClick={() => {
                  setShowSelectedWindowsB(!showSelectedWindowsB);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                {!showSelectedWindowsB
                  ? "Hightlight Subject B"
                  : "Unhighlight Subject B"}
              </button>
              <button
                className="px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  handleResetZoom();
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                Reset Zoom
              </button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default ScatterPlot;
