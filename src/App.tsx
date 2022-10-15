import React from 'react';
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Path } from 'react-router-dom';
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

import { getSubdomain } from './views/util/getSubdomain';

import "./assets/css/bookish.css";
import "./assets/css/app.css";

type RouteSpec = { path: string, element: React.ReactElement }

export const RoutesContext = React.createContext<RouteSpec[]>([]);

function App() {

  const subdomain = getSubdomain();

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

  const routes: RouteSpec[] = [
      // Bare domains either go home, or if there is a subdomain, to a book
      { path: "/*", element: subdomain ? <Reader/> : <Home/> },
      { path: "/login", element: <Login/> },
      { path: "/write", element: <Private><Dashboard/></Private> },
      { path: "/finishlogin", element: <FinishLogin/> },
      { path: "/email", element: <ChangeEmail/> },
      { path: "/read", element: <Browse/> },
      { path: "/read/:bookid/*", element: <Reader/> },
      { path: "/read/:bookid/:editionid/*", element: <Reader/> },
      { path: "/write/:bookid/*", element: <Private><Write/></Private> },
      { path: "/write/:bookid/:editionid/*", element: <Private><Write/></Private> },
      // Map any route with a name that doesn't match the above to a reader, to see if it's a book.
      { path: "/:bookname/*", element: <Reader/> },
      { path: "*", element: <p>Oops, this page doesn't exist.</p> }
  ];

  return <div className="bookish-app">
      <AuthProvider>
        <RoutesContext.Provider value={routes}>
        <Router>
          <Header/>
            <Routes>
              { routes.map((route, index) => <Route key={index} path={route.path} element={route.element} />) }
            </Routes>
            <Footer />
        </Router>
        </RoutesContext.Provider>
      </AuthProvider>
    </div>

}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);