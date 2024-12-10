import { useContext, useState, useEffect, useRef } from "react";
import { DataContext } from "../../contexts/DataContext";
import GroupInfo from "../../components/GroupInfo";
import { toast } from "react-toastify";
import axios from "axios";
import {
  processDRData,
  reconstructMatrix,
  processData,
  getMinMaxValues,
  filterData,
} from "../../helpers/util";
import GroupParameters from "../../components/GroupParameters";
import GroupStates from "../../components/GroupStates";
import Spinner from "../../components/Spinner";
import ScatterPlot from "../../components/ScatterPlot";
import DensityPlot from "../../components/DensityPlot";
import {
  BUTTON_STYLE,
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
} from "../../helpers/constants";
import ClusterWindows from "../../components/ClusterWindows";
import DRPlot from "../../components/DRPlot";

const GroupView = ({
  setSelectedSubjectA,
  setSelectedSubjectB,
  setStartWindowA,
  setStartWindowB,
  selectedWindowsA,
  selectedWindowsB,
  subjectsData,
  nrWindows,
}) => {
  const scatterPlotRef = useRef(null);
  const [scatterPlotSize, setScatterPlotSize] = useState(0);
  const [clustering, setClustering] = useState(true);
  const [clickedWindow, setClickedWindow] = useState(null);
  const [hoveredWindow, setHoveredWindow] = useState(null);

  const { jsonData, windowSize, stepSize, patientIDs, controlIDs } =
    useContext(DataContext);
  const directed = jsonData.directed;
  const labels = jsonData.labels;
  const demographics = jsonData.demographicsData;

  const nrPatients = jsonData.numPatients;
  const nrControls = jsonData.numControls;
  const windowSizes = jsonData ? Object.keys(jsonData.windowSizes) : [];

  const savedStates = JSON.parse(localStorage.getItem("DRData")) || {};

  const [openGroupParameters, setOpenGroupParameters] = useState(true);

  const [reducedData, setReducedData] = useState(savedStates.reducedData || []);
  const [DRData, setDRData] = useState(savedStates.DRData || []);
  const [currentWindowSize, setCurrentWindowSize] = useState(
    savedStates.currentWindowSize
  );
  const [currentStepSize, setCurrentStepSize] = useState(
    savedStates.currentStepSize
  );
  const [features, setFeatures] = useState(
    Object.fromEntries(
      labels.flatMap((l1) =>
        labels
          .filter((l2) => l1 !== l2) // Exclude same labels
          .map((l2) => [`${l1}_${l2}`, true])
      )
    )
  );
  const [umapParams, setUmapParams] = useState({
    n_neighbors: 15,
    min_dist: 0.1,
    metric: "cosine",
  });
  const [preprocessParams, setPreprocessParams] = useState({
    normalize: false,
    binarize: false,
  });
  const [loading, setLoading] = useState(false);

  const [selectedState, setSelectedState] = useState(1);

  const [selectedGroup1, setSelectedGroup1] = useState([]);
  const [selectedGroup2, setSelectedGroup2] = useState([]);
  const [selectedGroup1Data, setSelectedGroup1Data] = useState([]);
  const [selectedGroup2Data, setSelectedGroup2Data] = useState([]);

  subjectsData = processDRData(subjectsData);
  const inputData = subjectsData.map((item) => item.value);

  const patientsData = subjectsData
    .filter((item) => patientIDs.includes(item.subject))
    .map((item) => {
      return item.value;
    });

  const averagePatientsData = patientsData
    .reduce((acc, curr) => {
      curr.forEach((value, index) => {
        if (acc[index] === undefined) {
          acc[index] = 0;
        }
        acc[index] += value;
      });
      return acc;
    }, [])
    .map((sum) => sum / patientsData.length); // Divide each sum by the number of arrays

  const controlsData = subjectsData
    .filter((item) => controlIDs.includes(item.subject))
    .map((item) => {
      return item.value;
    });
  const averageControlsData = controlsData
    .reduce((acc, curr) => {
      curr.forEach((value, index) => {
        if (acc[index] === undefined) {
          acc[index] = 0;
        }
        acc[index] += value;
      });

      return acc;
    }, [])
    .map((sum) => sum / controlsData.length); // Divide each sum by the number of arrays

  const processSelectedGroup = (selectedGroup) => {
    return selectedGroup.map((item) => {
      if (item === null)
        return {
          id: null,
          subject: null,
          window: null,
          value: null,
        };
      const foundItem = subjectsData.find((i) => i.id === item.id);
      if (foundItem) {
        return {
          ...foundItem,
          value: reconstructMatrix(foundItem.value, directed, labels.length),
        };
      }
      return undefined;
    });
  };

  const setProcessedData = (data) => {
    const processedData = subjectsData.map((item, index) => {
      return {
        ...item,
        value: data[index],
      };
    });
    setDRData(processedData);
  };
  const fetchData = async () => {
    setSelectedGroup1([]);
    setSelectedGroup2([]);
    setSelectedGroup1Data([]);
    setSelectedGroup2Data([]);
    setSelectedState(1);
    setLoading(true);

    const keys = Object.keys(features);
    const indicesToRemove = keys
      .map((key, index) => (features[key] === false ? index : -1))
      .filter((index) => index !== -1);

    //Changing this block
    let filteredInputData = inputData.map((subArray) =>
      subArray.filter((_, index) => !indicesToRemove.includes(index))
    );

    const jsonData = {
      data: filteredInputData,
      umap_params: umapParams,
      preprocess_params: preprocessParams,
    };

    console.log("umapParams", umapParams);
    console.log("preprocessParams", preprocessParams);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/dimensionality_reduction",
        jsonData,
        { headers: { "Content-Type": "application/json" } } // Ensure headers are set correctly
      );
      // Check if response data is in the expected format
      if (Array.isArray(response.data)) {
        if (response.data.length !== filteredInputData.length) {
          console.error(
            "Unexpected response format: length mismatch",
            response.data
          );
          toast.error("Unexpected response format: length mismatch");
        } else {
          setProcessedData(response.data);
          setReducedData(response.data);
          toast.success("Dimensionality Reduction Computed Successfully!");
        }
      } else {
        console.error("Unexpected response format", response.data);
        toast.error("Unexpected response format");
      }
      setCurrentWindowSize(windowSize);
      setCurrentStepSize(stepSize);
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast.error("Error Computing Dimensionality Reduction");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setReducedData([]);
    setDRData([]);
    setSelectedGroup1([]);
    setSelectedGroup2([]);
    setSelectedGroup1Data([]);
    setSelectedGroup2Data([]);
    setSelectedState(1);
    setClickedWindow(null);
    setHoveredWindow(null);
  }, [windowSize, stepSize]);
  useEffect(() => {
    localStorage.setItem(
      "DRData",
      JSON.stringify({
        reducedData,
        DRData,
        currentWindowSize,
        currentStepSize,
        preprocessParams,
        umapParams,
      })
    );
  }, [reducedData]);
  useEffect(() => {
    if (selectedGroup1.length > 0) {
      setSelectedGroup1Data(processSelectedGroup(selectedGroup1));
    } else {
      setSelectedGroup1Data([]);
    }
    if (selectedGroup2.length > 0) {
      setSelectedGroup2Data(processSelectedGroup(selectedGroup2));
    } else {
      setSelectedGroup2Data([]);
    }
  }, [selectedGroup1, selectedGroup2]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const newWidth = Math.min(
          entries[0].contentRect.width,
          entries[0].contentRect.height
        );
        setScatterPlotSize(newWidth); // Update size when the container's width changes
      }
    });

    // Observe the parent container for size changes
    if (scatterPlotRef.current) {
      resizeObserver.observe(scatterPlotRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (scatterPlotRef.current) {
        resizeObserver.unobserve(scatterPlotRef.current);
      }
    };
  }, []);

  return (
    <div className="flex justify-between h-full">
      {/* Conditionally render GroupParameters based on isCollapsed */}
      <div className="flex">
        {openGroupParameters && (
          <GroupParameters
            umapParams={umapParams}
            setUmapParams={setUmapParams}
            preprocessParams={preprocessParams}
            setPreprocessParams={setPreprocessParams}
            features={features}
            setFeatures={setFeatures}
            subjectsData={subjectsData}
            fetchData={fetchData}
          />
        )}
        <div className="flex">
          {/* Button to toggle collapse */}
          <button
            onClick={() => setOpenGroupParameters(!openGroupParameters)}
            className="bg-gray-200 p-2 rounded-md"
          >
            {openGroupParameters ? "<" : ">"}
          </button>
        </div>
      </div>

      <div ref={scatterPlotRef} className="flex  w-full items-center h-full">
        {loading ? (
          <Spinner loading={loading} />
        ) : (
          <>
            {DRData && DRData.length !== 0 && (
              <>
                <ScatterPlot
                  size={scatterPlotSize || 400}
                  data={DRData}
                  demographics={demographics}
                  setSubjectA={setSelectedSubjectA}
                  setSubjectB={setSelectedSubjectB}
                  setWindowA={setStartWindowA}
                  setWindowB={setStartWindowB}
                  selectedWindowsA={selectedWindowsA}
                  selectedWindowsB={selectedWindowsB}
                  selectedGroup1={selectedGroup1}
                  setSelectedGroup1={setSelectedGroup1}
                  selectedGroup2={selectedGroup2}
                  setSelectedGroup2={setSelectedGroup2}
                  setClickedWindow={setClickedWindow}
                  setHoveredWindow={setHoveredWindow}
                  state={selectedState}
                />
              </>
            )}
          </>
        )}
      </div>
      {/* <div className="flex justify-center">
        <button
          className={BUTTON_STYLE}
          style={
            clustering
              ? {
                  backgroundColor:
                    selectedState == 1 ? CLUSTER1_COLOR : CLUSTER2_COLOR,
                }
              : { backgroundColor: "#d1d5db" }
          }
          onClick={() => setClustering(!clustering)}
        >
          {clustering ? "0" : "0"}
        </button>
      </div> */}
      <div className="">
        {clustering ? (
          <GroupStates
            group1={selectedGroup1Data}
            group2={selectedGroup2Data}
            setSubjectA={setSelectedSubjectA}
            setSubjectB={setSelectedSubjectB}
            state={selectedState}
            setState={setSelectedState}
            nrWindows={nrWindows}
          />
        ) : (
          <ClusterWindows
            clickedWindow={processSelectedGroup([clickedWindow])[0]}
            setClickedWindow={setClickedWindow}
            hoveredWindow={processSelectedGroup([hoveredWindow])[0]}
            setHoveredWindow={setHoveredWindow}
          />
        )}
      </div>
    </div>
  );
};

export default GroupView;

// if (!data.every((d) => d && d.value && d.value.length >= 2)) {
//   console.error(
//     "Some data points are missing or incorrectly structured:",
//     // log which data point is incorrect
//     data.find((d) => !d || !d.value || d.value.length < 2)
//   );
//   return;
// }
