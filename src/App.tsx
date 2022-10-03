import React from 'react';
import ReactDOM from 'react-dom/client'
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
import Write from "./views/app/Write"
import Reader from "./views/app/Reader"
import ChangeEmail from './views/app/ChangeEmail';

import "./assets/css/bookish.css";
import "./assets/css/app.css";

function App() {

  // Don't show the app in production yet.
  // Need to finish it first!
  if(import.meta.env.PROD)
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
            <Route path="/email" element={<ChangeEmail/>} />
            <Route path="/read" element={<Browse/>} />
            <Route path="/read/:bookid/*" element={<Reader/>} />
            <Route path="/read/:bookid/:editionid/*" element={<Reader/>} />
            <Route path="/write/:bookid/*" element={<Private><Write/></Private>} />
            <Route path="/write/:bookid/:editionid/*" element={<Private><Write/></Private>} />
            <Route path="*" element={<p>Oops, this page doesn't exist.</p>} />
          </Routes>
          <Footer />
        </Router>
      </AuthProvider>
    </div>

}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);