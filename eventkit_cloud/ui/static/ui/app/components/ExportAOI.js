import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import ol from 'openlayers'
import styles from './CreateExport.css'


export default class ExportAOI extends Component {

    componentDidMount() {

        let map = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            target: 'map',
            view: new ol.View({
                center: [0, 0],
                zoom: 2
            })
        });

    }

    render() {
        return (
            
                <div id="map" className={styles.map} ref="olmap"></div>
            
        );
    }

}