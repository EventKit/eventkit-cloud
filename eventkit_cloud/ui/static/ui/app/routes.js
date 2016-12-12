import React from 'react';
import { Route, IndexRoute } from 'react-router';
import Application from './components/Application';
import About from './components/About';
import Exports from './components/Exports'
import Export from './components/Export'
import HomePage from './components/HomePage';

export default (
    <Route path="/" component={Application}>
        <IndexRoute component={HomePage} />
        <Route path="/exports" component={Exports}>
            <Route path="/export/:uid" component={Export} />
        </Route>
        <Route path="/about" component={About} />
    </Route>
);