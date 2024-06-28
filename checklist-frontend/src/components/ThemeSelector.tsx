import { useState, useEffect } from "react";
import { ThemeOption, themeOptions } from "../utils/themeOptions";

function ThemeSelector() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "0");

    useEffect(() => {
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <div className="theme-selector">
            <label htmlFor="theme" className="theme-selector__label">
                Themes
            </label>
            <select
                name="theme"
                className="select-dropdown"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
            >
                {themeOptions.map((option: ThemeOption) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
export default ThemeSelector;