import React from 'react';
import { Route, IndexRoute } from 'react-router';
import Application from './components/Application';
import About from './components/About';
import Exports from './components/Exports'
import HomePage from './components/HomePage';
//import CatsPage from './components/cats/CatsPage';
//import CatPage from './components/cats/CatPage';

export default (
    <Route path="/" component={Application}>
        <IndexRoute component={HomePage} />
        <Route path="/exports" component={Exports} />
        <Route path="/about" component={About} />
    </Route>
);