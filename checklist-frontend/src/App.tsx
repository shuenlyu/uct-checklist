import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import "./styles/darkmode.css"; // IMPORTANT: Import the dark mode CSS
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext"; // IMPORTANT: Import ThemeProvider
import store from "./redux";
import Content from "./routes";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider> {/* IMPORTANT: Wrap with ThemeProvider */}
        <AuthProvider>
          <Router>
            <Content />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;