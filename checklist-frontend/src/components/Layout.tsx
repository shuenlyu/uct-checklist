import { ReactElement } from "react";
import { NavBar } from "../routes";
import ThemeSelector from "./ThemeSelector";
import LogoutButton from "./LogoutButton";
// Import the logo image
import navlogo from "../OneUCT_Logo.png";

function Layout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen theme-bg-primary">
      {/* Modern Header with Theme Support */}
      <header className="theme-bg-header shadow-lg">
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
                <h1 className="text-xl font-semibold theme-text-white">Checklist Manager</h1>
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
        <div className="theme-bg-secondary rounded-lg theme-shadow min-h-[calc(100vh-8rem)]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="theme-bg-secondary theme-border-light border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm theme-text-secondary">
            © 2025 Ultra Clean Technology Holding Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;