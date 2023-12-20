import navlogo from "../OneUCT_Logo.png";
import { NavBar } from "../routes";
import { ReactElement } from "react";

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
        <div>
          <div style={{ display: "flex", paddingRight: 20 }}>
            <label
              htmlFor="theme"
              style={{
                fontWeight: "600",
                margin: "auto",
                color: "#fff",
                paddingRight: 10,
              }}
            >
              Themes
            </label>
            <select
              name="theme"
              className="select-dropdown"
              defaultValue={
                (localStorage.getItem("theme") !== null
                  ? localStorage.getItem("theme")
                  : "0") as string
              }
              onChange={(e) => {
                localStorage.setItem("theme", e.target.value);
              }}
            >
              <option value="0">Default Light</option>
              <option value="1">Default Dark</option>
              <option value="2">Contrast Light</option>
              <option value="3">Contrast Dark</option>

              <option value="4">Borderless Dark Panelless</option>
              <option value="5">Borderless Dark</option>
              <option value="6">Borderless Light Panelless</option>
              <option value="7">Borderless Light</option>
              <option value="8">Contrast Dark Panelless</option>
              <option value="9">Contrast Light Panelless</option>
              <option value="10">Default Light Panelless</option>
              <option value="11">Double Border Dark Panelless</option>
              <option value="12">Double Border Dark</option>
              <option value="13">Double Border Light Panelless</option>
              <option value="14">Double BorderLight</option>
              <option value="15">Flat Dark Panelless</option>
              <option value="16">Flat Dark</option>
              <option value="17">Flat Light Panelless</option>
              <option value="18">Flat Light</option>
              <option value="19">Layered Dark Panelless</option>
              <option value="20">Layered Dark</option>
              <option value="21">Layered Light Panelless</option>
              <option value="22">Layered Light</option>
              <option value="23">Plain Dark Panelless</option>
              <option value="24">Plain Dark</option>
              <option value="25">Plain Light Panelless</option>
              <option value="26">Plain Light</option>
              <option value="27">Sharp Dark Panelless</option>
              <option value="28">Sharp Dark</option>
              <option value="29">Sharp LightPanelless</option>
              <option value="30">Sharp Light</option>
              <option value="31">Solid Dark Panelless</option>
              <option value="32">Solid Dark</option>
              <option value="33">Solid Light Panelless</option>
              <option value="34">Solid Light</option>
              <option value="35">Three Dimensional Dark Panelless</option>
              <option value="36">Three Dimensional Dark</option>
              <option value="37">Three Dimensional Light Panelless</option>
              <option value="38">Three Dimensional Light</option>
            </select>
          </div>
        </div>
      </header>
      <main className="sjs-client-app__content">{children}</main>
      <footer className="sjs-client-app__footer"></footer>
    </div>
  );
}

export default Layout;
