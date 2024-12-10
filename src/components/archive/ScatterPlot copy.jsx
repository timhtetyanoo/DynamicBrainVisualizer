import React, { useRef, useEffect, useState } from "react";
import { select, scaleLinear, extent, zoom, zoomIdentity } from "d3";
import ToolTip from "../ToolTip";
import {
  GROUP1_DEFAULT_COLOR,
  GROUP1_UNSELECTED_COLOR,
  GROUP1_SELECTED_COLOR,
  GROUP1_OVERLAP_COLOR,
  GROUP2_DEFAULT_COLOR,
  GROUP2_UNSELECTED_COLOR,
  GROUP2_SELECTED_COLOR,
  GROUP2_OVERLAP_COLOR,
  SELECTED_COLOR,
  SUBJECT_A_COLOR,
  SUBJECT_B_COLOR,
  BUTTON_STYLE,
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
} from "../../helpers/constants";
const TestPlot = ({
  size,
  data,
  demographics,
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
  setClickedWindow,
  setHoveredWindow,
  state,
}) => {
  const [circles, setCircles] = useState([]);
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoPath, setLassoPath] = useState([]);
  const [includePatients, setIncludePatients] = useState(true);
  const [includeControls, setIncludeControls] = useState(true);
  const [showSelectedWindowsA, setShowSelectedWindowsA] = useState(false);
  const [showSelectedWindowsB, setShowSelectedWindowsB] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });
  const [tooltip2, setTooltip2] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });
  const svgRef = useRef();

  const width = size,
    height = size;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  const zoomBehaviorRef = useRef(null); // Store zoom behavior in a ref
  const zoomTransformRef = useRef(zoomIdentity); // Store the current zoom transform

  // Update circles when data changes
  useEffect(() => {
    if (data && data.length !== 0) {
      const xExtent = extent(data, (d) => d.value[0]);
      const yExtent = extent(data, (d) => d.value[1]);
      const x = scaleLinear()
        .domain(xExtent)
        .range([0 + margin.left, width - margin.right]);
      const y = scaleLinear()
        .domain(yExtent)
        .range([height - margin.bottom, 0 + margin.top]);
      data = data.filter((d) => {
        return (
          (includePatients && demographics[d.subject].group === "patient") ||
          (includeControls && demographics[d.subject].group === "control")
        );
      });
      const updatedCircles = data.map((circle) => {
        const cx = x(circle.value[0]);
        const cy = y(circle.value[1]);

        let selected = { 1: false, 2: false };
        if (selectedGroup1.find((d) => d.id === circle.id)) {
          selected[1] = true;
        }
        if (selectedGroup2.find((d) => d.id === circle.id)) {
          selected[2] = true;
        }
        return {
          ...circle,
          cx,
          cy,
          selected,
        };
      });
      setCircles(updatedCircles);
    }
  }, [data, width, height, state, includePatients, includeControls]);

  /// Update SVG elements
  useEffect(() => {
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black")
      .on("click", (event, d) => {
        setTooltip2({ ...tooltip2, visible: false });
      })
      .on("contextmenu", handleRightClick);

    let g = svg.select("g");
    if (g.empty()) {
      g = svg.append("g");
      // .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    // Handle circles
    const circlesSelection = g.selectAll("circle").data(circles, (d) => d.id);

    circlesSelection
      .enter()
      .append("circle")
      .attr("class", (d) => demographics[d.subject].group)
      .merge(circlesSelection)
      .attr("r", 5)
      .attr("cx", (d) => zoomTransformRef.current.applyX(d.cx))
      .attr("cy", (d) => zoomTransformRef.current.applyY(d.cy))
      .attr("fill", (d) => {
        if (demographics[d.subject].group === "patient") {
          if (d.selected[state] && d.selected[3 - state])
            return GROUP1_OVERLAP_COLOR;
          else if (d.selected[state]) return GROUP1_SELECTED_COLOR;
          else if (d.selected[3 - state]) return GROUP1_UNSELECTED_COLOR;
          else return GROUP1_DEFAULT_COLOR;
        } else if (demographics[d.subject].group === "control") {
          if (d.selected[state] && d.selected[3 - state])
            return GROUP2_OVERLAP_COLOR;
          else if (d.selected[state]) return GROUP2_SELECTED_COLOR;
          else if (d.selected[3 - state]) return GROUP2_UNSELECTED_COLOR;
          else return GROUP2_DEFAULT_COLOR;
        } else {
          return "black";
        }
      })
      .filter(
        (d) =>
          selectedWindowsA.includes(d.id) || selectedWindowsB.includes(d.id)
      )
      .raise()
      .attr("fill", function (d) {
        const currentFill = this.getAttribute("fill");

        if (showSelectedWindowsA && selectedWindowsA.includes(d.id))
          return SUBJECT_A_COLOR;
        else if (showSelectedWindowsB && selectedWindowsB.includes(d.id))
          return SUBJECT_B_COLOR;
        else return currentFill;
      });

    // ZOOM FUNCTIONALITY
    // // Define the zoom behavior inside the useEffect
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 20]) // Limit zooming out to 50% and in to 20x
      .on("zoom", (event) => {
        // Update tooltips' positions when zooming
        svg
          .selectAll("circle")
          .attr("cx", (d) => event.transform.applyX(d.cx))
          .attr("cy", (d) => event.transform.applyY(d.cy));

        zoomTransformRef.current = event.transform;

        // Apply zoom transform to density plot
        // select(densityPlotRef.current).attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior; // Store the zoom behavior in the ref
    svg.call(zoomBehavior.transform, zoomTransformRef.current);

    svg
      .on("mousedown", startLasso)
      .on("mousemove", updateLasso)
      .on("mouseup", endLasso)
      .attr("cursor", "crosshair");
    svg
      .call(zoomBehavior)
      .call(zoomBehavior.transform, zoomTransformRef.current);
    circlesSelection
      .attr("cursor", "crosshair")
      .on("mouseover", null)
      .on("mouseout", null)
      .on("click", null)
      .on("contextmenu", null);

    // Handle lasso path
    if (lassoPath.length > 1) {
      svg
        .selectAll("polygon")
        .data([lassoPath])
        .join("polygon")
        .attr("points", (d) => d.map((p) => p.join(",")).join(" "))
        .attr("fill", state == 1 ? CLUSTER1_COLOR : CLUSTER2_COLOR)
        .attr("opacity", 0.3);
    } else {
      svg.selectAll("polygon").remove();
    }

    circlesSelection.exit().remove();

    return () => {
      svg.on("mousedown", null).on("mousemove", null).on("mouseup", null);
      circlesSelection
        .on("mouseover", null)
        .on("mouseout", null)
        .on("click", null);
    };
  }, [
    circles,
    lassoPath,
    state,
    selectedWindowsA,
    selectedWindowsB,
    includeControls,
    includePatients,
    showSelectedWindowsA,
    showSelectedWindowsB,
    size,
  ]);

  // Lasso functions
  const startLasso = (e) => {
    if (!e.shiftKey) return;
    setIsLassoing(true);
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLassoPath([[x, y]]);
  };

  const updateLasso = (e) => {
    if (!isLassoing) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLassoPath((prevPath) => [...prevPath, [x, y]]);
  };
  const endLasso = () => {
    if (!isLassoing) return;
    setIsLassoing(false);
    const path = lassoPath;
    if (path.length < 2) return;

    const isInsideLasso = (cx, cy) => {
      // Get the current zoom transform
      const zoomTransform = svgRef.current.__zoom || zoomIdentity;

      // Apply the zoom transform to the lasso path
      const transformedPath = lassoPath.map(([x, y]) =>
        zoomTransform.invert([x, y])
      );

      let inside = false;
      for (
        let i = 0, j = transformedPath.length - 1;
        i < transformedPath.length;
        j = i++
      ) {
        const xi = transformedPath[i][0],
          yi = transformedPath[i][1];
        const xj = transformedPath[j][0],
          yj = transformedPath[j][1];
        const intersect =
          yi > cy !== yj > cy && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const updatedCircles = circles.map((circle) => {
      const inside = isInsideLasso(circle.cx, circle.cy);
      let selected = circle.selected;
      selected[state] = inside;
      return { ...circle, selected: selected };
    });

    setCircles(updatedCircles);
    setSelectedGroup1(
      updatedCircles
        .filter((d) => d.selected[1] === true)
        .map((d) => ({
          id: d.id,
          subject: d.subject,
          window: d.window,
        }))
    );
    setSelectedGroup2(
      updatedCircles
        .filter((d) => d.selected[2] === true)
        .map((d) => ({
          id: d.id,
          subject: d.subject,
          window: d.window,
        }))
    );
    setLassoPath([]);
  };
  const handleRightClick = (event) => {
    event.preventDefault();
    setTooltip2({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      content: (
        <div className="flex flex-col border border-gray-300 shadow-lg rounded-md bg-white w-40">
          <button
            className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
            onClick={() => {
              setTooltip2({ ...tooltip2, visible: false });
            }}
          ></button>
          <button
            className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
            onClick={() => {
              setIncludePatients(!includePatients);
              setTooltip2({ ...tooltip2, visible: false });
            }}
          >
            {includePatients ? "Hide Patients" : "Show Patients"}
          </button>
          <button
            className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
            onClick={() => {
              setIncludeControls(!includeControls);
              setTooltip2({ ...tooltip2, visible: false });
            }}
          >
            {includeControls ? "Hide Controls" : "Show Controls"}
          </button>
          <button
            className="px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200"
            onClick={() => {
              setShowSelectedWindowsA(!showSelectedWindowsA);
              setTooltip2({ ...tooltip2, visible: false });
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
              setTooltip2({ ...tooltip2, visible: false });
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
              setTooltip2({ ...tooltip2, visible: false });
            }}
          >
            Reset Zoom
          </button>
        </div>
      ),
    });
  };

  // Reset zoom function that references the zoomBehaviorRef
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
      {tooltip.visible && (
        <ToolTip x={tooltip.x} y={tooltip.y} content={tooltip.content} />
      )}
      {tooltip2.visible && (
        <ToolTip x={tooltip2.x} y={tooltip2.y} content={tooltip2.content} />
      )}
    </div>
  );
};

export default TestPlot;
