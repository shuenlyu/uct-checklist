import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { slk } from "survey-core";

slk(
     "ZGJkODBmZGItOTEzNi00OWY0LTgzZWQtZmQxMmJiNTQ1MDdmOzE9MjAyNS0wNi0wMywyPTIwMjUtMDYtMDMsND0yMDI1LTA2LTAz"
);


<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css"></link>;

if (process.env.NODE_ENV === "development") {
  const { worker } = require("./mocks/browser");
  worker.start();
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
