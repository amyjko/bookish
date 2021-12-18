import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import { Container, Row, Col } from 'react-bootstrap'

import "bootstrap/dist/css/bootstrap.min.css"

import Home from "./views/Home"
import Login from "./views/Login"
import FinishLogin from "./views/FinishLogin"
import Browse from "./views/Browse"
import PrivateRoute from "./views/PrivateRoute"
import Dashboard from "./views/Dashboard"
import Header from "./views/Header"
import Footer from "./views/Footer"
import Book from "./views/Book"
import About from "./views/About"

function App() {
    return <>
      <Router>
        <AuthProvider>
          <Header/>
          <Container fluid className="p-5">
            <Row className="mt-2">
              <Col>
                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route exact path="/login" component={Login} />
                  <PrivateRoute exact path="/dashboard" component={Dashboard} />
                  <Route exact path="/finishlogin" component={FinishLogin} />
                  <Route exact path="/browse" component={Browse} />
                  <Route exact path="/about" component={About} />
                  <Route path="/book/:id" component={Book} />
                </Switch>
              </Col>
            </Row>
            <Row className="mt-5">
              <Footer />
            </Row>
          </Container>
        </AuthProvider>
      </Router>
    </>
}

ReactDOM.render(
  <App/>,
  document.body.appendChild(document.createElement("div"))
);