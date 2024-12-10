import { useEffect, useState, useRef, useMemo } from "react";
import Heatmap from "./Heatmap";
import RangeSlider from "./RangeSlider";
import Window from "./Window";
import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";
import {
  reconstructMatrix,
  getMinMaxValues,
  filterData,
  createColorScale,
} from "../helpers/util";
import ClusterDistribution from "./ClusterDistribution";
import DemographicHistogram from "./DemographicDistribution";
import {
  BUTTON_STYLE,
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
  SELECTED_COLOR,
} from "../helpers/constants";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
const ConnectivityState = ({
  id,
  group,
  method,
  threshold,
  isRelativeColor,
  visType,
  state,
  setState,
  nrWindows,
  setSubject,
  showDifference,
  setStateData,
}) => {
  const { jsonData, minValue, maxValue, colorScale } = useContext(DataContext);

  const demographics = jsonData.demographicsData;
  const margin = { top: 30, right: 10, bottom: 0, left: 35 };
  const labels = jsonData.labels;

  const [selectedDemographics, setSelectedDemographic] = useState([]);
  const [width, setWidth] = useState(0);

  const componentRef = useRef(null);
  const heatmapRef = useRef(null);

  const addSubjects = (subjects) => {
    setSelectedDemographic([...selectedDemographics, ...subjects]);
  };
  const removeSubjects = (subjects) => {
    setSelectedDemographic(
      selectedDemographics.filter((subject) => !subjects.includes(subject))
    );
  };
  const handleDownloadImage = async () => {
    // Use a higher scale for better resolution
    const canvas = await html2canvas(componentRef.current, {
      scale: 2, // Increase the scale to improve resolution
      useCORS: true, // Allow cross-origin images (if needed)
    });

    // Convert the canvas to a Blob and download the image
    canvas.toBlob((blob) => {
      saveAs(blob, "connectivity-state.png");
    });
  };

  const aggregateGroup = (group) => {
    if (group.length === 0)
      return { averages: [], medians: [], minimums: [], maximums: [] };

    const arrayLength = group[0].length;

    // Initialize sums array and count of valid (non-null) values
    const sums = new Array(arrayLength).fill(0);
    const counts = new Array(arrayLength).fill(0);

    const mins = new Array(arrayLength).fill(Infinity);
    const maxs = new Array(arrayLength).fill(-Infinity);

    // Initialize an array to store all values by index
    const valuesByIndex = Array.from({ length: arrayLength }, () => []);

    group.forEach((array) => {
      array.forEach((value, index) => {
        if (value !== null) {
          sums[index] += value;
          counts[index] += 1;
          valuesByIndex[index].push(value);

          mins[index] = Math.min(mins[index], value);
          maxs[index] = Math.max(maxs[index], value);
        }
      });
    });

    // Compute the average for each element
    const averages = sums.map((sum, index) => {
      return counts[index] === 0 ? null : sum / counts[index];
    });

    // Compute the median for each element
    const medians = valuesByIndex.map((values) => {
      if (values.length === 0) return null;

      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);

      // If the length is odd, return the middle element
      // If even, return the average of the two middle elements
      return values.length % 2 !== 0
        ? values[mid]
        : (values[mid - 1] + values[mid]) / 2;
    });

    const minimums = mins.map((min, index) =>
      counts[index] === 0 ? null : min
    );
    const maximums = maxs.map((max, index) =>
      counts[index] === 0 ? null : max
    );

    return { averages, medians, minimums, maximums };
  };

  const filteredGroup = useMemo(() => {
    return group.filter((d) => {
      if (selectedDemographics.length === 0) return true;
      return selectedDemographics.includes(d.subject);
    });
  }, [group, selectedDemographics]);

  const aggregatedData = useMemo(() => {
    return aggregateGroup(filteredGroup.map((d) => d.value));
  }, [filteredGroup]);

  const data = useMemo(() => {
    let result = aggregatedData;
    if (method === "Median") result = aggregatedData.medians;
    if (method === "Average") {
      result = aggregatedData.averages;
    }
    if (method === "Minimum") result = aggregatedData.minimums;
    if (method === "Maximum") result = aggregatedData.maximums;
    result = result.map((value) =>
      value !== null ? parseFloat(value.toFixed(5)) : null
    );
    return result;
  }, [aggregatedData, method]);

  useEffect(() => {
    setStateData(data);
  }, [data]);
  const minmaxVal = getMinMaxValues(
    data.flat().map((value) => (value != 0 ? value : null))
  );
  const colorScaleRel = createColorScale(
    minmaxVal.minValue,
    minmaxVal.maxValue
  );
  // console.log("minValue", minmaxVal.minValue);
  // console.log("maxValue", minmaxVal.maxValue);

  const currentColorScale = useMemo(
    () => (isRelativeColor ? colorScaleRel : colorScale),
    [isRelativeColor, colorScale, colorScaleRel]
  );

  // console.log("colorScale", currentColorScale(minmaxVal.maxValue));

  // const filteredData = useMemo(() => {
  //   const min = isRelativeColor ? minmaxVal.minValue : minValue;
  //   const max = isRelativeColor ? minmaxVal.maxValue : maxValue;
  //   return filterData(data, min, max, threshold[0], threshold[1]);
  // }, [threshold, data]);

  const filteredData = useMemo(() => {
    const range = minmaxVal.maxValue - minmaxVal.minValue;
    const minThreshold = isRelativeColor
      ? minmaxVal.minValue + (threshold[0] / 100) * range
      : threshold[0];
    const maxThreshold = isRelativeColor
      ? minmaxVal.minValue + (threshold[1] / 100) * range
      : threshold[1];
    return filterData(data, 0, 1, minThreshold, maxThreshold);
  }, [threshold, data]);

  console.log(filteredData);

  const filteredSubjects = new Set(
    filteredGroup.map((item) => `${item.subject}`)
  );
  const numSubjects = filteredSubjects.size;
  const numWindows = filteredGroup.length;

  return (
    <div ref={componentRef} className="flex flex-col w-full">
      <div className="flex gap-2 justify-center items-center">
        <p className="text-xs mx-4"># Subjects: {numSubjects}</p>
        <p className="text-xs mr-4">|</p>
        <p className="text-xs"># Windows: {numWindows}</p>
        {/* <button className={BUTTON_STYLE} onClick={handleDownloadImage}>
          Download as Image
        </button> */}
      </div>
      <DemographicHistogram
        id={id}
        group={group}
        demographicData={demographics}
        state={state}
        setState={setState}
        selectedDemographics={selectedDemographics}
        addSubjects={addSubjects}
        removeSubjects={removeSubjects}
      />
      <ClusterDistribution
        id={id}
        group={filteredGroup}
        nrWindows={nrWindows}
        setSubject={setSubject}
      />
      <div className="flex justify-center">
        {!showDifference && (
          <Window
            key={isRelativeColor ? "relative" : "overall"}
            index={method}
            data={filteredData}
            labels={labels}
            colorScale={currentColorScale}
            visType={visType}
            margin={margin}
            width={250}
            height={250}
          />
        )}
        {/* <RangeSlider
          sliderWidth={100}
          stepSize={10}
          threshold={threshold}
          setThreshold={setThreshold}
        /> */}
      </div>
    </div>
  );
};

export default ConnectivityState;
