import SubjectView from "./SubjectView";
import GroupView from "./GroupView";
import Navbar from "../components/Navbar";
import { useContext, useState } from "react";
import { DataContext } from "../contexts/DataContext";
import {
  processData,
  getMinMaxValues,
  createColorScale,
} from "../helpers/util";
import { SettingsContext } from "../contexts/SettingsContext";
const MainPage = () => {
  const { jsonData, subjects, windowSize, stepSize, patientIDs, controlIDs } =
    useContext(DataContext);
  const { settings, toggleComponent } = useContext(SettingsContext);

  const [selectedGroupA, setSelectedGroupA] = useState("patients");
  const [selectedSubjectA, setSelectedSubjectA] = useState(patientIDs[0]);
  const [selectedGroupB, setSelectedGroupB] = useState("controls");
  const [selectedSubjectB, setSelectedSubjectB] = useState(controlIDs[0]);
  const [startWindowA, setStartWindowA] = useState(0);
  const [startWindowB, setStartWindowB] = useState(0);
  const [selectedWindowsA, setSelectedWindowsA] = useState([]);
  const [selectedWindowsB, setSelectedWindowsB] = useState([]);

  const nrPatients = jsonData.numPatients;
  const nrControls = jsonData.numControls;
  const windowSizes = jsonData ? Object.keys(jsonData.windowSizes) : [];

  // let subjects = jsonData.windowSizes[windowSize].subjects;
  // subjects = Object.keys(subjects).map((subjectId) => ({
  //   subject: subjectId,
  //   windows: subjects[subjectId].windows,
  // }));

  const subjectsArray = Object.values(subjects);

  const patients = patientIDs.map((subjectId) => subjects[subjectId]);
  const controls = controlIDs.map((subjectId) => subjects[subjectId]);

  const dataA = subjects[selectedSubjectA];
  const dataB = subjects[selectedSubjectB];

  return (
    <div className="flex flex-col h-full min-w-[1600px] overflow-x-auto">
      <Navbar />

      <div className="h-min-1/2 h-full">
        <GroupView
          setSelectedSubjectA={setSelectedSubjectA}
          setSelectedSubjectB={setSelectedSubjectB}
          setStartWindowA={setStartWindowA}
          setStartWindowB={setStartWindowB}
          selectedWindowsA={selectedWindowsA}
          selectedWindowsB={selectedWindowsB}
          patientsData={patients}
          controlsData={controls}
          subjects={subjectsArray}
          nrWindows={dataA.length}
        />
      </div>
      <div className="flex w-full">
        <div className="flex-1">
          <SubjectView
            id={"A"}
            selectedSubject={selectedSubjectA}
            setSelectedSubject={setSelectedSubjectA}
            startWindow={startWindowA}
            selectedWindows={selectedWindowsA}
            setSelectedWindows={setSelectedWindowsA}
            data={dataA}
          />
        </div>

        {settings["Show Subject B"] && (
          <div className="flex-1">
            <SubjectView
              id={"B"}
              selectedSubject={selectedSubjectB}
              setSelectedSubject={setSelectedSubjectB}
              startWindow={startWindowB}
              selectedWindows={selectedWindowsB}
              setSelectedWindows={setSelectedWindowsB}
              data={dataB}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPage;
