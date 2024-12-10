import { createContext, useState, useEffect } from "react";
import {
  createColorScale,
  getMinMaxValues,
  processData,
} from "../helpers/util";
import { openDB } from "idb";
import { min, max } from "d3";

const dbPromise = openDB("my-database", 1, {
  upgrade(db) {
    db.createObjectStore("jsonStore");
  },
});

const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [jsonData, setJsonData] = useState();
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState(null);
  const [patientIDs, setPatientIDs] = useState([]);
  const [controlIDs, setControlIDs] = useState([]);
  const [stepSize, setStepSize] = useState(1);
  const [binarize, setBinarize] = useState(false);
  const [binarizeThreshold, setBinarizeThreshold] = useState(0.5);
  const stepSizes = [1, 2, 3, 4, 5];
  const bins = 5;

  let subjects;
  let minValue;
  let maxValue;
  let colorScale;
  let demographicsCategories;
  let demographicsType;

  const updateStates = (data) => {
    setJsonData(data);
    const initialWindowSize = Object.keys(data.windowSizes)[0];
    const initialStepSize = 1;
    setWindowSize(initialWindowSize);
    const patientIds = Object.keys(data.demographicsData).filter(
      (id) => data.demographicsData[id].group === "patient"
    );
    const controlIds = Object.keys(data.demographicsData).filter(
      (id) => data.demographicsData[id].group === "control"
    );
    setPatientIDs(patientIds);
    setControlIDs(controlIds);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const db = await dbPromise;
      const storedData = await db.get("jsonStore", "jsonData");
      if (storedData) {
        const data = JSON.parse(storedData);
        updateStates(data);
      } else {
        const response = await fetch("./src/assets/wavelet_lead.json");
        const data = await response.json();
        updateStates(data);

        await db.put("jsonStore", JSON.stringify(data), "jsonData");
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const updateJsonData = async (data) => {
    updateStates(data);
    setStepSize(1);
    const db = await dbPromise;
    await db.put("jsonStore", JSON.stringify(data), "jsonData");
    localStorage.removeItem("DRData");
  };
  if (jsonData) {
    subjects = jsonData.windowSizes[windowSize].subjects;
    subjects = Object.keys(subjects).map((subjectId) => ({
      subject: subjectId,
      windows: subjects[subjectId].windows,
    }));
    if (binarize) {
      subjects = subjects.map((subject) => {
        const maxValue = max(subject.windows.flat().filter((d) => d !== null));
        const minValue = min(subject.windows.flat().filter((d) => d !== null));
        const threshold_value =
          minValue + (maxValue - minValue) * binarizeThreshold;
        // console.log(threshold_value);
        return {
          ...subject,
          windows: subject.windows.map((window) =>
            window.map((value) =>
              value !== null && value >= threshold_value ? 1 : 0
            )
          ),
        };
      });
    }
    subjects = processData(subjects, stepSize);

    const subjectsArray = Object.values(subjects);
    const windowValues = subjectsArray.flat().map((item) => item.value);

    const values = getMinMaxValues(
      windowValues.flat().map((value) => (value != 0 ? value : null))
    );
    minValue = values.minValue;
    maxValue = values.maxValue;

    colorScale = createColorScale(minValue, maxValue);

    const demographics = jsonData.demographicsData;
    const demographicsColumns = jsonData.demographicsColumns;

    //   demographicsType = demographicsColumns.reduce((acc, column) => {
    //     const distinctValues = new Set();
    //     for (const subject in demographics) {
    //       if (demographics[subject][column] !== undefined) {
    //         distinctValues.add(demographics[subject][column]);
    //       }
    //     }
    //     acc[column] = distinctValues.size > bins ? "numerical" : "categorical";
    //     return acc;
    //   }, {});

    //   demographicsCategories = demographicsColumns.reduce((acc, column) => {
    //     const distinctValues = new Set();
    //     for (const subject in demographics) {
    //       if (demographics[subject][column] !== undefined) {
    //         distinctValues.add(demographics[subject][column]);
    //       }
    //     }
    //     acc[column] = Array.from(distinctValues);
    //     return acc;
    //   }, {});
    //   // Process numerical categories into bins if they have more than 5 distinct values
    //   for (const column in demographicsCategories) {
    //     if (demographicsType[column] === "numerical") {
    //       const distinctValues = demographicsCategories[column].filter(
    //         (value) => value !== null
    //       );
    //       const min = Math.min(...distinctValues);
    //       const max = Math.max(...distinctValues);

    //       const binSize = (max - min) / bins;
    //       demographicsCategories[column] = Array.from(
    //         { length: bins },
    //         (_, i) => {
    //           const start = min + i * binSize;
    //           const end = start + binSize;
    //           if (Number.isInteger(min) && Number.isInteger(max)) {
    //             return `${Math.floor(start)} - ${Math.floor(end)}`;
    //           } else {
    //             return `${start.toFixed(2)} - ${end.toFixed(2)}`;
    //           }
    //         }
    //       );
    //     }
    //   }
  }

  console.log({
    jsonData,
    patientIDs,
    controlIDs,
    loading,
    windowSize,
    stepSize,
    binarize,
    binarizeThreshold,
    minValue,
    maxValue,
    colorScale,
    subjects,
    // demographicsCategories,
    // demographicsType,
  });
  return (
    <DataContext.Provider
      value={{
        jsonData,
        updateJsonData,
        patientIDs,
        controlIDs,
        loading,
        windowSize,
        setWindowSize,
        stepSize,
        setStepSize,
        binarize,
        setBinarize,
        binarizeThreshold,
        setBinarizeThreshold,
        stepSizes,
        minValue,
        maxValue,
        colorScale,
        subjects,
        demographicsCategories,
        demographicsType,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export { DataProvider, DataContext };
