import { useRef, useEffect, useContext, useState } from "react";
import { DataContext } from "../contexts/DataContext";
import { select, scaleOrdinal, schemeSet1, zoom, zoomIdentity } from "d3";
import {
  SUBJECT_A_COLOR,
  SUBJECT_B_COLOR,
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
} from "../helpers/constants";
import ToolTip from "./ToolTip";
import DensityPlot from "./DensityPlot";

const ClusterPlot = ({
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
  selectedGroup1,
  setSelectedGroup1,
  selectedGroup2,
  setSelectedGroup2,
  state,
  lassoPath1,
  setLassoPath1,
  lassoPath2,
  setLassoPath2,
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

  const [showDensityPlot, setShowDensityPlot] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const [showSelectedWindowsA, setShowSelectedWindowsA] = useState(false);
  const [showSelectedWindowsB, setShowSelectedWindowsB] = useState(false);

  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoPath, setLassoPath] = useState([]);

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
      .attr("opacity", (d) => 0.2);

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

    if (showDensityPlot) {
      circlesSelection.attr("fill", "none");
    }
    // Remove old circles
    circlesSelection.exit().remove();

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

        // Apply zoom to lasso polygons
        svg
          .selectAll("polygon.lasso")
          .attr("points", (d) => d.map((p) => transform.apply(p)).join(" "));

        svg
          .selectAll("polygon.lasso1")
          .attr("points", (d) => d.map((p) => transform.apply(p)).join(" "));

        svg
          .selectAll("polygon.lasso2")
          .attr("points", (d) => d.map((p) => transform.apply(p)).join(" "));
      });

    zoomBehaviorRef.current = zoomBehavior;

    svg
      .on("mousedown", (event) => {
        if (event.target.tagName !== "text") {
          startLasso(event);
        }
      })
      .on("mousemove", (event) => {
        if (event.target.tagName !== "text") {
          updateLasso(event);
        }
      })
      .on("mouseup", (event) => {
        if (event.target.tagName !== "text") {
          endLasso(event);
        }
      })
      .attr("cursor", "crosshair");

    if (lassoPath.length > 1) {
      svg
        .selectAll("polygon.lasso")
        .data([lassoPath])
        .join("polygon")
        .attr("class", "lasso")
        .attr("points", (d) => d.map((p) => p.join(",")).join(" "))
        .attr("fill", state == 1 ? CLUSTER1_COLOR : CLUSTER2_COLOR)
        .attr("opacity", 0.5);
    } else {
      svg.selectAll("polygon.lasso").remove();
    }
    if (!isLassoing) {
      if (lassoPath1.length > 1) {
        svg
          .selectAll("polygon.lasso1")
          .data([lassoPath1])
          .join("polygon")
          .attr("class", "lasso1")
          .attr("points", (d) => d.map((p) => p.join(",")).join(" "))
          .attr("fill", CLUSTER1_COLOR)
          .attr("opacity", 0.5);
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
          .attr("opacity", 0.5);
      } else {
        svg.selectAll("polygon.lasso2").remove();
      }
    }

    // If zoomTransform is provided by the parent, apply it to the scatterplot
    if (zoomTransform) {
      svg.call(zoomBehavior.transform, zoomTransform);
    }

    // console.log("SelectedGroup1 ", selectedGroup1.length);
    // console.log("SelectedGroup2 ", selectedGroup2.length);
    return () => {
      svg.on("mousedown", null);
      svg.on("mousemove", null);
      svg.on("mouseup", null);
    };
  }, [
    width,
    height,
    selectedWindowsA,
    selectedWindowsB,
    showSelectedWindowsA,
    showSelectedWindowsB,
    selectedDemographics,
    selectedDemographicCategory,
    showDensityPlot,
    lassoPath,
    state,
  ]);

  const startLasso = (e) => {
    e.preventDefault();
    setIsLassoing(true);
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zoomTransform = zoomTransformRef.current;
    const [transformedX, transformedY] = zoomTransform.invert([x, y]);
    setLassoPath([[transformedX, transformedY]]);
  };

  const updateLasso = (e) => {
    if (!isLassoing) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zoomTransform = zoomTransformRef.current;
    const [transformedX, transformedY] = zoomTransform.invert([x, y]);
    setLassoPath((prevPath) => [...prevPath, [transformedX, transformedY]]);
  };

  const endLasso = () => {
    // if (!selecting) return;
    if (!isLassoing) return;
    setIsLassoing(false);
    const path = lassoPath;
    if (path.length < 2) return;

    const isInsideLasso = (cx, cy) => {
      let inside = false;
      for (let i = 0, j = lassoPath.length - 1; i < lassoPath.length; j = i++) {
        const xi = lassoPath[i][0],
          yi = lassoPath[i][1];
        const xj = lassoPath[j][0],
          yj = lassoPath[j][1];
        const intersect =
          yi > cy !== yj > cy && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const circlesInsideLasso = data
      .filter((circle) => isInsideLasso(circle.cx, circle.cy))
      .map((d) => ({
        id: d.id,
        subject: d.subject,
        window: d.window,
      }));

    if (state == 1) {
      setSelectedGroup1(circlesInsideLasso);
      if (circlesInsideLasso.length > 0) setLassoPath1(lassoPath);
      else setLassoPath1([]);
    } else if (state == 2) {
      setSelectedGroup2(circlesInsideLasso);
      if (circlesInsideLasso.length > 0) setLassoPath2(lassoPath);
      else setLassoPath2([]);
    }
    setLassoPath([]);
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
      <svg ref={svgRef}>
        <g>
          {showDensityPlot && (
            <DensityPlot
              data={data.map((d) => [d.cx, d.cy])}
              width={width}
              height={height}
              zoomTransform={zoomTransform}
              onZoomChange={onZoomChange}
            />
          )}
        </g>
      </svg>

      {contextMenu.visible && (
        <ToolTip
          x={contextMenu.x}
          y={contextMenu.y}
          content={
            <div className="flex flex-col border border-gray-300 shadow-lg rounded-md bg-white w-40">
              <button
                className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
                onClick={() => {
                  setShowDensityPlot(!showDensityPlot);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                {showDensityPlot ? "Hide Density Plot" : "Show DensityPlot"}
              </button>
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

export default ClusterPlot;
