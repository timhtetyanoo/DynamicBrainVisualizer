import React, { useEffect, useRef, useState } from "react";
import {
  FEATURE_SELECTION_WIDTH,
  SELECTED_COLOR,
  LABELS_FONT_SIZE,
} from "../helpers/constants";
import { select } from "d3";
import {
  getMinMaxValues,
  createColorScale,
  reconstructMatrix,
} from "../helpers/util";

const FeatureSelection = ({
  features,
  labels,
  handleFeatureChange,
  handleFeatureChangeIncoming,
  handleFeatureChangeOutgoing,
  selectAllFeatures,
  deselectAllFeatures,
  data,
}) => {
  const svgRef = useRef();

  const [selectAll, setSelectAll] = useState(true);

  const { minValue, maxValue } = getMinMaxValues(data);
  const colorScale = createColorScale(minValue, maxValue);

  useEffect(() => {
    if (Object.values(features).every((value) => value === true)) {
      setSelectAll(true);
    }
    if (Object.values(features).every((value) => value === false)) {
      setSelectAll(false);
    }
  }, [features]);

  useEffect(() => {
    const numNodes = labels.length;
    const width = FEATURE_SELECTION_WIDTH;
    const cellSize = width / numNodes;
    const margin = { top: 30, right: 5, bottom: 0, left: 30 };
    const svg = select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", width + margin.top + margin.bottom);

    svg.selectAll("*").remove();
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    labels.forEach((label1, i) => {
      labels.forEach((label2, j) => {
        const rect = g
          .append("rect")
          .attr("x", j * cellSize)
          .attr("y", i * cellSize)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("stroke", "grey");
        if (i === j) rect.attr("fill", "white");
        else {
          rect
            .attr("fill", colorScale(data[i * labels.length + j]))
            // .attr("opacity", features[`${label1}_${label2}`] ? 1 : 0.5)
            .attr("cursor", "pointer")
            .on("click", () => handleFeatureChange(`${label1}_${label2}`));
          if (features[`${label1}_${label2}`]) {
            g.append("line")
              .attr("x1", j * cellSize + cellSize / 4)
              .attr("y1", i * cellSize + cellSize / 4)
              .attr("x2", j * cellSize + (3 * cellSize) / 4)
              .attr("y2", i * cellSize + (3 * cellSize) / 4)
              .attr("stroke", "white")
              .attr("stroke-width", 1);

            g.append("line")
              .attr("x1", j * cellSize + (3 * cellSize) / 4)
              .attr("y1", i * cellSize + cellSize / 4)
              .attr("x2", j * cellSize + cellSize / 4)
              .attr("y2", i * cellSize + (3 * cellSize) / 4)
              .attr("stroke", "white")
              .attr("stroke-width", 1);
          }
        }
      });
    });
    g.append("rect")
      .attr("x", -cellSize / 1.5)
      .attr("y", -cellSize / 1.5)
      .attr("width", cellSize / 1.5)
      .attr("height", cellSize / 1.5)
      .attr("stroke", "black")
      .attr("fill", (d) => (selectAll ? "#4444" : "white"))
      .style("cursor", "pointer")
      .on("click", () => {
        if (selectAll) {
          deselectAllFeatures();
        } else {
          selectAllFeatures();
        }
        setSelectAll(!selectAll);
      });

    const incomingLabels = g.selectAll(".column-label").data(labels);

    incomingLabels
      .enter()
      .append("text")
      .attr("class", "column-label")
      .merge(incomingLabels)
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("y", -5) // Adjust this value to position labels above the cells
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "start")
      .attr("font-size", LABELS_FONT_SIZE) // Adjust the font size here
      .text((d) => d)
      .attr(
        "transform",
        (d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -5)`
      )
      .attr("cursor", "pointer")
      .style("transition", "all 0.3s ease")
      .on("mouseover", function (event, d) {
        select(this)
          .style("text-decoration", "underline") // Underline on hover
          .style("font-size", "8px"); // Slightly increase the size
      })
      .on("mouseout", function (event, d) {
        select(this)
          .style("text-decoration", "none") // Remove underline when not hovering
          .style("font-size", LABELS_FONT_SIZE); // Reset font size
      })
      .on("click", handleFeatureChangeIncoming);

    const outgoingLabels = g.selectAll(".row-label").data(labels);

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
      .attr("cursor", "pointer")
      .style("transition", "all 0.3s ease")
      .on("mouseover", function (event, d) {
        select(this)
          .style("text-decoration", "underline") // Underline on hover
          .style("font-size", "8px"); // Slightly increase the size
      })
      .on("mouseout", function (event, d) {
        select(this)
          .style("text-decoration", "none") // Remove underline when not hovering
          .style("font-size", LABELS_FONT_SIZE); // Reset font size
      })
      .on("click", handleFeatureChangeOutgoing);
  }, [features, selectAll, data]); //Add data
  return (
    <div>
      <strong className="block text-sm font-medium text-gray-700">
        Feature Selection
      </strong>
      <div className="flex space-y-2 ">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default FeatureSelection;
