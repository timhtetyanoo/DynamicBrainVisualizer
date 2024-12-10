import { useState, useContext } from "react";

import Heatmap from "./Heatmap";
import NodeLink from "./NodeLink";
import Bipartite from "./Bipartite";
import AdjacencyList from "./AdjacencyList";

const Window = ({
  index,
  data,
  labels,
  visType,
  colorScale,
  margin,
  svgRef,
  width,
  height,
}) => {
  const [selectedOutgoingLabels, setSelectedOutgoingLabels] = useState(
    new Array(labels.length).fill(true)
  );
  const [selectedIncomingLabels, setSelectedIncomingLabels] = useState(
    new Array(labels.length).fill(true)
  );

  const renderVisualization = () => {
    if (visType === "heatmap") {
      return (
        <Heatmap
          margin={margin}
          data={data}
          labels={labels}
          colorScale={colorScale}
          selectedOutgoingLabels={selectedOutgoingLabels}
          setSelectedOutgoingLabels={setSelectedOutgoingLabels}
          selectedIncomingLabels={selectedIncomingLabels}
          setSelectedIncomingLabels={setSelectedIncomingLabels}
          svgRef={svgRef}
          width={width}
          height={height}
        />
      );
    } else if (visType === "node-link") {
      return (
        <NodeLink
          margin={margin}
          data={data}
          labels={labels}
          colorScale={colorScale}
          selectedOutgoingLabels={selectedOutgoingLabels}
          setSelectedOutgoingLabels={setSelectedOutgoingLabels}
          selectedIncomingLabels={selectedIncomingLabels}
          setSelectedIncomingLabels={setSelectedIncomingLabels}
          // selectedLabels={selectedOutgoingLabels}
          // setSelectedLabels={setSelectedOutgoingLabels}
          svgRef={svgRef}
          width={width}
          height={height}
        />
      );
    } else if (visType === "bipartite") {
      return (
        <Bipartite
          margin={margin}
          data={data}
          labels={labels}
          colorScale={colorScale}
          leftLabelsSelected={selectedOutgoingLabels}
          setLeftLabelsSelected={setSelectedOutgoingLabels}
          rightLabelsSelected={selectedIncomingLabels}
          setRightLabelsSelected={setSelectedIncomingLabels}
          svgRef={svgRef}
          width={width}
          height={height}
        />
      );
    } else if (visType === "adjacency-list") {
      return (
        <AdjacencyList
          margin={margin}
          data={data}
          labels={labels}
          colorScale={colorScale}
          selectedOutgoingLabels={selectedOutgoingLabels}
          setSelectedOutgoingLabels={setSelectedOutgoingLabels}
          selectedIncomingLabels={selectedIncomingLabels}
          setSelectedIncomingLabels={setSelectedIncomingLabels}
          svgRef={svgRef}
          width={width}
          height={height}
        />
      );
    }
  };
  return (
    <div className="flex flex-col">
      <div className="flex-grow">{renderVisualization()}</div>
      <div className="flex justify-center">
        <p>Window: {index}</p>
      </div>
    </div>
  );
};

export default Window;
