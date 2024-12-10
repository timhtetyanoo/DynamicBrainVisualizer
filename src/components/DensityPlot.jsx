import React, { useEffect, useRef } from "react";
import { select, scaleLinear, max, zoomIdentity } from "d3";
import { hexbin } from "d3-hexbin";

const DensityPlot = ({ data, width, height, zoomTransform }) => {
  const svgRef = useRef(null);
  const zoomTransformRef = useRef(zoomIdentity); // Reference for current zoom state

  useEffect(() => {
    // Set up SVG and group only once
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    let group = svg.select("g");
    if (group.empty()) {
      group = svg.append("g");
    }

    // Reformat the data for d3.hexbin()
    const inputForHexbinFun = data.map((d) => [d[0], d[1]]); // Simpler

    // Adjust the color palette
    const hexbinGenerator = hexbin()
      .radius(9)
      .extent([
        [0, 0],
        [width, height],
      ]);

    const hexbinData = hexbinGenerator(inputForHexbinFun);

    const color = scaleLinear()
      .domain([0, max(hexbinData, (d) => d.length)])
      .range(["transparent", "#69b3a2"]);

    // Bind data to the paths and apply the update pattern
    const hexagons = group.selectAll("path").data(hexbinData);

    // Handle the update phase
    hexagons.join(
      (enter) =>
        enter
          .append("path")
          .attr("d", hexbinGenerator.hexagon())
          .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
          .attr("fill", (d) => color(d.length))
          .attr("stroke", "black")
          .attr("stroke-width", "0.1"),
      (update) =>
        update
          .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
          .attr("fill", (d) => color(d.length)),
      (exit) => exit.remove() // Remove any paths no longer bound to data
    );

    if (zoomTransform) {
      group.attr("transform", zoomTransform); // Apply zoom transform directly
    }
  }, [data, width, height, zoomTransform]);

  return <svg ref={svgRef}></svg>;
};

export default DensityPlot;

// import React, { useEffect, useRef, useContext } from "react";
// import { select, scaleLinear, max, zoom, zoomIdentity } from "d3";
// import { hexbin } from "d3-hexbin";
// import { DataContext } from "../contexts/DataContext";

// const DensityPlot = ({
//   data,
//   width,
//   height,
//   demographics,
//   selectedDemographics,
//   selectedDemographicCategory,
//   setSelectedDemographicCategory,
//   zoomTransform,
//   onZoomChange,
// }) => {
//   const { demographicsCategories, demographicsType } = useContext(DataContext);
//   const colorCategories = demographicsCategories[selectedDemographics];

//   const svgRef = useRef(null);
//   const zoomTransformRef = useRef(zoomIdentity); // Reference for current zoom state

//   useEffect(() => {
//     // Set up SVG and group only once
//     const svg = select(svgRef.current)
//       .attr("width", width)
//       .attr("height", height)
//       .style("border", "1px solid black");

//     let group = svg.select("g");
//     if (group.empty()) {
//       group = svg.append("g");
//     }
//     if (selectedDemographicCategory !== "All") {
//       data = data.filter(
//         (d) =>
//           demographics[d.subject][selectedDemographics] ===
//           selectedDemographicCategory
//       );
//     }
//     const inputData = data.map((d) => [d.cx, d.cy]);

//     // Reformat the data for d3.hexbin()
//     const inputForHexbinFun = inputData.map((d) => [d[0], d[1]]);

//     // Adjust the color palette
//     const hexbinGenerator = hexbin()
//       .radius(5)
//       .extent([
//         [0, 0],
//         [width, height],
//       ]);

//     const hexbinData = hexbinGenerator(inputForHexbinFun);

//     const color = scaleLinear()
//       .domain([0, max(hexbinData, (d) => d.length)])
//       .range(["transparent", "#69b3a2"]);

//     // Bind data to the paths and apply the update pattern
//     const hexagons = group.selectAll("path").data(hexbinData);

//     // Handle the update phase
//     hexagons.join(
//       (enter) =>
//         enter
//           .append("path")
//           .attr("d", hexbinGenerator.hexagon())
//           .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
//           .attr("fill", (d) => color(d.length))
//           .attr("stroke", "black")
//           .attr("stroke-width", "0.1"),
//       (update) =>
//         update
//           .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
//           .attr("fill", (d) => color(d.length)),
//       (exit) => exit.remove() // Remove any paths no longer bound to data
//     );

//     let legendGroup = svg.select(".legend");
//     if (legendGroup.empty()) {
//       legendGroup = svg.append("g").attr("class", "legend");
//     }

//     // Clear old legend items
//     legendGroup.selectAll("*").remove();

//     legendGroup
//       .append("g")
//       .attr("transform", `translate(${width - 100}, 15)`)
//       .append("text")
//       .text(selectedDemographics.toUpperCase())
//       .attr("font-weight", "bold")
//       .attr("cursor", "pointer")
//       .on("click", () => setSelectedDemographicCategory("All"))
//       .on("mouseover", function () {
//         select(this).attr("font-size", "18px");
//       })
//       .on("mouseout", function () {
//         select(this).attr("font-size", "16px");
//       });
//     colorCategories.forEach((category, i) => {
//       const legendRow = legendGroup
//         .append("g")
//         .attr("transform", `translate(${width - 100}, ${20 + i * 15})`);

//       legendRow
//         .append("text")
//         .attr("x", 15)
//         .attr("y", 5)
//         .text(category)
//         .attr("font-size", "12px")
//         .attr("alignment-baseline", "middle");

//       legendRow
//         .attr("cursor", "pointer")
//         .on("click", () => setSelectedDemographicCategory(category))
//         .on("mouseover", function () {
//           select(this).select("text").attr("font-size", "16px");
//         })
//         .on("mouseout", function () {
//           select(this).select("text").attr("font-size", "12px");
//         });
//     });
//     // Zoom behavior
//     // const zoomBehavior = zoom()
//     //   .scaleExtent([0.5, 20]) // Zoom limits
//     //   .on("zoom", (event) => {
//     //     const transform = event.transform;
//     //     zoomTransformRef.current = transform;

//     //     // Sync zoom with the parent component
//     //     onZoomChange(transform);

//     //     // Apply the transform to the group of hexagons
//     //     group.attr("transform", transform);
//     //   });

//     // // Store zoom behavior in ref and apply it to the svg
//     // svg.call(zoomBehavior);

//     // If there's a zoomTransform passed from the parent (e.g., from ScatterPlot zoom), apply it
//     if (zoomTransform) {
//       group.attr("transform", zoomTransform); // Apply zoom transform directly
//     }
//   }, [data, width, height, zoomTransform, onZoomChange]);

//   return <svg ref={svgRef}></svg>;
// };

// export default DensityPlot;
