import React, { useState, useEffect, useRef, useContext } from "react";
import { select } from "d3";
import { WINDOW_SIZE_PIXELS, LABELS_FONT_SIZE } from "../helpers/constants";
const Heatmap = ({
  margin,
  data,
  labels,
  colorScale,
  selectedOutgoingLabels,
  setSelectedOutgoingLabels,
  selectedIncomingLabels,
  setSelectedIncomingLabels,
  height = WINDOW_SIZE_PIXELS,
  width = WINDOW_SIZE_PIXELS,
  getSVGString,
  svgRef,
}) => {
  svgRef = svgRef || useRef();

  const handleOutgoingLabelsClick = (event, d) => {
    const index = labels.indexOf(d);
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
  const handleIncomingLabelsClick = (event, d) => {
    const index = labels.indexOf(d);
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
  };

  useEffect(() => {
    const numNodes = labels.length;
    const cellSize = width / numNodes;
    // Select the SVG element and set its dimensions
    const svg = select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // Clear any existing content
    svg.selectAll("*").remove();

    // Append a group element to hold the heatmap and labels
    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the heatmap cells
    const cells = group.selectAll(".cell").data(data);

    cells
      .enter()
      .append("rect")
      .attr("class", "cell")
      .merge(cells)
      .attr("x", (d, i) => (i % numNodes) * cellSize)
      .attr("y", (d, i) => Math.floor(i / numNodes) * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d, i) => {
        return d === null ||
          !selectedIncomingLabels[i % numNodes] ||
          !selectedOutgoingLabels[Math.floor(i / numNodes)]
          ? "#FFF"
          : colorScale(d);
      })
      .attr("stroke", "grey")
      .on("click", function (_, d) {
        if (d == null) return;
        const currentFill = this.getAttribute("fill");
        select(this).attr(
          "fill",
          currentFill == "#FFF" ? colorScale(d) : "#FFF"
        );
      });

    cells.exit().remove();

    // Add column labels (top)
    const incomingLabels = group.selectAll(".column-label").data(labels);

    incomingLabels
      .enter()
      .append("text")
      .attr("class", "column-label")
      .merge(incomingLabels)
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("y", -10) // Adjust this value to position labels above the cells
      .attr("text-anchor", "start")
      .attr("font-size", LABELS_FONT_SIZE) // Adjust the font size here
      .text((d) => d)
      .attr(
        "transform",
        (d, i) => `rotate(-40, ${i * cellSize + cellSize / 2}, -5)`
      )
      .style("cursor", "pointer")
      .style("fill", (d, i) =>
        selectedIncomingLabels[i] ? "rgb(0,0,0)" : "rgb(200,200,200)"
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
      .on("click", handleIncomingLabelsClick);

    incomingLabels.exit().remove();

    // Add row labels (left)
    const outgoingLabels = group.selectAll(".row-label").data(labels);

    outgoingLabels
      .enter()
      .append("text")
      .attr("class", "row-label")
      .merge(outgoingLabels)
      .attr("x", -5)
      .attr("y", (d, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .attr("font-size", LABELS_FONT_SIZE) // Adjust the font size here
      .text((d) => d)
      .style("cursor", "pointer")
      .style("fill", (d, i) =>
        selectedOutgoingLabels[i] ? "rgb(0,0,0)" : "rgb(200,200,200)"
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
      .on("click", handleOutgoingLabelsClick);
    outgoingLabels.exit().remove();

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
    getSVGString,
  ]);

  return (
    <>
      <svg ref={svgRef}></svg>
    </>
  );
};

export default Heatmap;
