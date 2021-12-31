import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './views/app/AuthContext'

import Home from "./views/app/Home"
import Login from "./views/app/Login"
import FinishLogin from "./views/app/FinishLogin"
import Browse from "./views/app/Browse"
import PrivateRoute from "./views/app/PrivateRoute"
import Dashboard from "./views/app/Dashboard"
import Header from "./views/app/Header"
import Footer from "./views/app/Footer"
import Editor from "./views/app/Editor"
import About from "./views/app/About"

function App() {
    return <div className="bookish-app">
        <Router>
          <AuthProvider>
            <Header/>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/login" component={Login} />
              <PrivateRoute exact path="/write" component={Dashboard} />
              <Route exact path="/finishlogin" component={FinishLogin} />
              <Route exact path="/read" component={Browse} />
              <Route exact path="/about" component={About} />
              <Route path="/book/:id" component={Editor} />
            </Switch>
            <Footer />
          </AuthProvider>
        </Router>
      </div>
}

ReactDOM.render(
  <App/>,
  document.body.appendChild(document.createElement("div"))
);