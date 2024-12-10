import { useState, useContext } from "react";
import Navbar from "../components/Navbar";
import Settings from "../components/Settings";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataContext } from "../contexts/DataContext";
import Spinner from "../components/Spinner";

const MainLayout = () => {
  const { loading } = useContext(DataContext);
  return (
    <>
      <Navbar />
      <div className="mt-8 flex flex-col h-[calc(100vh-2rem)]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner loading={loading} />
          </div>
        ) : (
          <Outlet />
        )}
      </div>
      <ToastContainer />
      <Settings />
    </>
  );
};
export default MainLayout;
