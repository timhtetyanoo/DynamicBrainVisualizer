import { useState, useEffect, useRef, useContext } from "react";
import { select } from "d3";
import { SubjectViewContext } from "../pages/SubjectView";
import { filterData, getMinMaxValues, createAdjList } from "../helpers/util";
import { WINDOW_SIZE_PIXELS, LABELS_FONT_SIZE } from "../helpers/constants";
import Tooltip from "./ToolTip";

const AdjacencyList = ({
  margin,
  data,
  labels,
  colorScale,
  height = WINDOW_SIZE_PIXELS,
  width = WINDOW_SIZE_PIXELS,
  getSVGString,
  svgRef,
}) => {
  svgRef = svgRef || useRef();

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  const handleRectClick = (event, d) => {
    setTooltip({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      content: `${d}`,
    });
  };

  useEffect(() => {
    let timeoutId;
    if (tooltip.visible) {
      timeoutId = setTimeout(() => {
        setTooltip({ ...tooltip, visible: false });
      }, 2000); // 3000 milliseconds = 3 seconds
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [tooltip.visible]);

  useEffect(() => {
    const numNodes = labels.length;
    const cellsHeight = height / numNodes;
    const cellsWidth = width / numNodes / 2;

    const svg = select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Clear any existing content
    svg.selectAll("*").remove();

    // Append a group element to hold visualization and labels
    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const labelsGroup = group
      .selectAll(".label-group")
      .data([null])
      .join("g")
      .attr("class", "label-group")
      .selectAll(".label")
      .data(labels);

    labelsGroup
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", width / 2)
      .attr("y", (_, i) => i * cellsHeight + 10)
      .attr("text-anchor", "middle")
      .attr("font-size", LABELS_FONT_SIZE)
      .text((d) => d);

    //Edges
    const adjList = createAdjList(data, numNodes);
    const outgoingEdges = group
      .selectAll(".outgoing-edges")
      .data([null])
      .join("g")
      .attr("class", "outgoing-edges")
      .selectAll(".outgoing-edge")
      .data(adjList)
      .join("g")
      .attr("class", "outgoing-edge")
      .each(function (d, l) {
        select(this)
          .selectAll(".outgoing-rect")
          .data(d.outgoing)
          .join("rect")
          .attr("class", "outgoing-rect")
          .attr("x", (_, i) => 20 + width / 2 + i * cellsWidth)
          .attr("y", l * cellsHeight)
          .attr("width", cellsWidth)
          .attr("height", cellsHeight)
          .attr("fill", (d) => (d === null ? "#FFF" : colorScale(d.weight)))
          .attr("stroke", "grey")
          .attr("title", d.node)
          .on("click", (event, d) => {
            handleRectClick(event, labels[d.node]);
          });
      });
    const incomingEdges = group
      .selectAll(".incoming-edges")
      .data([null])
      .join("g")
      .attr("class", "incoming-edges")
      .selectAll(".incoming-edge")
      .data(adjList)
      .join("g")
      .attr("class", "incoming-edge")
      .each(function (d, l) {
        select(this)
          .selectAll(".incoming-rect") // Correcting the selector here
          .data(d.incoming)
          .join("rect")
          .attr("class", "incoming-rect")
          .attr("x", (_, i) => width / 2 - (20 + cellsWidth) - i * cellsWidth)
          .attr("y", l * (height / numNodes))
          .attr("width", cellsWidth)
          .attr("height", cellsHeight)
          .attr("fill", (d) => (d === null ? "#FFF" : colorScale(d.weight)))
          .attr("stroke", "grey")
          .on("click", (event, d) => {
            handleRectClick(event, labels[d.node]);
          });
      });

    if (getSVGString) {
      const svgElement = svgRef.current;
      const serializedSVG = new XMLSerializer().serializeToString(svgElement);
      getSVGString(serializedSVG);
    }
  }, [data, labels, height, width, getSVGString, svgRef]);

  return (
    <>
      <svg ref={svgRef}></svg>
      {tooltip.visible && (
        <Tooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} />
      )}
    </>
  );
};

export default AdjacencyList;
