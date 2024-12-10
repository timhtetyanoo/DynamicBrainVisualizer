// import Ajv from "ajv";

// /**
//  * Function to validate JSON object against a schema
//  * @param {object} jsonObject - JSON object to validate
//  * @returns {boolean} - True if valid, false otherwise
//  */
// export default async function validateJson(jsonObject) {
//   try {
//     const schema = {
//       $schema: "http://json-schema.org/draft-07/schema#",
//       type: "object",
//       properties: {
//         labels: {
//           type: "array",
//           items: {
//             type: "string",
//           },
//         },
//         metric: {
//           type: "string",
//         },
//         directed: {
//           type: "boolean",
//         },
//         numWindowSizes: {
//           type: "integer",
//         },
//         numSubjects: {
//           type: "integer",
//         },
//         numPatients: {
//           type: "integer",
//         },
//         numControls: {
//           type: "integer",
//         },
//         numEdges: {
//           type: "integer",
//         },
//         windowSizes: {
//           type: "object",
//           additionalProperties: {
//             $ref: "#/definitions/WindowSize",
//           },
//         },
//       },
//       required: [
//         "labels",
//         "metric",
//         "directed",
//         "numWindowSizes",
//         "numSubjects",
//         "numPatients",
//         "numControls",
//         "numEdges",
//         "windowSizes",
//       ],
//       definitions: {
//         WindowSize: {
//           type: "object",
//           properties: {
//             patients: {
//               type: "array",
//               items: {
//                 $ref: "#/definitions/Subject",
//               },
//             },
//             controls: {
//               type: "array",
//               items: {
//                 $ref: "#/definitions/Subject",
//               },
//             },
//           },
//           required: ["patients", "controls"],
//           additionalProperties: false,
//         },
//         Subject: {
//           type: "object",
//           properties: {
//             windows: {
//               type: "array",
//               items: {
//                 type: "array",
//               },
//             },
//           },
//           required: ["windows"],
//           additionalProperties: false,
//         },
//       },
//     };

//     // Create Ajv instance
//     const ajv = new Ajv.default(); // Note: Use Ajv.default when using ES module import

//     // Compile the schema
//     const validate = ajv.compile(schema);

//     // Validate the jsonObject against the schema
//     const valid = validate(jsonObject);
//     if (!valid) {
//       console.log("Schema validation errors:", validate.errors);
//       return false;
//     }

//     // Additional custom checks
//     if (jsonObject.Labels && jsonObject.Labels.length < 2) {
//       console.log(
//         "Validation error: 'Labels' array must contain at least 2 items."
//       );
//       return false;
//     }
//     if (
//       jsonObject.Directed &&
//       jsonObject.numEdges !==
//         jsonObject.labels.length * (jsonObject.labels.length - 1)
//     ) {
//       console.log(
//         "Validation error: 'numEdges' must be equal to the number of edges in a complete directed graph with the given number of labels."
//       );
//       return false;
//     }
//     if (
//       !jsonObject.directed &&
//       jsonObject.numEdges !==
//         (jsonObject.labels.length * (jsonObject.labels.length - 1)) / 2
//     ) {
//       console.log(
//         "Validation error: 'numEdges' must be equal to the number of edges in a complete undirected graph with the given number of labels."
//       );
//       return false;
//     }

//     console.log("Data is valid!");
//     return true; // Return validation result
//   } catch (error) {
//     console.error("Error validating JSON:", error);
//     return false; // Return false in case of error
//   }
// }
import Ajv from "ajv";

/**
 * Function to validate JSON object against a schema
 * @param {object} jsonObject - JSON object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export default async function validateJson(jsonObject) {
  try {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        labels: {
          type: "array",
          items: {
            type: "string",
          },
        },
        metric: {
          type: "string",
        },
        directed: {
          type: "boolean",
        },
        numWindowSizes: {
          type: "integer",
        },
        numSubjects: {
          type: "integer",
        },
        numEdges: {
          type: "integer",
        },
        demographicsColumns: {
          type: "array",
          items: {
            type: "string",
          },
        },
        demographicsData: {
          type: "object",
        },
        windowSizes: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/WindowSize",
          },
        },
      },
      required: [
        "labels",
        "metric",
        "directed",
        "numWindowSizes",
        "numSubjects",
        "numEdges",
        "windowSizes",
      ],
      definitions: {
        WindowSize: {
          type: "object",
          properties: {
            subjects: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/Subject",
              },
            },
          },
          required: ["subjects"],
          additionalProperties: false,
        },
        Subject: {
          type: "object",
          properties: {
            windows: {
              type: "array",
              items: {
                type: "array",
              },
            },
          },
          required: ["windows"],
          additionalProperties: false,
        },
      },
    };

    // Create Ajv instance
    const ajv = new Ajv.default(); // Note: Use Ajv.default when using ES module import

    // Compile the schema
    const validate = ajv.compile(schema);

    // Validate the jsonObject against the schema
    const valid = validate(jsonObject);
    if (!valid) {
      console.log("Schema validation errors:", validate.errors);
      return false;
    }

    // Additional custom checks
    if (jsonObject.labels && jsonObject.labels.length < 2) {
      console.log(
        "Validation error: 'labels' array must contain at least 2 items."
      );
      return false;
    }
    // if (
    //   jsonObject.directed &&
    //   jsonObject.numEdges !==
    //     jsonObject.labels.length * (jsonObject.labels.length - 1)
    // ) {
    //   console.log(
    //     "Validation error: 'numEdges' must be equal to the number of edges in a complete directed graph with the given number of labels."
    //   );
    //   return false;
    // }
    // if (
    //   !jsonObject.directed &&
    //   jsonObject.numEdges !==
    //     (jsonObject.labels.length * (jsonObject.labels.length - 1)) / 2
    // ) {
    //   console.log(
    //     "Validation error: 'numEdges' must be equal to the number of edges in a complete undirected graph with the given number of labels."
    //   );
    //   return false;
    // }

    console.log("Data is valid!");
    return true; // Return validation result
  } catch (error) {
    console.error("Error validating JSON:", error);
    return false; // Return false in case of error
  }
}
