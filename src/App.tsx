import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './views/app/AuthContext'

import Home from "./views/app/Home"
import Login from "./views/app/Login"
import FinishLogin from "./views/app/FinishLogin"
import Browse from "./views/app/Browse"
import Private from "./views/app/Private"
import Dashboard from "./views/app/Dashboard"
import Header from "./views/app/Header"
import Footer from "./views/app/Footer"
import Editor from "./views/app/Editor"
import Reader from "./views/app/Reader"
import About from "./views/app/About"

function App() {

  // Don't show the app in production yet.
  // Need to finish it first!
  if(!process.env.dev)
    return <>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <div style={{ textAlign: "center" }}><strong>Bookish</strong> is coming.</div>
    </>

  return <div className="bookish-app">
      <AuthProvider>
        <Router>
          <Header/>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/write" element={<Private><Dashboard/></Private>} />
            <Route path="/finishlogin" element={<FinishLogin/>} />
            <Route path="/read" element={<Browse/>} />
            <Route path="/read/:id/*" element={<Reader/>} />
            <Route path="/about" element={<About/>} />
            <Route path="/write/:id/*" element={<Editor/>} />
            <Route path="*" element={<p>Oops, this page doesn't exist.</p>} />
          </Routes>
          <Footer />
        </Router>
      </AuthProvider>
    </div>

}

ReactDOM.render(
  <App/>,
  document.body.appendChild(document.createElement("div"))
);