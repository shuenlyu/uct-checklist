import { ReactElement } from "react";
import { NavBar } from "../routes";
import ThemeSelector from "./ThemeSelector";
import LogoutButton from "./LogoutButton";
// Import the logo image
import navlogo from "../OneUCT_Logo.png";

function Layout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Dark Blue Background */}
      <header className="bg-slate-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                {/* UCT Logo */}
                <div className="flex items-center">
                  <img
                    src={navlogo}
                    alt="UCT Logo"
                    className="h-10 w-auto"
                  />
                </div>
                <h1 className="text-xl font-semibold text-white">Checklist Manager</h1>
              </div>
              
              {/* Navigation Menu */}
              <nav className="flex">
                <NavBar />
              </nav>
            </div>

            {/* Right side - Theme and Logout */}
            <div className="flex items-center space-x-4">
              <ThemeSelector />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-8rem)]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 Ultra Clean Technology Holding Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

// ALTERNATIVE DARK BLUE OPTIONS:
// If you want different shades of dark blue, replace bg-blue-800 with:
// bg-blue-900 (darker)
// bg-blue-700 (slightly lighter) 
// bg-slate-800 (dark blue-gray)
// bg-indigo-800 (purple-blue)
// or custom: bg-[#1f4e79] (SharePoint-like blue)