// routes/index.tsx - Updated with In Flight Checklists menu
import React, { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import About from '../pages/About';
import Edit from '../pages/Edit';
import Home from '../pages/Home';
import InFlight from '../pages/InFlight';  // NEW: Import InFlight component
import Login from '../pages/Login';
import Results from '../pages/Results';
import Run from '../pages/Run';

import Loading from "../components/Loading";
import { useAuth } from '../contexts/AuthContext';
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

export const NavBar = () => (
  <div className="flex space-x-6">
    <NavLink 
      to="/"
      className={({ isActive }) =>
        `px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive 
            ? 'bg-white bg-opacity-20 text-white' 
            : 'text-white hover:bg-white hover:bg-opacity-10'
        }`
      }
    >
      My Checklists
    </NavLink>
    <NavLink 
      to="/inflight"
      className={({ isActive }) =>
        `px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive 
            ? 'bg-white bg-opacity-20 text-white' 
            : 'text-white hover:bg-white hover:bg-opacity-10'
        }`
      }
    >
      In Flight Checklists
    </NavLink>
    <NavLink 
      to="/about"
      className={({ isActive }) =>
        `px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive 
            ? 'bg-white bg-opacity-20 text-white' 
            : 'text-white hover:bg-white hover:bg-opacity-10'
        }`
      }
    >
      About
    </NavLink>
  </div>
);

const NoMatch = () => (
  <>
    <h1>404</h1>
  </>
);

const getGroup = (arr: string[]): string | null => {
  let group = null;
  if (arr.includes("ChecklistGenerator_AllSites")) {
    group = "ALL_SITES";
  } else if (arr.includes("ChecklistGenerator_UCAP")) {
    group = "UCAP";
  } else if (arr.includes("ChecklistGenerator_UCTM")) {
    group = "UCTM";
  } else if (arr.includes("ChecklistGenerator_UCME")) {
    group = "UCME";
  }
  return group;
};

const ProtectedRoutes = () => {
  const { fetchData } = useApi();
  const navigate = useNavigate();
  const { user, setUser, userGroup, setUserGroup, loading, setLoading } = useAuth();

  Logger.info("======ProtectedRoutes started!!");

  useEffect(() => {
    // OPTIONAL: Keep development mode bypass for local testing only
    // Remove this entire if block if you want to force Okta authentication everywhere
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_AUTH === 'true') {
      Logger.info("🚀 ProtectedRoutes: Development mode with auth skip detected");
      Logger.info("🚀 ProtectedRoutes: Current user from AuthContext:", user);
      Logger.info("🚀 ProtectedRoutes: Current userGroup from AuthContext:", userGroup);
      
      // In development with skip auth, trust the AuthContext user (already set by AuthContext)
      if (user && userGroup) {
        Logger.info("✅ ProtectedRoutes: Using mock user from AuthContext");
        setLoading(false);
        return;
      }
      
      // If somehow user is not set in development, set it manually
      if (!user) {
        Logger.info("🔧 ProtectedRoutes: Setting fallback mock user");
        const mockUser = {
          id: 'dev-user',
          name: 'Development User',
          email: 'dev@localhost',
          groups: 'ALL_SITES'
        };
        setUser(mockUser);
        setUserGroup('ALL_SITES');
        setLoading(false);
      }
      return;
    }

    // PRODUCTION MODE - Okta authentication
    if (!user && loading) {
      Logger.info("🔐 ProtectedRoutes: Checking authentication with Okta - fetching user from /getMe");
      fetchData('/getMe')
        .then((res) => {
          Logger.info("===getMe fetchData response===", res);
          if (res.data && res.data.user) {
            Logger.info("===getMe fetchData: setUser===", res.data.user);
            const groupArray: string[] = res.data.user?.group ? res.data.user.group : [];
            const user_group = getGroup(groupArray);
            setUserGroup(user_group);
            setUser(res.data.user);
            setLoading(false);
          } else {
            Logger.info("===getMe fetchData: no user found - navigate to login ===");
            navigate('/login');
            setLoading(false);
          }
        })
        .catch((err) => {
          Logger.error("===getMe err: ", err);
          Logger.info("Authentication failed - redirecting to login");
          navigate('/login');
          setLoading(false);
        });
    }
  }, [fetchData, navigate, user, loading, userGroup, setUserGroup, setUser, setLoading]);

  if (loading) {
    Logger.info("🔄 ProtectedRoutes: Still loading authentication...");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  Logger.debug("==== ProtectedRoute: Final user check: ", user);
  Logger.debug("==== ProtectedRoute: Final userGroup: ", userGroup);
  
  // OPTIONAL: Keep development bypass for final user check
  // Remove this if block if you want to force Okta authentication everywhere
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_AUTH === 'true') {
    Logger.info("🚀 ProtectedRoutes: Development mode - bypassing final user check");
    return <Outlet />
  }
  
  // PRODUCTION MODE - Require authenticated user
  if (!user) {
    Logger.info("❌ ProtectedRoutes: No authenticated user found, redirecting to login");
    return <Navigate to="/login" />
  }

  Logger.info("✅ ProtectedRoutes: User authenticated successfully, showing protected routes");
  return <Outlet />
}

const Content = (): React.ReactElement => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/run/:id" element={<Run />} />
    <Route element={<ProtectedRoutes />}>
      <Route path="/" element={<Home />} />
      <Route path="/inflight" element={<InFlight />} />  {/* NEW: In Flight Checklists route */}
      <Route path="/about" element={<About />} />
      <Route path="/edit/:id" element={<Edit />} />
      <Route path="/results/:id" element={<Results />} />
    </Route>
    <Route element={<NoMatch />} />
  </Routes>
);

export default Content;