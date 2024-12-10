import { useState, useContext, useEffect, useMemo } from "react";
import GroupParameters from "../components/GroupParameters";
import GroupStates from "../components/GroupStates";

import { DataContext } from "../contexts/DataContext";
import { processDRData, reconstructMatrix, filterData } from "../helpers/util";
import {
  BUTTON_STYLE,
  CLUSTER1_COLOR,
  CLUSTER2_COLOR,
} from "../helpers/constants";

import { toast } from "react-toastify";
import axios from "axios";
import ClusterWindows from "../components/ClusterWindows";
import Spinner from "../components/Spinner";
import DRPlot from "../components/DRPlot";
import { max, min } from "d3";

const GroupView = ({
  setSelectedSubjectA,
  setSelectedSubjectB,
  setStartWindowA,
  setStartWindowB,
  selectedWindowsA,
  selectedWindowsB,
  subjects,
  nrWindows,
}) => {
  const {
    jsonData,
    windowSize,
    stepSize,
    binarize,
    minValue,
    maxValue,
    binarizeThreshold,
    patientIDs,
    controlIDs,
  } = useContext(DataContext);

  const directed = jsonData.directed;
  const labels = jsonData.labels;
  const demographics = jsonData.demographicsData;

  const subjectsData = processDRData(subjects);
  const subjectIDs = [...new Set(subjectsData.map((item) => item.subject))];

  const [openGroupParameters, setOpenGroupParameters] = useState(true);
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
    binarize: false,
    normalize: false,
    scale: false,
    threshold: 0.5,
    seed: 42,
  });
  const [selectedDemographics, setSelectedDemographics] = useState("group");
  const [selectedSubjects, setSelectedSubjects] = useState(subjectIDs);
  const [threshold, setThreshold] = useState([0, 100]);

  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(1);
  const [clustering, setClustering] = useState(false);

  const [DRData, setDRData] = useState([]);

  const [selectedGroup1, setSelectedGroup1] = useState([]);
  const [selectedGroup2, setSelectedGroup2] = useState([]);
  const [clickedWindow, setClickedWindow] = useState(null);
  const [hoveredWindow, setHoveredWindow] = useState(null);

  const getWindowData = (window) => {
    {
      if (window === null)
        return {
          id: null,
          subject: null,
          window: null,
          value: null,
        };
      const foundItem = subjectsData.find((i) => i.id === window.id);
      if (foundItem) {
        const val = reconstructMatrix(foundItem.value, directed, labels.length);
        const filteredValue = filterData(
          val,
          minValue,
          maxValue,
          threshold[0],
          threshold[1]
        );
        return {
          ...foundItem,
          value: filteredValue,
        };
      }
      return undefined;
    }
  };

  const clickedWindowData = clickedWindow ? getWindowData(clickedWindow) : null;
  const hoveredWindowData = hoveredWindow ? getWindowData(hoveredWindow) : null;

  const featureSelection = (inputData, features) => {
    const keys = Object.keys(features);
    const indicesToRemove = keys
      .map((key, index) => (features[key] === false ? index : -1))
      .filter((index) => index !== -1);
    //Changing this block
    const filteredInputData = inputData.map((subArray) =>
      subArray.filter((_, index) => !indicesToRemove.includes(index))
    );
    return filteredInputData;
  };
  const filterSubjects = (data, selectedSubjects) => {
    return data.filter((item) => selectedSubjects.includes(item.subject));
  };
  const setProcessedData = (data, subjectsData) => {
    const processedData = subjectsData.map((item, index) => {
      return {
        ...item,
        value: data[index],
      };
    });

    setDRData(processedData);
  };

  const fetchData = async () => {
    if (loading) return;
    setLoading(true);

    const filteredSubjects = filterSubjects(subjectsData, selectedSubjects);
    let data = filteredSubjects.map((item) => item.value);
    data = featureSelection(data, features);

    // const max = Math.max(...data.flat());
    const maxValue = max(data.flat().filter((d) => d !== null));
    const minValue = min(data.flat().filter((d) => d !== null));
    const threshold_value =
      minValue + (maxValue - minValue) * preprocessParams.threshold;

    console.log("umapParams", umapParams);
    console.log("preprocessParams", preprocessParams);

    const jsonData = {
      data: data,
      umap_params: umapParams,
      preprocess_params: {
        ...preprocessParams,
        threshold: threshold_value,
      },
    };
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/dimensionality_reduction",
        jsonData,
        { headers: { "Content-Type": "application/json" } } // Ensure headers are set correctly
      );
      // Check if response data is in the expected format
      if (Array.isArray(response.data)) {
        if (response.data.length !== data.length) {
          console.error(
            "Unexpected response format: length mismatch",
            response.data
          );
          toast.error("Unexpected response format: length mismatch");
        } else {
          setProcessedData(response.data, filteredSubjects);
          // setReducedData(response.data);
          toast.success("Dimensionality Reduction Computed Successfully!");
        }
      } else {
        console.error("Unexpected response format", response.data);
        toast.error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast.error("Error Computing Dimensionality Reduction");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setSelectedGroup1([]);
    setSelectedGroup2([]);
    setClickedWindow(null);
    setHoveredWindow(null);
    setSelectedSubjects(subjectIDs);
    setDRData([]);
  }, [windowSize, stepSize, binarize, binarizeThreshold]);

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

  const memoizedGroup1 = useMemo(
    () => processSelectedGroup(selectedGroup1),
    [selectedGroup1]
  );
  const memoizedGroup2 = useMemo(
    () => processSelectedGroup(selectedGroup2),
    [selectedGroup2]
  );

  return (
    <div className="flex justify-between h-full">
      <div className="flex w-96">
        {openGroupParameters && (
          <GroupParameters
            umapParams={umapParams}
            setUmapParams={setUmapParams}
            preprocessParams={preprocessParams}
            setPreprocessParams={setPreprocessParams}
            features={features}
            setFeatures={setFeatures}
            subjectsData={subjectsData}
            selectedDemographics={selectedDemographics}
            setSelectedDemographics={setSelectedDemographics}
            selectedSubjects={selectedSubjects}
            setSelectedSubjects={setSelectedSubjects}
            fetchData={fetchData}
            loading={loading}
            threshold={threshold}
            setThreshold={setThreshold}
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

      <div className="flex w-full h-full">
        {loading ? (
          <Spinner loading={loading} />
        ) : (
          <>
            <DRPlot
              size={400}
              data={DRData.sort(() => Math.random() - 0.5)}
              demographics={demographics}
              selectedDemographics={selectedDemographics}
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
              hoveredWindow={hoveredWindow}
              setHoveredWindow={setHoveredWindow}
              clickedWindow={clickedWindow}
              setClickedWindow={setClickedWindow}
              state={selectedState}
              clustering={clustering}
            />
          </>
        )}
      </div>

      <div className="flex">
        <div className="flex justify-center">
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
            -
          </button>
        </div>
        {clustering ? (
          <GroupStates
            group1={memoizedGroup1}
            group2={memoizedGroup2}
            setSubjectA={setSelectedSubjectA}
            setSubjectB={setSelectedSubjectB}
            state={selectedState}
            setState={setSelectedState}
            nrWindows={nrWindows}
          />
        ) : (
          <ClusterWindows
            clickedWindow={clickedWindowData}
            setClickedWindow={setClickedWindow}
            hoveredWindow={hoveredWindowData}
            setHoveredWindow={setHoveredWindow}
            setSubjectA={setSelectedSubjectA}
            setSubjectB={setSelectedSubjectB}
          />
        )}
      </div>
    </div>
  );
};

export default GroupView;
