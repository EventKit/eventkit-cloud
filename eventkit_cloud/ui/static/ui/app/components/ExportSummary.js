import 'openlayers/dist/ol.css';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../components/tap_events'
import Paper from 'material-ui/Paper'
import styles from '../styles/ExportSummary.css'

class ExportSummary extends React.Component {
    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    componentDidMount() {
        this._initializeOpenLayers();
    }

    _initializeOpenLayers() {

        const scaleStyle = {
            background: 'white',
        };


        this._map = new ol.Map({
            controls: [
                new ol.control.ScaleLine(),
                new ol.control.Attribution({
                    collapsible: false,
                    collapsed: false,
                }),
                new ol.control.Zoom({
                    className: styles.olZoom
                })
            ],
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false
            }),
            layers: [
                // Order matters here
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
            ],
            target: 'summaryMap',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2.5,
                minZoom: 2.5,
                maxZoom: 22,
            })
        });
    }


    render() {

        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>

                        <Paper className={styles.paper} zDepth={2} rounded>
                            <div id='mainHeading' className={styles.heading}>Preview and Run Export</div>
                            <div className={styles.subHeading}>
                            Please make sure all the information below is correct.
                            </div>

                            <div>
                                <table><tbody>
                                    <tr>
                                        <td className={styles.tdHeading}>Created By</td>
                                        <td className={styles.tdData}>Table Cell Data</td>
                                    </tr>
                                    <tr>
                                        <td className={styles.tdHeading}>Job Id</td>
                                        <td className={styles.tdData}>Table Cell Data</td>
                                    </tr>
                                </tbody>
                                </table>
                                <div className={styles.exportHeading}>
                                    Export Information
                                </div>
                                <table><tbody>
                                <tr>
                                    <td className={styles.tdHeading}>Name</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>Description</td>
                                    <td className={styles.tdData}>This description is a long one.  So long that it needs to take up two lines of the table.</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>Project/Category</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>Published</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>Layer Data</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>File Formats</td>
                                    <td className={styles.tdData}>Array[0]<br/>Array[1]<br/>Array[2]</td>
                                </tr>
                                </tbody>
                                </table>
                                <div className={styles.exportHeading}>
                                    Area of Interest (AOI)
                                </div>
                                <table><tbody>
                                <tr>
                                    <td className={styles.tdHeading}>Region</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>Area</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                </tbody>
                                </table>
                            </div>
                            <div id="summaryMap" className={styles.map} ref="olmap">

                            </div>

                        </Paper>


                </div>
            </div>


        )
    }
}


ExportSummary.propTypes = {

}
ExportSummary.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default (ExportSummary)

