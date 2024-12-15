import { useEffect, useRef, useState } from "react";
import { select, range, scaleLinear } from "d3";
import {
  reconstructMatrix,
  filterData,
  getMinMaxValues,
} from "../helpers/util";

import {
  WINDOW_SIZE_PIXELS,
  LINE_OPACITY,
  LABELS_FONT_SIZE,
} from "../helpers/constants";

const NodeLink = ({
  margin,
  data,
  labels,
  colorScale,
  // selectedLabels,
  // setSelectedLabels,
  selectedOutgoingLabels,
  setSelectedOutgoingLabels,
  selectedIncomingLabels,
  setSelectedIncomingLabels,
  height = WINDOW_SIZE_PIXELS + 20,
  width = WINDOW_SIZE_PIXELS + 20,
  getSVGString,
  svgRef,
}) => {
  svgRef = svgRef || useRef();

  const handleLabelClick = (event, d) => {
    const index = labels.indexOf(d);
    // setSelectedLabels((prev) => {
    //   let newSelected = [...prev];
    //   if (newSelected.every((d) => d === true)) {
    //     newSelected = new Array(labels.length).fill(false);
    //   }
    //   newSelected[index] = !newSelected[index];
    //   if (newSelected.every((d) => d === false)) {
    //     return new Array(labels.length).fill(true);
    //   }
    //   return newSelected;
    // });
    setSelectedIncomingLabels((prev) => {
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
    setSelectedOutgoingLabels((prev) => {
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
    //Nodes
    const numNodes = labels.length;
    const radius = WINDOW_SIZE_PIXELS / 2;
    const circleRadius = 1.5;

    const centerX = width / 2;
    const centerY = height / 2;

    // Generate positions for nodes
    const angleStep = (2 * Math.PI) / numNodes;

    const nodes = range(numNodes).map((d, i) => {
      return {
        angle: angleStep * i,
        x: centerX + radius * Math.cos(angleStep * i),
        y: centerY + radius * Math.sin(angleStep * i),
        label: labels[i],
      };
    });

    const svg = select(svgRef.current)
      .attr("width", width + margin.left + +margin.right)
      .attr("height", height + margin.top + +margin.bottom);

    // Clear any existing content
    svg.selectAll("*").remove();

    // Append a group element to hold the heatmap and labels
    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left - 10},${margin.top})`);

    // const circles = group.selectAll(".circle").data(nodes);

    // circles
    //   .enter()
    //   .append("circle")
    //   .attr("class", "circle")
    //   .attr("cx", (d) => d.x)
    //   .attr("cy", (d) => d.y)
    //   .attr("r", circleRadius)
    //   .attr("fill", "black");
    // circles.exit().remove();

    const nodeLabels = group.selectAll(".label").data(nodes);

    // Handle enter and update selections separately
    nodeLabels
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => d.x + (circleRadius + 10) * Math.cos(d.angle))
      .attr("y", (d) => d.y + (circleRadius + 10) * Math.sin(d.angle))
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) =>
        d.angle > Math.PI / 2 && d.angle < (3 * Math.PI) / 2 ? "end" : "start"
      )
      .attr("font-size", LABELS_FONT_SIZE)
      .text((d) => d.label)
      .style("cursor", "pointer")
      .style("fill", (d, i) =>
        selectedIncomingLabels[i] || selectedOutgoingLabels[i]
          ? "rgb(0,0,0)"
          : "rgb(200,200,200)"
      )
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
      .on("click", (event, d) => handleLabelClick(event, d.label));

    //Edges
    const { minValue, maxValue } = getMinMaxValues(data);
    // const colorScale = createColorScale(minValue, maxValue, minColor, maxColor);
    const weightScale = scaleLinear()
      .domain([minValue, maxValue])
      .range([10, 50]);

    const edges = [];
    let index = 0;
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        if (
          data[index] == null ||
          selectedIncomingLabels[i] === false ||
          selectedOutgoingLabels[i] === false ||
          selectedIncomingLabels[j] === false ||
          selectedOutgoingLabels[j] === false
        ) {
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

    const edgeLines = group.selectAll("line").data(edges);

    edgeLines.join(
      (enter) =>
        enter
          .append("line")
          .attr("x1", (d) => nodes[d.source].x)
          .attr("y1", (d) => nodes[d.source].y)
          .attr("x2", (d) => nodes[d.target].x)
          .attr("y2", (d) => nodes[d.target].y)
          .attr("stroke", (d) => d.color)
          .attr("stroke-width", (d) => Math.sqrt(d.weight))
          .attr("stroke-opacity", LINE_OPACITY),
      (update) =>
        update
          .attr("stroke", (d) => d.color)
          .attr("stroke-width", (d) => Math.sqrt(d.weight)),
      (exit) => exit.remove()
    );
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
    selectedIncomingLabels,
    selectedOutgoingLabels,
  ]);
  return <svg ref={svgRef}></svg>;
};

export default NodeLink;
