// require('dotenv').config();
import React, { useEffect, useState } from "react";
import { Route, NavLink, Routes, useNavigate, Navigate, Outlet } from "react-router-dom";

import Home from '../pages/Home';
import About from '../pages/About';
import Run from '../pages/Run';
import Edit from '../pages/Edit';
import Results from '../pages/Results';
import Login from '../pages/Login';

import { useApi } from "../utils/api";
import Loading from "../components/Loading";
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

const ProtectedRoutes = () => {
  const { fetchData } = useApi();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<Record<string, string>>();

  Logger.info("======ProtectedRoutes started!!");

  useEffect(() => {
    fetchData('/getMe')
      .then((res) => {
        if (res.data.user) {
          Logger.info("===getMe fetchData: setUser===");
          setUser(res.data.user)
          setLoading(false)
        } else {
          Logger.info("===getMe fetchData: navigate to login ===");
          navigate('/login')
        }
      })
      .catch((err) => {
        Logger.error("===getMe err: ", err);
        navigate('/login')
      })
  }, [])

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
