import Spinner from "./Spinner";
import ScatterPlot from "./archive/ScatterPlot";
import DensityPlot from "./DensityPlot";
import { useState, useEffect } from "react";
const GroupClustering = ({
  fetchData,
  data,
  loading,
  setSelectedSubjectA,
  setSelectedSubjectB,
  selectedWindows,
  selectedGroup1,
  setSelectedGroup1,
  selectedGroup2,
  setSelectedGroup2,
  state,
}) => {
  console.log("here");
  return (
    <>
      <button
        onClick={
          !loading
            ? fetchData
            : () => {
                console.log("Fetching Data");
              }
        }
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Compute DR
      </button>
      <div className="w-[500px]  border border-gray-500">
        {loading ? (
          <Spinner loading={loading} />
        ) : (
          <div className="flex flex-col justify-around">
            {data && data.length !== 0 && (
              <>
                <ScatterPlot
                  data={data}
                  setSubjectA={setSelectedSubjectA}
                  setSubjectB={setSelectedSubjectB}
                  selectedWindows={selectedWindows}
                  selectedGroup1={selectedGroup1}
                  setSelectedGroup1={setSelectedGroup1}
                  selectedGroup2={selectedGroup2}
                  setSelectedGroup2={setSelectedGroup2}
                  state={state}
                />
                {/* <DensityPlot data={data} /> */}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default GroupClustering;
