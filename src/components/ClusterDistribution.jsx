import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import DemographicHistogram from "./DemographicDistribution";
import { CLUSTER1_COLOR, CLUSTER2_COLOR } from "../helpers/constants";

const ClusterDistribution = ({ id, group, nrWindows, setSubject }) => {
  const subjects = new Set(group.map((item) => `${item.subject}`));

  const numSubjects = subjects.size;

  const k = group.length > 0 ? numSubjects : 0; // Number of rows
  const j = group.length > 0 ? nrWindows : 0; // Number of columns

  const height = numSubjects * 10; // Height of the heatmap

  const labelsWidth = 50;
  const obj = {};
  subjects.forEach((subject) => {
    obj[subject] = Array.from({ length: j }, () => 0);
  });
  group.forEach((item) => {
    obj[item.subject][item.window] = 1;
  });

  const sortedObj = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});

  const data = Object.values(sortedObj).flat();

  const labels = Object.keys(sortedObj);
  // Example labels
  const svgRef = useRef();

  useEffect(() => {
    const width = svgRef.current.getBoundingClientRect().width - labelsWidth;

    const cellWidth = width / j;
    const cellHeight = height / k;

    // Create the SVG element
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%") // Extra space for labels
      .attr("height", height);

    // Clear any existing elements
    svg.selectAll("*").remove();

    // Create a group for the heatmap
    const windows = svg
      .append("g")
      .attr("transform", `translate(${labelsWidth}, 0)`); // Adjusted for labels

    // Bind data and create cells
    windows
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d, i) => (i % j) * cellWidth)
      .attr("y", (d, i) => Math.floor(i / j) * cellHeight)
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", (d) =>
        d === 1 ? (id == 1 ? CLUSTER1_COLOR : CLUSTER2_COLOR) : "#AAAAAA"
      )
      .attr("stroke", "white")
      .attr("stroke-width", 0.5);

    // Add labels on the left
    svg
      .selectAll("text")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", 45) // Adjusted to bring the labels closer to the heatmap
      .attr("y", (d, i) => i * cellHeight + cellHeight / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("font-size", "8px")
      .attr("fill", "black")
      .text((d) => d)
      .style("cursor", "pointer")
      .style("transition", "all 0.3s ease")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .style("text-decoration", "underline") // Underline on hover
          .style("font-size", "9px"); // Slightly increase the size
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .style("text-decoration", "none") // Remove underline when not hovering
          .style("font-size", "8px"); // Reset font size
      })
      .on("click", (event, d) => {
        setSubject(d);
      });
  }, [data, labels, k, j, height]);

  return (
    <>
      <div
        className="flex h-[50px] mb-2"
        style={{
          maxHeight: "50px", // Fixed height for the container
          overflowY: "auto", // Enable vertical scrolling
        }}
      >
        <svg ref={svgRef} className=""></svg>
      </div>
    </>
  );
};

export default ClusterDistribution;
