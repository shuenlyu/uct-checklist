import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import store from "./redux";
import Content from "./routes";

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <Content />
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
