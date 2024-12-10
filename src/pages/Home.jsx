import { useState, useContext, useEffect } from "react";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import { DataContext } from "../contexts/DataContext";
import validateJson from "../helpers/validateJson";

const Home = () => {
  const { jsonData, updateJsonData, loading } = useContext(DataContext);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Test JSON schema
          validateJson(data)
            .then((isValid) => {
              if (isValid) {
                updateJsonData(data);
                toast.success("Data submitted successfully!");
              } else {
                toast.error("Validation failed");
              }
            })
            .catch((err) => {
              toast.error(err.message);
            });
        } catch (error) {
          console.log(error);
          toast.error("Invalid JSON format");
        }
      };
      reader.readAsText(selectedFile);
    } else {
      toast.error("Please select a file to upload");
    }
  };

  if (loading) {
    return <Spinner loading={loading} />;
  }
  return (
    <div>
      <h1 className="text-3xl font-bold">Home</h1>
      <input
        id="file-upload"
        type="file"
        accept=".json"
        onChange={handleFileUpload}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white rounded px-4 py-2"
      >
        Submit
      </button>
      <div className="mt-4">
        <p>
          Current Metric: <strong>{jsonData.metric}</strong>
        </p>
        <p>
          Labels: <strong>{jsonData.labels.join(", ")}</strong>
        </p>
        <p>
          Window Sizes:{" "}
          <strong>{Object.keys(jsonData.windowSizes).join(",")}</strong>
        </p>
        <p>
          Number of Patients: <strong>{jsonData.numPatients}</strong>
        </p>
        <p>
          Number of Controls: <strong>{jsonData.numControls}</strong>
        </p>
      </div>
    </div>
  );
};

export default Home;
