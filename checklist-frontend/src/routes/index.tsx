// require('dotenv').config();
import React, { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import About from '../pages/About';
import Edit from '../pages/Edit';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Results from '../pages/Results';
import Run from '../pages/Run';

import Loading from "../components/Loading";
import { useAuth } from '../contexts/AuthContext';
import { useApi } from "../utils/api";
import Logger from "../utils/logger";

export const NavBar = () => (
  <>
    <NavLink className="sjs-nav-button" to="/">
      <span>My Checklists</span>
    </NavLink>
    <NavLink className="sjs-nav-button" to="/about">
      <span>About</span>
    </NavLink>
  </>
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
  // const [loading, setLoading] = useState<boolean>(true);
  // const [user, setUser] = useState<Record<string, string>>();

  Logger.info("======ProtectedRoutes started!!");

  useEffect(() => {
    if (!user && loading) {
      fetchData('/getMe')
        .then((res) => {
          if (res.data.user) {
            Logger.info("===getMe fetchData: setUser===", res.data.user);
            const groupArray: string[] = res.data.user?.group ? res.data.user.group : [];
            const user_group = getGroup(groupArray);
            setUserGroup(user_group);
            setUser(res.data.user);
            setLoading(false);
          } else {
            Logger.info("===getMe fetchData: navigate to login ===");
            navigate('/login');
            setLoading(false);
          }
        })
        .catch((err) => {
          Logger.error("===getMe err: ", err);
          navigate('/login');
          setLoading(false);
        })
    }
  }, [fetchData, navigate, user, loading, userGroup, setUserGroup, setUser, setLoading]);

  if (loading) {
    return <Loading />
  }

  Logger.debug("==== ProtectedRoute: user: ", user);
  if (!user) {
    return <Navigate to="/login" />
  }

  return <Outlet />
}

const Content = (): React.ReactElement => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/run/:id" element={<Run />} />
    <Route element={<ProtectedRoutes />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/edit/:id" element={<Edit />} />
      <Route path="/results/:id" element={<Results />} />
    </Route>
    <Route element={<NoMatch />} />
  </Routes>
);

export default Content;
