const ToolTip = ({ x, y, content }) => {
  const style = {
    position: "absolute",
    left: x + 10 + "px", // adjust positioning as needed
    top: y + 10 + "px", // adjust positioning as needed
    background: "white",
    border: "1px solid black",
    padding: "5px",
    borderRadius: "5px",
    zIndex: 9999, // ensure tooltip appears on top
    fontSize: "12px",
  };

  return <div style={style}>{content}</div>;
};

export default ToolTip;
