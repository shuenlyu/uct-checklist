import navlogo from "../OneUCT_Logo.png";
import { NavBar } from "../routes";
import { ReactElement } from "react";
import ThemeSelector from "./ThemeSelector";
import LogoutButton from "./LogoutButton";

function Layout({ children }: { children: ReactElement }) {
  return (
    <div className="sjs-client-app">
      <header className="sjs-client-app__header">
        <div>
          <img
            src={navlogo}
            className="sjs-client-app__logo"
            alt="logo"
            height={"25px"}
          />
          <NavBar />
        </div>
        {/* <div>
          <div className="header-right-section">
            <ThemeSelector />
            <LogoutButton />
          </div>
        </div> */}
      </header>
      <main className="sjs-client-app__content">{children}</main>
      <footer className="sjs-client-app__footer"></footer>
    </div>
  );
}

export default Layout;
