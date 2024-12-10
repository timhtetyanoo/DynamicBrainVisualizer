// import { useContext, useState, useMemo, useRef, createRef } from "react";
// import { DataContext } from "../contexts/DataContext";
// import { SubjectViewContext } from "../pages/SubjectView";
// import Window from "./Window";
// import Heatmap from "./Heatmap";
// import AdjacencyList from "./AdjacencyList";
// import Bipartite from "./Bipartite";
// import JSZip from "jszip";
// import { saveAs } from "file-saver";
// import { BUTTON_STYLE } from "../helpers/constants";

// const SmallMultiples = ({ windows, startIndex, endIndex }) => {
//   const { selectedSubject, colorScale } = useContext(SubjectViewContext);
//   const { jsonData } = useContext(DataContext);
//   const labels = jsonData.labels;

//   const [visType, setVisType] = useState("heatmap");
//   const svgRefs = useRef([]); // Create an array of refs for each window
//   const [svgs, setSvgs] = useState([]);

//   const margin = { top: 30, right: 10, bottom: 10, left: 30 };

//   const changeVis = () => {
//     setVisType(
//       visType === "heatmap"
//         ? "bipartite"
//         : // : visType === "node-link"
//         // ? "bipartite"
//         visType === "bipartite"
//         ? "adjacency-list"
//         : "heatmap"
//     );
//   };

//   const renderedWindows = useMemo(() => {
//     return windows.map((window, index) => {
//       svgRefs.current[index] = svgRefs.current[index] || createRef();

//       return (
//         <div key={index}>
//           <Window
//             index={index}
//             data={window.value}
//             labels={labels}
//             colorScale={colorScale}
//             visType={visType}
//             margin={margin}
//             svgRef={svgRefs.current[index]}
//           />
//         </div>
//       );
//     });
//   }, [windows, labels, colorScale, visType]);

//   const visibleWindows = renderedWindows.slice(startIndex, endIndex);

//   const generateSVGsandDownload = async () => {
//     const zip = new JSZip();
//     for (let i = 0; i < windows.length; i++) {
//       const { id, value } = windows[i];
//       const svgPromise = new Promise((resolve) => {
//         const getSVGString = (svgString) => {
//           resolve(svgString);
//         };

//         if (visType === "heatmap") {
//           setSvgs([
//             <Heatmap
//               key={id}
//               margin={margin}
//               data={value}
//               labels={labels}
//               colorScale={colorScale}
//               selectedOutgoingLabels={new Array(labels.length).fill(true)}
//               setSelectedOutgoingLabels={() => {}}
//               selectedIncomingLabels={new Array(labels.length).fill(true)}
//               setSelectedIncomingLabels={() => {}}
//               getSVGString={getSVGString} // Pass the function to capture SVG string
//             />,
//           ]);
//         } else if (visType === "bipartite") {
//           setSvgs([
//             <Bipartite
//               key={id}
//               margin={margin}
//               data={value}
//               labels={labels}
//               colorScale={colorScale}
//               leftLabelsSelected={new Array(labels.length).fill(true)}
//               setLeftLabelsSelected={() => {}}
//               rightLabelsSelected={new Array(labels.length).fill(true)}
//               setRightLabelsSelected={() => {}}
//               getSVGString={getSVGString} // Pass the function to capture SVG string
//             />,
//           ]);
//         } else if (visType === "adjacency-list") {
//           setSvgs([
//             <AdjacencyList
//               key={id}
//               margin={margin}
//               data={value}
//               labels={labels}
//               colorScale={colorScale}
//               getSVGString={getSVGString} // Pass the function to capture SVG string
//             />,
//           ]);
//         }
//       });

//       // Wait for the SVG to be captured
//       const svgString = await svgPromise;

//       // Add each SVG to the zip file
//       zip.file(`${visType}_${id}.svg`, svgString);
//     }
//     const zipBlob = await zip.generateAsync({ type: "blob" });
//     saveAs(zipBlob, `${selectedSubject}_${visType}.zip`);
//   };

//   return (
//     <div className="flex flex-col">
//       {/* <div className="flex flex-wrap">{renderWindows()}</div> */}
//       <div className="flex flex-wrap">{visibleWindows}</div>

//       <div className="flex gap-2 justify-center items-center">
//         <button onClick={changeVis} className={BUTTON_STYLE}>
//           Change Layout
//         </button>
//         <button onClick={generateSVGsandDownload} className={BUTTON_STYLE}>
//           Download
//         </button>
//       </div>
//       <div>{svgs}</div>
//       <div className="flex flex-col justify-center items-center">
//         SVG Animation Video Here
//       </div>
//     </div>
//   );
// };

// export default SmallMultiples;

