import { useState } from "react";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import MainPage from "./pages/MainPage";
import Home from "./pages/Home";

import { useContext, useEffect } from "react";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import Spinner from "./components/Spinner";

import { ToastContainer } from "react-toastify";
import { DataContext } from "./contexts/DataContext";

const App = () => {
  const { jsonData, loading } = useContext(DataContext);
  // State to trigger a refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Effect to trigger refresh when jsonData changes
  useEffect(() => {
    if (jsonData) {
      // Update the key whenever jsonData changes
      setRefreshKey((prevKey) => prevKey + 1);
    }
  }, [jsonData]);

  return (
    <div className="flex flex-l flex-col h-screen">
      <div className="flex flex-col h-full">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner loading={loading} />
          </div>
        ) : (
          <MainPage key={refreshKey} />
        )}
      </div>
      <ToastContainer />
      <Settings />
    </div>
  );
};

export default App;
