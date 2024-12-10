import React, { useState, useEffect, useRef, useContext } from "react";
import { select, brushX, scaleBand, axisBottom } from "d3";
import { SubjectViewContext } from "../pages/SubjectView";
import {
  filterData,
  getMinMaxValues,
  createColorScale,
  createNodeActivity,
} from "../helpers/util";
import {
  SUBJECT_A_COLOR,
  SUBJECT_B_COLOR,
  TIMELINE_MAX_NUM_WINDOWS,
} from "../helpers/constants";
const NodeActivity = ({
  labels,
  selectedLabels,
  setSelectedLabels,
  windows,
  windowStartIndex,
  setWindowStartIndex,
  windowEndIndex,
  setWindowEndIndex,
  width,
  height,
  degree,
  getSVGString,
}) => {
  const { id } = useContext(SubjectViewContext);
  const svgRef = useRef();
  width = width ? width - 10 : width;

  const numNodes = labels.length;
  const numWindows = windows.length;
  const cellsWidth = width / numWindows;
  const cellsHeight = height / numNodes;
  const minBrushSize = cellsWidth;
  const maxBrushSize = TIMELINE_MAX_NUM_WINDOWS * cellsWidth;

  const [currentSelection, setCurrentSelection] = useState([
    windowStartIndex * cellsWidth,
    windowEndIndex * cellsWidth,
  ]);
  useEffect(() => {
    setCurrentSelection([
      windowStartIndex * cellsWidth,
      windowEndIndex * cellsWidth,
    ]);
  }, [windowStartIndex, windowEndIndex]);

  useEffect(() => {
    const svg = select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%");

    svg.selectAll("*").remove();

    const group = svg.append("g");

    const data = windows.map((d) => d.value);
    const nodesActivity = createNodeActivity(data, numNodes, degree);
    const { minValue, maxValue } = getMinMaxValues(nodesActivity.flat());
    const colorScale = createColorScale(minValue, maxValue);

    const nodesActivityTimeline = group
      .selectAll(".nodeActivity")
      .data(nodesActivity)
      .join("g")
      .attr("class", "nodeActivity")
      .each(function (d, i) {
        select(this)
          .selectAll("rects")
          .data(d)
          .join("rect")
          .attr("class", "rects")
          .attr("x", (d, i) => i * cellsWidth)
          .attr("y", i * cellsHeight)
          .attr("width", cellsWidth)
          .attr("height", cellsHeight)
          .attr("fill", (d) =>
            d === 0 || !selectedLabels[i] ? "#FFF" : colorScale(d)
          )
          .attr("stroke", "grey");
      });
    const xScale = scaleBand()
      .domain(windows.map((d, i) => i))
      .range([0, numWindows * cellsWidth]);

    const tickInterval = 5;

    const xAxis = axisBottom(xScale)
      .tickSizeOuter(0)
      .tickValues(
        windows.map((d, i) => i).filter((d, i) => i % tickInterval === 0)
      );

    group
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "middle");

    let brushSelection;
    let initialSelection = [
      windowStartIndex * cellsWidth,
      windowEndIndex * cellsWidth,
    ];

    const brush = brushX()
      .extent([
        [0, 0],
        [numWindows * cellsWidth, height],
      ])
      .on("start", brushStart)
      .on("end", brushEnd);

    const gb = svg
      .append("g")
      .attr("class", "selection")
      .call(brush)
      .call(brush.move, initialSelection);

    gb.selectAll(".selection").attr(
      "fill",
      id == "A" ? SUBJECT_A_COLOR : SUBJECT_B_COLOR
    );
    function brushStart(event) {
      brushSelection = event.selection;
    }
    function brushEnd(event) {
      if (event.sourceEvent && event.sourceEvent.type === "mouseup") {
        if (event.selection && cellsWidth > 0) {
          const [x0, x1] = event.selection;
          let [x0Rounded, x1Rounded] = [x0, x1].map(
            (d) => Math.round(d / cellsWidth) * cellsWidth
          );
          if (x1Rounded - x0Rounded < minBrushSize) {
            x1Rounded = x0Rounded + minBrushSize;
          }
          if (x1Rounded - x0Rounded > maxBrushSize) {
            if (brushSelection[0] == x0) x1Rounded = x0Rounded + maxBrushSize;
            else x0Rounded = x1Rounded - maxBrushSize;
          }
          select(this).transition().call(brush.move, [x0Rounded, x1Rounded]);
          setWindowStartIndex(Math.round(x0Rounded / cellsWidth));
          setWindowEndIndex(Math.round(x1Rounded / cellsWidth));
        }
        if (!event.selection) {
          gb.call(brush.move, currentSelection);
        }
      }
    }
    if (getSVGString) {
      const svgElement = svgRef.current;
      const serializedSVG = new XMLSerializer().serializeToString(svgElement);
      getSVGString(serializedSVG);
    }
  }, [
    labels,
    windows,
    width,
    height,
    degree,
    selectedLabels,
    currentSelection,
    getSVGString,
  ]);

  return <svg ref={svgRef}></svg>;
};

export default NodeActivity;
