import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"; // margin and padding 0 on the main container

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
