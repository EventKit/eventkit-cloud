import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import {findDOMNode} from 'react-dom'
import ol from 'openlayers'

export default class PrimaryMap extends Component {

    componentDidMount() {
        this._initializeOpenLayers()
         
        window.ol = ol
        window.map = this._map
        window.primaryMap = this
       
    }

    render() {
               return (
            <main ref="container" tabIndex="1">
                
            </main>
        )
    }

    _initializeOpenLayers() {
        

    }
}