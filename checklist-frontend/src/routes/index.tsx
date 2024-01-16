import React, {useEffect, useState} from "react";
import {Route, NavLink, Routes, useNavigate, Navigate, Outlet} from "react-router-dom";

import Home from '../pages/Home';
import About from '../pages/About';
import Run from '../pages/Run';
import Edit from '../pages/Edit';
import Results from '../pages/Results';
import Login from '../pages/Login';

import {useApi} from "../utils/api";
import Loading from "../components/Loading";

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
  const {fetchData} = useApi();
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<Record<string, string>>()

  useEffect(() => {
    fetchData('/getMe')
      .then((res) => {
        if (res.data.user) {
          setUser(res.data.user)
          setLoading(false)
        } else {
          navigate('/login')
        }
      })
      .catch((err) => {
        navigate('/login')
      })
  }, [])

  if (loading) {
    return <Loading/>
  }

  if (!user) {
    return <Navigate to="/login"/>
  }

  return <Outlet/>
}

const Content = (): React.ReactElement => (
  <Routes>
    <Route element={<ProtectedRoutes/>}>
      <Route path="/" element={<Home/>}/>
      <Route path="/about" element={<About/>}/>
      <Route path="/run/:id" element={<Run/>}/>
      <Route path="/edit/:id" element={<Edit/>}/>
      <Route path="/results/:id" element={<Results/>}/>
    </Route>
    <Route path="/login" element={<Login/>}/>
    <Route element={<NoMatch/>}/>
  </Routes>
);

export default Content;