import {
  useContext,
  useState,
  useMemo,
  useRef,
  useEffect,
  createRef,
} from "react";
import { DataContext } from "../contexts/DataContext";
import { SubjectViewContext } from "../pages/SubjectView";
import Window from "./Window";
import Heatmap from "./Heatmap";
import AdjacencyList from "./AdjacencyList";
import Bipartite from "./Bipartite";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { BUTTON_STYLE } from "../helpers/constants";

const SmallMultiples = ({ windows, startIndex, endIndex }) => {
  const { selectedSubject, colorScale } = useContext(SubjectViewContext);
  const { jsonData } = useContext(DataContext);
  const labels = jsonData.labels;

  const [visType, setVisType] = useState("heatmap");
  const [svgs, setSvgs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false); // Controls play/pause
  const [currentFrame, setCurrentFrame] = useState(-1); // Tracks the current animation frame
  const svgRefs = useRef([]); // Create an array of refs for each window
  const animationInterval = useRef(null); // Ref to store the interval ID for play/pause

  const margin = { top: 30, right: 10, bottom: 10, left: 30 };

  const changeVis = () => {
    setVisType(
      visType === "heatmap"
        ? "bipartite"
        : visType === "bipartite"
        ? "adjacency-list"
        : visType === "adjacency-list"
        ? "node-link"
        : "heatmap"
    );
  };

  const renderedWindows = useMemo(() => {
    return windows.map((window, index) => {
      svgRefs.current[index] = svgRefs.current[index] || createRef();

      return (
        <div key={index}>
          <Window
            index={index}
            data={window.value}
            labels={labels}
            colorScale={colorScale}
            visType={visType}
            margin={margin}
            svgRef={svgRefs.current[index]}
          />
        </div>
      );
    });
  }, [windows, labels, colorScale, visType]);

  const visibleWindows = renderedWindows.slice(startIndex, endIndex);

  // Play the animation by incrementing currentFrame every second
  const playAnimation = () => {
    if (isPlaying) return; // Prevent multiple intervals from being set
    setIsPlaying(true);
    animationInterval.current = setInterval(() => {
      setCurrentFrame((prevFrame) => {
        const nextFrame = (prevFrame + 1) % renderedWindows.length;
        return nextFrame;
      });
    }, 1000); // Change frame every second
  };

  // Pause the animation by clearing the interval
  const pauseAnimation = () => {
    setIsPlaying(false);
    clearInterval(animationInterval.current);
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => clearInterval(animationInterval.current);
  }, []);

  const generateSVGsandDownload = async () => {
    const zip = new JSZip();
    for (let i = 0; i < windows.length; i++) {
      const { id, value } = windows[i];
      const svgPromise = new Promise((resolve) => {
        const getSVGString = (svgString) => {
          resolve(svgString);
        };

        if (visType === "heatmap") {
          setSvgs([
            <Heatmap
              key={id}
              margin={margin}
              data={value}
              labels={labels}
              colorScale={colorScale}
              selectedOutgoingLabels={new Array(labels.length).fill(true)}
              setSelectedOutgoingLabels={() => {}}
              selectedIncomingLabels={new Array(labels.length).fill(true)}
              setSelectedIncomingLabels={() => {}}
              getSVGString={getSVGString} // Pass the function to capture SVG string
            />,
          ]);
        } else if (visType === "bipartite") {
          setSvgs([
            <Bipartite
              key={id}
              margin={margin}
              data={value}
              labels={labels}
              colorScale={colorScale}
              leftLabelsSelected={new Array(labels.length).fill(true)}
              setLeftLabelsSelected={() => {}}
              rightLabelsSelected={new Array(labels.length).fill(true)}
              setRightLabelsSelected={() => {}}
              getSVGString={getSVGString} // Pass the function to capture SVG string
            />,
          ]);
        } else if (visType === "adjacency-list") {
          setSvgs([
            <AdjacencyList
              key={id}
              margin={margin}
              data={value}
              labels={labels}
              colorScale={colorScale}
              getSVGString={getSVGString} // Pass the function to capture SVG string
            />,
          ]);
        }
      });

      // Wait for the SVG to be captured
      const svgString = await svgPromise;

      // Add each SVG to the zip file
      zip.file(`${visType}_${id}.svg`, svgString);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${selectedSubject}_${visType}.zip`);
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap">{visibleWindows}</div>

      <div className="flex gap-2 justify-center items-center">
        <button onClick={changeVis} className={BUTTON_STYLE}>
          Change Layout
        </button>
        <button onClick={generateSVGsandDownload} className={BUTTON_STYLE}>
          Download
        </button>
      </div>

      {/* SVG Animation Video Div */}
      <div className="flex flex-col justify-center items-center">
        <div>{renderedWindows[currentFrame]}</div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={isPlaying ? pauseAnimation : playAnimation}
            className={BUTTON_STYLE}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button onClick={() => setCurrentFrame(0)} className={BUTTON_STYLE}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmallMultiples;
