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

function envToBool(variable: string | undefined) {
  return variable === 'true'
}
const DEBUG = envToBool(process.env.DEBUG);
if (DEBUG) console.log(process.env);

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

  if (DEBUG) console.log("======ProtectedRoutes started!!");

  useEffect(() => {
    fetchData('/getMe')
      .then((res) => {
        if (res.data.user) {
          if (DEBUG) console.log("===getMe fetchData: setUser===");
          setUser(res.data.user)
          setLoading(false)
        } else {
          if (DEBUG) console.log("===getMe fetchData: navigate to login ===");
          navigate('/login')
        }
      })
      .catch((err) => {
        if (DEBUG) console.log("===getMe err: ", err);
        navigate('/login')
      })
  }, [])

  if (loading) {
    return <Loading />
  }

  if (DEBUG) console.log("==== ProtectedRoute: user: ", user);
  if (!user) {
    return <Navigate to="/login" />
  }

  return <Outlet />
}

const Content = (): React.ReactElement => (
  <Routes>
    <Route path="/login" element={<Login />} />
    {/* <Route path="/run/:id" element={<Run />} /> */}
    <Route element={<ProtectedRoutes />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/run/:id" element={<Run />} />
      <Route path="/edit/:id" element={<Edit />} />
      <Route path="/results/:id" element={<Results />} />
    </Route>
    <Route element={<NoMatch />} />
  </Routes>
);

export default Content;
