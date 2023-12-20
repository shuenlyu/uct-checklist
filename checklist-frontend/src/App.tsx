import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Content, { NavBar } from "./routes";
import store from "./redux";
import "./App.css";
import navlogo from "./OneUCT_Logo.png";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Content />
      </Router>
    </Provider>
  );
}

export default App;
