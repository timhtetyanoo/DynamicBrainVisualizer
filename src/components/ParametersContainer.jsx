import { useState, useContext } from "react";
import RangeSlider from "./RangeSlider";
import ColorScale from "./ColorScale";
import { DataContext } from "../contexts/DataContext";
import { SubjectViewContext } from "../pages/SubjectView";

const ParametersContainer = () => {
  const {
    threshold,
    setThreshold,
    minColor,
    setMinColor,
    maxColor,
    setMaxColor,
  } = useContext(SubjectViewContext);

  const [minCol, setMinCol] = useState(minColor);
  const [maxCol, setMaxCol] = useState(maxColor);
  return (
    <div className="flex h-full justify-center ml-4 p-2 bg-gray-700 ">
      <RangeSlider threshold={threshold} setThreshold={setThreshold} />
      <div className="flex flex-col items-center">
        <ColorScale
          width={30}
          height={200}
          minColor={minColor}
          maxColor={maxColor}
          setMinColor={setMinColor}
          setMaxColor={setMaxColor}
        />
      </div>
    </div>
  );
};

export default ParametersContainer;
