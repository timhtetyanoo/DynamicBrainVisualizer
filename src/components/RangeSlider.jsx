import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import ColorScale from "./ColorScale";
import { DataContext } from "../contexts/DataContext";
import { useState, useContext } from "react";

const RangeSlider = ({
  width,
  minValue,
  maxValue,
  threshold,
  setThreshold,
  isRelativeColor,
}) => {
  const minDistance = maxValue / 10;

  // const [threshold, setThreshold] = useState([minValue, maxValue]);
  const handleChange = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return;
    }
    if (newValue[1] - newValue[0] < minDistance) {
      if (activeThumb === 0) {
        const clamped = Math.min(newValue[0], 100 - minDistance);
        setThreshold([clamped, clamped + minDistance]);
      } else {
        const clamped = Math.max(newValue[1], minDistance);
        setThreshold([clamped - minDistance, clamped]);
      }
    } else {
      setThreshold(newValue);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center">{isRelativeColor ? "Relative" : ""} Max</p>
      <Stack
        sx={{
          height: 200,
        }}
        spacing={1}
        direction="row"
        justifyContent="center"
      >
        <Slider
          sx={{
            '& input[type="range"]': {
              // WebkitAppearance: "slider-vertical",
            },
            "& .MuiSlider-thumb": {
              color: "gray",
            },
            "& .MuiSlider-track": {
              color: "gray",
            },
            "& .MuiSlider-rail": {
              color: "gray",
            },
            "& .MuiSlider-active": {
              color: "gray",
            },
            "& .MuiSlider-mark": {
              color: "gray",
            },
          }}
          value={threshold}
          orientation="vertical"
          step={maxValue / 10}
          size="small"
          min={minValue}
          max={maxValue}
          marks
          valueLabelDisplay="auto"
          onChange={handleChange}
          disableSwap
        />
        <ColorScale width={10} height={200} />
      </Stack>

      <p className="text-center">{isRelativeColor ? "Relative" : ""} Min</p>
    </div>
  );
};
export default RangeSlider;
