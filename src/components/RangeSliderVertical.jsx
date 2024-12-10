import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";

const RangeSlider = ({ width, stepSize, threshold, setThreshold }) => {
  const minDistance = 10;

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
    <div className="flex text-center gap-2">
      <p>Min</p>
      <Box sx={{ width: width }}>
        <Slider
          value={threshold}
          step={stepSize}
          size="small"
          marks
          valueLabelDisplay="auto"
          onChange={handleChange}
          disableSwap
        />
      </Box>
      <p>Max</p>
    </div>
  );
};
export default RangeSlider;
