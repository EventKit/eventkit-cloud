import React from 'react';
import {  browserHistory, Router, Route, IndexRoute } from 'react-router';
import Application from './components/Application';
import About from './components/About'
import Exports from './components/Exports'
import Export from './components/Export'
import CreateExport from './components/CreateExport'
import ExportAOI from './components/ExportAOI'
import ExportInfo from './components/ExportInfo'

export default (
    <Router history={browserHistory}>
        <Route path="/" component={Application}>
            <Route path="/exports" component={Exports}>
                <Route path="/export/:uid" component={Export} />
            </Route>
            <Route path="/create" component={CreateExport} >
                <Route path="/exportAOI" component={ExportAOI} />
                <Route path="/exportInfo" component={ExportInfo} />
            </Route>
            <Route path="/about" component={About} />
        </Route>
    </Router>
);