import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

const LassoTool = () => {
  // create 5500 circles
  const [circles, setCircles] = useState(
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      cx: Math.random() * 600,
      cy: Math.random() * 600,
      r: 5,
      selected: false,
    }))
  );

  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoPath, setLassoPath] = useState([]);
  const svgRef = useRef(null);

  // Effect to handle drawing and updating the circles and lasso
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Draw circles
    const circlesSelection = svg
      .selectAll("circle")
      .data(circles, (d) => d.id)
      .join("circle")
      .attr("cx", (d) => d.cx)
      .attr("cy", (d) => d.cy)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => (d.selected ? "blue" : "gray"))
      .attr("class", "cursor-pointer");

    // Draw the lasso if it exists
    if (lassoPath.length > 1) {
      svg
        .selectAll("polygon")
        .data([lassoPath])
        .join("polygon")
        .attr("points", (d) => d.map((p) => p.join(",")).join(" "))
        .attr("class", "lasso-stroke")
        .attr("fill", "rgba(0, 0, 255, 0.2)");
    } else {
      svg.selectAll("polygon").remove();
    }
  }, [circles, lassoPath]);

  const startLasso = (e) => {
    setIsLassoing(true);
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLassoPath([[x, y]]);
  };

  const updateLasso = (e) => {
    if (!isLassoing) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLassoPath((prevPath) => [...prevPath, [x, y]]);
  };

  const endLasso = () => {
    if (!isLassoing) return;
    setIsLassoing(false);
    const path = lassoPath;
    if (path.length < 2) return;

    const isInsideLasso = (cx, cy) => {
      let inside = false;
      for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
        const xi = path[i][0],
          yi = path[i][1];
        const xj = path[j][0],
          yj = path[j][1];
        const intersect =
          yi > cy !== yj > cy && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    setCircles(
      circles.map((circle) => ({
        ...circle,
        selected: isInsideLasso(circle.cx, circle.cy),
      }))
    );
    setLassoPath([]);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        className="w-[600px] h-[600px] border border-gray-400"
        onMouseDown={startLasso}
        onMouseMove={updateLasso}
        onMouseUp={endLasso}
      ></svg>
    </div>
  );
};

export default LassoTool;
