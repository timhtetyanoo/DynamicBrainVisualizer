import React, { useEffect, useRef, useState, useContext } from "react";
import { DataContext } from "../contexts/DataContext";
import { SettingsContext } from "../contexts/SettingsContext";
import * as d3 from "d3";
import {
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
  LABELS_FONT_SIZE,
} from "../helpers/constants";

const DemographicHistogram = ({
  id,
  group,
  demographicData,
  state,
  setState,
  selectedDemographics,
  addSubjects,
  removeSubjects,
}) => {
  const { jsonData } = useContext(DataContext);
  const demographicsCategories = jsonData.demographicsCategories;
  const demographics = jsonData.demographicsColumns;
  const subjectIds = Array.from(new Set(group.map((item) => item.subject)));

  const { settings } = useContext(SettingsContext);

  const h = 130;
  const svgRef = useRef(null);
  const [selectedDemographic, setSelectedDemographic] = useState("group"); // Default to the first demographic
  const [numBins, setNumBins] = useState(10); // Default number of bins
  const [selectedBins, setSelectedBins] = useState([]);
  const selectBins = (i) => {
    // Toggle bin selection
    setSelectedBins(
      (prevSelected) =>
        prevSelected.includes(i)
          ? prevSelected.filter((binIndex) => binIndex !== i) // Deselect
          : [...prevSelected, i] // Select
    );
  };

  useEffect(() => {
    setSelectedBins([]);
    removeSubjects(selectedDemographics);
  }, [selectedDemographic, group]);
  useEffect(() => {
    const w = svgRef.current.getBoundingClientRect().width;

    // Set dimensions and margins for the chart
    const margin = { top: 2, right: 10, bottom: 30, left: 35 },
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", "90%")
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!selectedDemographic || subjectIds.length === 0) return;

    // Extract the data for the selected demographic
    const data = subjectIds.map((id) => ({
      id, // Subject ID
      value: demographicData[id][selectedDemographic], // Demographic value for each subject
    }));

    const nullData = data.filter((d) => d.value == null);
    const validData = data.filter((d) => d.value != null);

    // Check if we have valid data
    const hasValidData = validData.length > 0;

    // If there are no valid data points, we can still draw the null bar
    if (!hasValidData) {
      // Draw the null bar
      const y = d3
        .scaleLinear()
        .domain([0, nullData.length])
        .range([height, 0]);

      svg
        .append("rect")
        .attr("x", -30) // Position it at the end
        .attr("y", y(nullData.length))
        .attr("width", 15) // Fixed width for null bin
        .attr("height", height - y(nullData.length))
        .attr(
          "fill",
          selectedBins.includes(null)
            ? id == 1
              ? CLUSTER1_COLOR
              : CLUSTER2_COLOR
            : "#4444"
        )
        .style("cursor", "pointer")
        .on("click", () => {
          selectBins(null);
          if (selectedBins.includes(null)) {
            removeSubjects(nullData.map((d) => d.id));
          } else {
            addSubjects(nullData.map((d) => d.id));
          }
        });

      svg
        .append("text")
        .attr("x", -25)
        .attr("y", height + 10)
        .attr("text-anchor", "middle")
        .attr("font-size", LABELS_FONT_SIZE)
        .text("Null");

      return; // Early return if there's no valid data
    }

    const isNumerical = typeof validData[0].value === "number";

    if (isNumerical) {
      // Numerical data handling...
      const x = d3
        .scaleLinear()
        .domain([0, d3.max(validData, (d) => d.value) * 1.1])
        .range([0, width])
        .nice();

      const histogram = d3
        .bin()
        .value((d) => d)
        .domain(x.domain())
        .thresholds(x.ticks(numBins));

      const bins = histogram(validData.map((d) => d.value));

      if (bins.length > 0) {
        bins[bins.length - 1].x1 = bins[bins.length - 1].x0 + bins[0].x1;
      }

      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max([...bins, { length: nullData.length }], (d) => d.length),
        ])
        .range([height, 0]);

      const xAxis = d3
        .axisBottom(x)
        .ticks(Math.min(10, numBins))
        .tickFormat(d3.format("d"));

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("font-size", LABELS_FONT_SIZE);

      const yAxis = d3
        .axisLeft(y)
        .ticks(
          Math.min(
            10,
            d3.max(bins, (d) => d.length)
          )
        ) // Set reasonable number of y-axis ticks
        .tickFormat(d3.format("d"));
      svg
        .append("g")
        .call(yAxis)
        .selectAll("text")
        .attr("font-size", LABELS_FONT_SIZE);

      svg
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.x0))
        .attr("y", (d) => y(d.length))
        .attr("width", (d) => x(d.x1) - x(d.x0))
        .attr("height", (d) => height - y(d.length))
        .attr("fill", (d) =>
          selectedBins.includes(d.x0)
            ? id == 1
              ? CLUSTER1_COLOR
              : CLUSTER2_COLOR
            : "#4444"
        )
        .attr("stroke-width", "1px")
        .attr("stroke", "white")

        .style("cursor", "pointer")
        .on("click", (event, d, i) => {
          selectBins(d.x0);
          const subjectsInBin = data
            .filter((subject) => subject.value >= d.x0 && subject.value < d.x1)
            .map((subject) => subject.id);

          if (selectedBins.includes(d.x0)) removeSubjects(subjectsInBin);
          else addSubjects(subjectsInBin);
        });
      svg
        .append("rect")
        .attr("x", -30) // Position it at the end
        .attr("y", y(nullData.length))
        .attr("width", 15) // Fixed width for null bin
        .attr("height", height - y(nullData.length))
        .attr("fill", (d) =>
          selectedBins.includes(null)
            ? id == 1
              ? CLUSTER1_COLOR
              : CLUSTER2_COLOR
            : "#4444"
        )
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          selectBins(null);
          if (selectedBins.includes(null))
            removeSubjects(nullData.map((d) => d.id));
          else addSubjects(nullData.map((d) => d.id));
        });
      svg
        .append("text")
        .attr("x", -25)
        .attr("y", height + 10)
        .attr("text-anchor", "middle")
        .attr("font-size", LABELS_FONT_SIZE)
        .text("Null");
    } else {
      // For categorical data
      // const categories = Array.from(
      //   new Set(data.map((d) => (d.value ? d.value : "Null")))
      // );
      const categories = demographicsCategories[selectedDemographic];
      const counts = categories.map((category) => ({
        category,
        count: data.filter((d) => {
          if (category === "Null") return d.value == null;
          return d.value === category;
        }).length,
      }));

      const x = d3
        .scaleBand()
        .domain(categories)
        .range([0, width])
        .padding(0.1);

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("font-size", LABELS_FONT_SIZE);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(counts, (d) => d.count) * 1.1])
        .range([height, 0]);

      svg.append("g").call(d3.axisLeft(y).ticks(5));

      svg
        .selectAll("rect")
        .data(counts)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.category))
        .attr("y", (d) => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.count))
        .attr("fill", (d, i) => {
          return selectedBins.includes(d.category)
            ? id == 1
              ? CLUSTER1_COLOR
              : CLUSTER2_COLOR
            : "#4444";
        })
        .style("cursor", "pointer")
        .on("click", (event, d, i) => {
          selectBins(d.category);
          const subjectsInCategory = data
            .filter((subject) => {
              if (d.category === "Null") return subject.value == null;
              return subject.value === d.category;
            })
            .map((subject) => subject.id);
          if (selectedBins.includes(d.category))
            removeSubjects(subjectsInCategory);
          else addSubjects(subjectsInCategory);
        });
    }
  }, [group, demographicData, selectedDemographic, numBins, selectedBins]);

  return (
    <div className="flex flex-col justify-center items-center">
      {/* Dropdown to select demographic */}
      <div className="mb-1">
        <button
          style={{ backgroundColor: id == 1 ? CLUSTER1_COLOR : CLUSTER2_COLOR }}
          className={
            state === id
              ? "text-sm font-semibold mb-2 text-white px-2 py-1 mr-1 rounded opacity-100"
              : "text-sm font-semibold mb-2 text-white px-2 py-1 mr-1 rounded opacity-50"
          }
          onClick={() => setState(id)}
        >
          Select
        </button>
        <label htmlFor="demographic-select" className="text-xs mr-2 font-bold">
          Demographic:
        </label>

        <select
          id="demographic-select"
          className="w-24 border border-gray-300 p-1 rounded text-xs overflow-hidden truncate whitespace-nowrap"
          value={selectedDemographic}
          onChange={(e) => setSelectedDemographic(e.target.value)}
        >
          {demographics.map((demo) => (
            <option key={demo} value={demo} className="truncate" title={demo}>
              {demo}
            </option>
          ))}
        </select>
      </div>

      {/* SVG container for D3 histogram */}
      <svg ref={svgRef}></svg>
      {settings["Number of Bins for Histogram"] && (
        <div className="flex mb-1 text-xs">
          <label htmlFor="bins-slider" className="mr-2 font-bold">
            Bins:
          </label>
          <input
            id="bins-slider"
            type="range"
            min="5"
            max="50"
            value={numBins}
            onChange={(e) => setNumBins(+e.target.value)}
            className="w-32 appearance-none h-2 rounded-lg"
            style={{
              background: `linear-gradient(to right, #8888 0%, #8888 ${
                ((numBins - 5) * 100) / 45
              }%, #e5e7eb ${((numBins - 5) * 100) / 45}%, #e5e7eb 100%)`,
            }}
          />
          <span className="ml-2">{numBins}</span>
          <style>
            {`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background-color: #8888; /* Thumb color */
            cursor: pointer;
          }

          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background-color: #8888; /* Thumb color */
            cursor: pointer;
          }

          input[type="range"]::-ms-thumb {
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background-color: #8888; /* Thumb color */
            cursor: pointer;
          }
        `}
          </style>
        </div>
      )}
    </div>
  );
};

export default DemographicHistogram;
