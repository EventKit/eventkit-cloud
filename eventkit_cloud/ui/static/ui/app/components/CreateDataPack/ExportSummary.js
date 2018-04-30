import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import ScaleLine from 'ol/control/scaleline';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';

import Paper from 'material-ui/Paper';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import CustomScrollbar from '../CustomScrollbar';
import CustomTableRow from '../CustomTableRow';
import ol3mapCss from '../../styles/ol3map.css';
import Joyride from 'react-joyride';
import { Config } from '../../config';

export class ExportSummary extends Component {
    constructor(props) {
        super(props);
        this.expandedChange = this.expandedChange.bind(this);
        this.state = {
            expanded: false,
            steps: [],
            isRunning: false,
        };
        this.callback = this.callback.bind(this);
    }

    componentDidMount(){

        const steps = Config.JOYRIDE.ExportSummary;
        this.joyrideAddSteps(steps);
    }

    componentWillReceiveProps(nextProps) {

        if(nextProps.walkthroughClicked == true && this.state.isRunning == false)
        {
            this.refs.joyride.reset(true);
            this.setState({isRunning: true});
        }

    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.expanded !== this.state.expanded) {
            if (this.state.expanded) {
                this.initializeOpenLayers();
            }
        }
    }

    expandedChange(expanded) {
        this.setState({ expanded });
    }

    initializeOpenLayers() {
        const base = new Tile({
            source: new XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT,
            }),
        });

        this.map = new Map({
            interactions: interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false,
            }),
            layers: [base],
            target: 'summaryMap',
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            controls: [
                new ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
                new Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' ')
                }),
            ],
        });
        const source = new VectorSource({ wrapX: true });
        const geojson = new GeoJSON();
        const feature = geojson.readFeatures(this.props.geojson, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeatures(feature);
        const layer = new VectorLayer({
            source,
        });

        this.map.addLayer(layer);
        this.map.getView().fit(source.getExtent(), this.map.getSize());
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState(currentState => {
            currentState.steps = currentState.steps.concat(newSteps);
            return currentState;
        });
    }

    callback(data) {
        if(data.action === 'close' || data.action === 'skip' || data.type === 'finished'){
            this.setState({ isRunning: false });
            this.props.onWalkthroughReset();
            this.refs.joyride.reset(true);
        }
    }

    handleJoyride() {
        if(this.state.isRunning === true){
            this.refs.joyride.reset(true);
        }
        else {
            this.setState({isRunning: true})
        }
    }

    render() {
        const {steps, isRunning} = this.state;

        const style = {
            root: {
                width: '100%',
                backgroundImage: 'url('+require('../../../images/topoBackground.jpg')+')',
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                height: window.innerHeight - 191,
            },
            form: {
                margin: '0 auto',
                width: window.innerWidth < 800 ? '90%' : '60%',
            },
            paper: {
                margin: '0 auto',
                padding: '20px',
                marginTop: '30px',
                marginBottom: '30px',
                width: '100%',
                maxWidth: '700px',
                overflow: 'hidden',
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '5px',
            },
            subHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: '#8b9396',
                paddingBottom: '10px',
            },
            exportHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: 'black',
                fontWeight: 'bold',
                paddingTop: '25px',
                paddingBottom: '10px',
            },
            mapCard: {
                paddingBottom: '20px',
                paddingTop: '15px',
            },
            map: {
                width: '100%',
            },
        };

        const formats = [];
        this.props.allFormats.forEach((format) => {
            if (this.props.formats.includes(format.slug)) {
                formats.push(format.name);
            }
        });
        const formatDesc = formats.join(', ');

        const providers = this.props.providers.filter(provider => (provider.display !== false));
        return (
            <div id="root" style={style.root}>
                <Joyride
                    callback={this.callback}
                    ref={'joyride'}
                    debug={false}
                    steps={steps}
                    autoStart={true}
                    type={'continuous'}
                    disableOverlay
                    showSkipButton={true}
                    showStepsProgress={true}
                    locale={{
                        back: (<span>Back</span>),
                        close: (<span>Close</span>),
                        last: (<span>Done</span>),
                        next: (<span>Next</span>),
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}/>
                <CustomScrollbar>
                    <form id="form" style={style.form} className="qa-ExportSummary-form">
                        <Paper className="qa-ExportSummary-Paper" style={style.paper} zDepth={2} rounded>
                            <div id="mainHeading" className="qa-ExportSummary-mainHeading" style={style.heading}>Preview and Run Export</div>
                            <div id="subHeading" style={style.subHeading} className="qa-ExportSummary-subHeading">
                                Please make sure all the information below is correct.
                            </div>
                            <div className="qa-ExportSummary-div">
                                <div id="export-information-heading" className="qa-ExportSummary-exportHeading" style={style.exportHeading}>
                                    Export Information
                                </div>
                                <CustomTableRow
                                    className="qa-ExportSummary-name"
                                    title="Name"
                                    data={this.props.exportName}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-description"
                                    title="Description"
                                    data={this.props.datapackDescription}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-project"
                                    title="Project / Category"
                                    data={this.props.projectName}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-formats"
                                    title="File Formats"
                                    data={formatDesc}
                                />
                                <CustomTableRow
                                    className="qa-ExportSummary-sources"
                                    title="Data Sources"
                                    data={providers.map(provider => <p style={{ width: '100%' }} key={provider.uid}>{provider.name}</p>)}
                                />
                                <div id="aoi-heading" className="qa-ExportSummary-aoiHeading" style={style.exportHeading}>
                                    Area of Interest (AOI)
                                </div>
                                <CustomTableRow
                                    className="qa-ExportsSummary-area"
                                    title="Area"
                                    data={this.props.areaStr}
                                />
                            </div>
                            <div id="aoi-map" className="qa-ExportSummary-map" style={style.mapCard}>
                                <Card
                                    className="qa-ExportSummary-Card"
                                    expandable
                                    onExpandChange={this.expandedChange}
                                >
                                    <CardHeader
                                        className="qa-ExportSummary-CardHeader"
                                        title="Selected Area of Interest"
                                        actAsExpander
                                        showExpandableButton
                                        style={{ padding: '12px 10px 10px', backgroundColor: 'rgba(179, 205, 224, .2)' }}
                                        textStyle={{ paddingRight: '6px', fontWeight: 'bold', fontSize: '18px' }}
                                    />
                                    <CardText
                                        className="qa-ExportSummary-CardText"
                                        expandable
                                        style={{ padding: '5px', backgroundColor: 'rgba(179, 205, 224, .2)' }}
                                    >
                                        <div id="summaryMap" style={style.map} />
                                    </CardText>
                                </Card>
                            </div>
                        </Paper>
                    </form>
                </CustomScrollbar>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportName: state.exportInfo.exportName,
        datapackDescription: state.exportInfo.datapackDescription,
        projectName: state.exportInfo.projectName,
        providers: state.exportInfo.providers,
        areaStr: state.exportInfo.areaStr,
        formats: state.exportInfo.formats,
    };
}

ExportSummary.contextTypes = {
    config: PropTypes.object,
};

ExportSummary.propTypes = {
    geojson: PropTypes.object,
    exportName: PropTypes.string,
    datapackDescription: PropTypes.string,
    projectName: PropTypes.string,
    providers: PropTypes.array,
    areaStr: PropTypes.string,
    formats: PropTypes.array,
    allFormats: PropTypes.array,
    walkthrough: React.PropTypes.bool,
    onWalkthroughReset: React.PropTypes.func,
};

export default connect(
    mapStateToProps,
    null,
)(ExportSummary);
