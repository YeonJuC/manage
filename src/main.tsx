import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ 여기! index.css 없으니 styles.css로
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

