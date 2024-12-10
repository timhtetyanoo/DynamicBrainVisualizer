import React, { useEffect, useRef } from "react";
import { select, scaleBand, axisLeft } from "d3";
import { LABELS_FONT_SIZE } from "../helpers/constants";

const Labels = ({
  display = true,
  labels,
  selectedLabels,
  setSelectedLabels,
  width = 50,
  height = 500,
  margin = { top: 0, right: 0, bottom: 50, left: 50 },
}) => {
  const svgRef = useRef();

  const handleLabelClick = (event, d) => {
    const index = labels.indexOf(d);
    setSelectedLabels((prev) => {
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
    const yAxis = scaleBand().domain(labels).range([0, height]);
    const xLeft = 50;

    const svg = select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove();

    if (!display) return;

    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const leftAxis = group
      .selectAll("g.left-axis")
      .data([null])
      .join("g")
      .attr("class", "left-axis")
      .attr("transform", `translate(${xLeft},0)`)
      .call(axisLeft(yAxis).tickSizeOuter(0));
    leftAxis.selectAll(".tick").selectAll("line").remove();
    leftAxis
      .selectAll("text")
      .style("font-size", LABELS_FONT_SIZE)
      .style("cursor", "pointer")
      .style("fill", (d, i) =>
        selectedLabels[i] ? "rgb(0,0,0)" : "rgb(200,200,200)"
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
      .on("click", handleLabelClick);
  }, [labels, selectedLabels, width, height, display]);

  return (
    <>
      <svg ref={svgRef}></svg>
    </>
  );
};

export default Labels;
