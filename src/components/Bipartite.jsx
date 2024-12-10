import { useState, useEffect, useRef, useContext } from "react";
import { select, scaleBand, scaleLinear, axisLeft, axisRight } from "d3";
import { getMinMaxValues } from "../helpers/util";
import {
  WINDOW_SIZE_PIXELS,
  LINE_OPACITY,
  LABELS_FONT_SIZE,
} from "../helpers/constants";
import { get } from "lodash";
const Bipartite = ({
  margin,
  data,
  labels,
  colorScale,
  leftLabelsSelected,
  setLeftLabelsSelected,
  rightLabelsSelected,
  setRightLabelsSelected,

  height = WINDOW_SIZE_PIXELS,
  width = WINDOW_SIZE_PIXELS,
  showLabel = true,
  showLines = false,
  selectedLabels = null,
  selectedLabelsRight = null,
  getSVGString,
  svgRef,
}) => {
  svgRef = svgRef || useRef();
  // const [leftLabelsSelected, setLeftLabelsSelected] = useState(
  //   new Array(labels.length).fill(true)
  // );
  // const [rightLabelsSelected, setRightLabelsSelected] = useState(
  //   new Array(labels.length).fill(true)
  // );

  const handleLeftAxisClick = (event, d) => {
    const index = labels.indexOf(d);
    setLeftLabelsSelected((prev) => {
      let newSelected = [...prev];
      if (newSelected.every((d) => d === true)) {
        newSelected = new Array(labels.length).fill(false);
      }
      newSelected[index] = !newSelected[index];
      if (newSelected.every((d) => d === false)) {
        return new Array(labels.length).fill(true);
      }
      return newSelected;
    });
  };
  const handleRightAxisClick = (event, d) => {
    const index = labels.indexOf(d);
    setRightLabelsSelected((prev) => {
      let newSelected = [...prev];
      if (newSelected.every((d) => d === true)) {
        newSelected = new Array(labels.length).fill(false);
      }
      newSelected[index] = !newSelected[index];
      if (newSelected.every((d) => d === false)) {
        return new Array(labels.length).fill(true);
      }
      return newSelected;
    });
  };

  useEffect(() => {
    const numNodes = labels.length;

    const axisWidth = showLabel ? 30 : 0;

    const xLeft = axisWidth,
      xRight = width - axisWidth;

    const yAxis = scaleBand().domain(labels).range([0, height]);

    const svg = select(svgRef.current)
      .attr(
        "width",
        width + (showLabel ? margin.left : 0) + (showLabel ? margin.right : 0)
      )
      .attr("height", height + margin.top + margin.bottom);
    // Clear any existing content
    svg.selectAll("*").remove();

    const group = svg
      .append("g")
      .attr(
        "transform",
        `translate(${showLabel ? margin.left : 0},${margin.top})`
      );
    if (showLabel) {
      const leftAxis = group
        .selectAll("g.left-axis")
        .data([null])
        .join("g")
        .attr("class", "left-axis")
        .attr("transform", `translate(${xLeft},0)`)
        .call(axisLeft(yAxis));
      leftAxis.selectAll(".tick").selectAll("line").remove();
      const rightAxis = group
        .selectAll("g.right-axis")
        .data([null])
        .join("g")
        .attr("class", "right-axis")
        .attr("transform", `translate(${xRight},0)`)
        .call(axisRight(yAxis));
      rightAxis.selectAll(".tick").selectAll("line").remove();

      // Interaction
      leftAxis
        .selectAll("text")
        .style("cursor", "pointer")
        .style("fill", (d, i) =>
          leftLabelsSelected[i] ? "rgb(0,0,0)" : "rgb(200,200,200)"
        )
        .attr("font-size", LABELS_FONT_SIZE)
        .style("transition", "all 0.3s ease")
        .on("mouseover", function (event, d) {
          select(this)
            .style("text-decoration", "underline") // Underline on hover
            .style("font-size", "9px"); // Slightly increase the size
        })
        .on("mouseout", function (event, d) {
          select(this)
            .style("text-decoration", "none") // Remove underline when not hovering
            .style("font-size", LABELS_FONT_SIZE); // Reset font size
        })
        .on("click", handleLeftAxisClick);
      rightAxis
        .selectAll("text")
        .style("cursor", "pointer")
        .style("fill", (d, i) =>
          rightLabelsSelected[i] ? "rgb(0,0,0)" : "rgb(200,200,200)"
        )
        .attr("font-size", LABELS_FONT_SIZE)
        .style("transition", "all 0.3s ease")
        .on("mouseover", function (event, d) {
          select(this)
            .style("text-decoration", "underline") // Underline on hover
            .style("font-size", "9px"); // Slightly increase the size
        })
        .on("mouseout", function (event, d) {
          select(this)
            .style("text-decoration", "none") // Remove underline when not hovering
            .style("font-size", LABELS_FONT_SIZE); // Reset font size
        })
        .on("click", handleRightAxisClick);
    }

    //Edges
    const { minValue, maxValue } = getMinMaxValues(data);
    const weightScale = scaleLinear()
      .domain([minValue, maxValue])
      .range([10, 50]);

    //Add edges based on labels selected /////
    const edges = [];
    let index = 0;
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        if (
          (leftLabelsSelected != null && leftLabelsSelected[i] === false) ||
          (selectedLabels != null && selectedLabels[i] === false)
        ) {
          index++;
          continue;
        }
        if (
          (rightLabelsSelected != null && rightLabelsSelected[j] === false) ||
          (selectedLabelsRight != null && selectedLabelsRight[j] === false)
        ) {
          index++;
          continue;
        }
        if (data[index] == null) {
          edges.push({
            source: i,
            target: j,
            weight: 0,
            color: "white",
          });
          index++;
        } else if (i !== j) {
          edges.push({
            source: i,
            target: j,
            weight: weightScale(data[index]),
            color: colorScale(data[index]),
          });
          index++;
        }
      }
    }
    const tickPositions = labels.map(
      (label) => yAxis(label) + yAxis.bandwidth() / 2
    );
    //add horizontal lines between labels
    if (showLines) {
      group
        .selectAll(".horizontal-line")
        .data(labels)
        .enter()
        .append("line")
        .attr("class", "horizontal-line")
        .attr("x1", xLeft)
        .attr("y1", (d, i) => tickPositions[i])
        .attr("x2", xRight)
        .attr("y2", (d, i) => tickPositions[i])
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-opacity", 0.25);
    }

    const edgeLines = group.selectAll(".edges").data(edges);

    edgeLines.join(
      (enter) =>
        enter
          .append("line")
          .attr("class", "edges")
          .attr("x1", (d) => xLeft + 2)
          .attr("y1", (d) => tickPositions[d.source])
          .attr("x2", (d) => xRight - 2)
          .attr("y2", (d) => tickPositions[d.target])
          .attr("stroke", (d) => d.color)
          .attr("stroke-width", (d) => Math.sqrt(d.weight))
          .attr("stroke-opacity", LINE_OPACITY),
      (update) =>
        update
          .attr("stroke", (d) => d.color)
          .attr("stroke-width", (d) => Math.sqrt(d.weight)),
      (exit) => exit.remove()
    );
    const leftLabelCircles = group
      .selectAll(".left-label-circles")
      .data(labels);

    leftLabelCircles
      .enter()
      .append("circle")
      .attr("class", "left-label-circles")
      .attr("cx", xLeft)
      .attr("cy", (d, i) => tickPositions[i])
      .attr("r", 3)
      .attr("fill", "black");

    const rightLabelCircles = group
      .selectAll(".right-label-circles")
      .data(labels);

    rightLabelCircles
      .enter()
      .append("circle")
      .attr("class", "right-label-circles")
      .attr("cx", xRight)
      .attr("cy", (d, i) => tickPositions[i])
      .attr("r", 3)
      .attr("fill", "black");
    if (getSVGString) {
      const svgElement = svgRef.current;
      const serializedSVG = new XMLSerializer().serializeToString(svgElement);
      getSVGString(serializedSVG);
    }
  }, [
    data,
    labels,
    height,
    width,
    showLabel,
    leftLabelsSelected,
    rightLabelsSelected,
    selectedLabels,
    selectedLabelsRight,
    getSVGString,
    svgRef,
  ]);

  return <svg ref={svgRef}></svg>;
};

export default Bipartite;
