import { useState, useContext } from "react";
import { SubjectViewContext } from "../pages/SubjectView";
import { createColorScale } from "../helpers/util";

const ColorScale = ({ minValue = 0, maxValue = 100, width, height }) => {
  const colorScale = createColorScale(minValue, maxValue);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height}>
        <defs>
          {/* Define the gradient within <defs> element */}
          <linearGradient id="colorGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            {colorScale.ticks(10).map((value, index) => (
              <stop
                key={index}
                offset={
                  ((value - minValue) / (maxValue - minValue)) * 100 + "%"
                }
                stopColor={colorScale(value)}
              />
            ))}
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill={`url(#colorGradient)`} />
      </svg>
    </div>
  );
};

export default ColorScale;
