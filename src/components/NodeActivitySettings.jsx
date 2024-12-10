import React, { useContext } from "react";
import { SubjectViewContext } from "../pages/SubjectView";
import { BUTTON_STYLE } from "../helpers/constants";
const NodeActivitySettings = ({
  selectedNodeActivity,
  setSelectedNodeActivity,
  downloadSVG,
}) => {
  const { id } = useContext(SubjectViewContext);
  return (
    <div className="flex items-center w-full justify-center space-x-4 text-xs">
      <label htmlFor="nodeActivity-out" className="flex items-center">
        <input
          type="radio"
          id={`nodeActivity-out-${id}`}
          name={`nodeActivity-out-${id}`}
          value="out"
          className="mr-2 cursor-pointer"
          checked={selectedNodeActivity === "out"}
          onChange={() => setSelectedNodeActivity("out")}
        />
        <span className="text-black">Outgoing Node Activity</span>
      </label>
      <label htmlFor="nodeActivity-in" className="flex items-center">
        <input
          type="radio"
          id={`nodeActivity-in-${id}`}
          name={`nodeActivity-in-${id}`}
          value="in"
          className="mr-2 cursor-pointer"
          checked={selectedNodeActivity === "in"}
          onChange={() => setSelectedNodeActivity("in")}
        />
        <span className="text-black">Incoming Node Activity</span>
      </label>
      {/* <label htmlFor="nodeActivity-both" className="flex items-center">
        <input
          type="radio"
          id="nodeActivity-both"
          name="nodeActivity"
          value="both"
          className="mr-2 cursor-pointer"
          checked={selectedNodeActivity === "both"}
          onChange={() => setSelectedNodeActivity("both")}
        />
        <span className="text-black">both</span>
      </label> */}
      <button onClick={downloadSVG} className={`${BUTTON_STYLE} mb-0.5`}>
        Download
      </button>
    </div>
  );
};

export default NodeActivitySettings;
