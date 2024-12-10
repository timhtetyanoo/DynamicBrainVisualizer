import { max, min, scaleSequential, interpolateViridis, index } from "d3";

export function reconstructMatrix(array, directed, size) {
  const totalCells = size * size;
  const newArray = Array(totalCells).fill(null);

  if (directed) {
    let originalIndex = 0;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        if (i !== j) {
          newArray[index] = array[originalIndex];
          originalIndex++;
        }
      }
    }
  } else {
    let originalIndex = 0;

    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        const indexUpper = i * size + j;
        const indexLower = j * size + i;
        newArray[indexUpper] = array[originalIndex];
        newArray[indexLower] = array[originalIndex];
        originalIndex++;
      }
    }
  }

  return newArray;
}

// export const filterData = (
//   data,
//   minValue,
//   maxValue,
//   minThreshold,
//   maxThreshold
// ) => {
//   return data.map((d) => {
//     if (d === null) {
//       return null; // Preserve null values
//     }

//     // Normalize thresholds to the range between minValue and maxValue
//     const range = maxValue - minValue;
//     const normalizedMinThreshold = minValue + (minThreshold / 100) * range;
//     const normalizedMaxThreshold = minValue + (maxThreshold / 100) * range;

//     if (d < normalizedMinThreshold || d > normalizedMaxThreshold) {
//       return null; // Filter out values outside the threshold range
//     }

//     return d; // Return the original value if it passes the thresholds
//   });
// };
export const filterData = (
  data,
  minValue,
  maxValue,
  minThreshold,
  maxThreshold
) => {
  return data.map((d) => {
    if (d === null || d == 0) {
      return null; // Preserve null values
    }
    if (d < minThreshold || d > maxThreshold) {
      return null; // Filter out values outside the threshold range
    }

    return d; // Return the original value if it passes the thresholds
  });
};

export const getMinMaxValues = (data) => {
  return {
    minValue: min(data.filter((d) => d !== null)),
    maxValue: max(data.filter((d) => d !== null)),
  };
};

export const createColorScale = (minValue, maxValue) => {
  return scaleSequential(interpolateViridis).domain([minValue, maxValue]);
};
export const createAdjList = (flattenedMatrix, numNodes) => {
  const size = numNodes;
  const adjacencyMatrix = [];

  // Step 1: Reshape the flattened matrix into a 2D matrix
  for (let i = 0; i < size; i++) {
    adjacencyMatrix.push(flattenedMatrix.slice(i * size, (i + 1) * size));
  }

  // Step 2: Create the node array with outgoing and incoming edges including node indices
  const nodes = [];
  for (let i = 0; i < size; i++) {
    const outgoing = [];
    const incoming = [];

    for (let j = 0; j < size; j++) {
      if (adjacencyMatrix[i][j] !== null) {
        outgoing.push({ node: j, weight: adjacencyMatrix[i][j] });
      }
      if (adjacencyMatrix[j][i] !== null) {
        incoming.push({ node: j, weight: adjacencyMatrix[j][i] });
      }
    }

    nodes.push({
      label: i,
      outgoing: outgoing,
      incoming: incoming,
    });
  }

  return nodes;
};
const reshape = (arr, n) => {
  let result = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
};

export const createNodeActivity = (windows, numNodes, direction) => {
  let nodeActivity = Array(numNodes)
    .fill()
    .map(() => []);

  windows.forEach((window) => {
    // Reshape the flattened window into a 2D matrix
    const matrix = reshape(window, numNodes);
    // Compute the outdegree for each node in this window
    if (direction == "out") {
      for (let i = 0; i < numNodes; i++) {
        let outdegree = 0;
        for (let j = 0; j < numNodes; j++) {
          outdegree += matrix[i][j]; // Sum of weights of outgoing edges
        }
        nodeActivity[i].push(outdegree);
      }
    } else if (direction == "in") {
      for (let j = 0; j < numNodes; j++) {
        let indegree = 0;
        for (let i = 0; i < numNodes; i++) {
          indegree += matrix[i][j]; // Sum of weights of incoming edges
        }
        nodeActivity[j].push(indegree);
      }
    } else if (direction == "both") {
      for (let i = 0; i < numNodes; i++) {
        let outdegree = 0;
        let indegree = 0;
        for (let j = 0; j < numNodes; j++) {
          outdegree += matrix[i][j]; // Sum of weights of outgoing edges
          indegree += matrix[j][i]; // Sum of weights of incoming edges
        }
        nodeActivity[i].push(outdegree + indegree);
      }
    }
  });
  return nodeActivity;
};
// export const processStepSize = (data, stepSize) => {
//   return data.filter((_, index) => index % stepSize === 0);
// };

export const processStepSize = (data, stepSize, subject) => {
  const filtered = data
    .map((value, window) => ({ subject, window, value })) // Map the original array to an array of objects with index and value
    .filter((_, window) => window % stepSize === 0); // Filter based on the stepSize
  // .map((item, index) => ({ ...item, window: index })); // Update the window index
  return filtered;
};

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export const processData2 = (data, stepSize, startIndex) => {
  let output = [data.length];
  for (let i = 0; i < data.length; i++) {
    const numWindows = data[i].length;
    const currentIndex = startIndex + i * numWindows;
    let subjectWindows = processStepSize(data[i], stepSize, i);
    subjectWindows = subjectWindows.map((item, i) => ({
      id: currentIndex + item.window,
      window: i,
      ...item,
    }));
    output[i] = subjectWindows;
  }
  const lastIndex = output.at(-1).at(-1).id + 1;
  return { output, lastIndex };
};

export const processData = (data, stepSize) => {
  let output = {};
  for (let i = 0; i < data.length; i++) {
    const numWindows = data[i].length;
    const subjectWindows = processStepSize(
      data[i].windows,
      stepSize,
      data[i].subject
    );
    output[data[i].subject] = subjectWindows.map((item, i) => ({
      id: `${item.subject}_${item.window}`,
      subject: item.subject,
      window: i,
      value: item.value,
    }));
  }
  return output;
};
export const processDRData = (data) => {
  let windows = [];
  for (let i = 0; i < data.length; i++) {
    data[i].forEach((item) => {
      //if value is an array of nulls skip
      if (item.value.every((v) => v === null)) return;
      windows.push(item);
    });
  }
  return windows;
};
