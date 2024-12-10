import { useContext } from "react";
import { SettingsContext } from "../contexts/SettingsContext";
import { BUTTON_STYLE } from "../helpers/constants";

const Settings = () => {
  const { settings, toggleComponent, showSettings, setShowSettings } =
    useContext(SettingsContext);

  const handleClose = () => {
    setShowSettings(false);
  };

  if (!showSettings) return null; // Do not render if not visible

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-sm w-full transition-transform transform">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        {Object.keys(settings).map((setting) => (
          <label key={setting} className="block mb-2">
            <input
              type="checkbox"
              checked={settings[setting]}
              onChange={() => toggleComponent(setting)}
              className="mr-2"
            />
            {setting}
          </label>
        ))}
        <div className="absolute bottom-4 right-4">
          <button onClick={handleClose} className={BUTTON_STYLE}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
