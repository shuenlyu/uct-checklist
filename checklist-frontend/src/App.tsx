import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Content from "./routes";
import store from "./redux";
import "./App.css";

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
