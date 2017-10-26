import 'openlayers/dist/ol.css';
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import CustomScrollbar from '../CustomScrollbar'
import Paper from 'material-ui/Paper'
import ol3mapCss from '../../styles/ol3map.css';
import Joyride from 'react-joyride';

export class ExportSummary extends Component {
    constructor(props) {
        super(props)
        this.state = {
            expanded: false,
            steps: [],
            isRunning: false,
        }
        this.callback = this.callback.bind(this);
    }

    expandedChange(expanded) {
        this.setState({expanded: expanded});
    }

    componentDidMount(){
        const tooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf'
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },
            button: {
                color: 'white',
                backgroundColor: '#4598bf'
            },
            skip: {
                color: '#8b9396'
            },
            back: {
                color: '#8b9396'
            },
            hole: {
                backgroundColor: 'rgba(226,226,226, 0.2)',
            }
        }

        const steps = [
            {
                title: 'Verify Information',
                text: 'Verify the information entered is correct before proceeding.',
                selector: '.qa-ExportSummary-div',
                position: 'bottom',
                style: tooltipStyle,
            }, {
                title: 'Go Back to Edit',
                text: 'If you need to make changes before submitting, use the small blue arrow to navigate back.',
                selector: '.qa-BreadcrumbStepper-FloatingActionButton-previous',
                position: 'bottom',
                style: tooltipStyle,
            },
            {
                title: 'Submit DataPack',
                text: 'Once ready, click the large green button to kick off the DataPack submission process.<br>You will be redirected to the Status and Download page.',
                selector: '.qa-BreadcrumbStepper-FloatingActionButton-case2',
                position: 'bottom',
                style: tooltipStyle,
            },
        ];

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
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers();
            }
        }
    }

    _initializeOpenLayers() {
        const base = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT
            })
        });

        this._map = new ol.Map({
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false
            }),
            layers: [base],
            target: 'summaryMap',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            controls: [
                new ol.control.ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
                new ol.control.Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new ol.control.Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' ')
                }),
            ],
        });
        const source = new ol.source.Vector({wrapX: true});
        const geojson = new ol.format.GeoJSON();
        const feature = geojson.readFeatures(this.props.geojson, {
            'featureProjection': 'EPSG:3857',
            'dataProjection': 'EPSG:4326'
        });
        source.addFeatures(feature);
        const layer = new ol.layer.Vector({
            source: source,
        });

        this._map.addLayer(layer);
        this._map.getView().fit(source.getExtent(), this._map.getSize());
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
        if(data.index === 0 && data.type === 'tooltip:before') {

        }

        if(data.index === 2 && data.type === 'tooltip:before') {

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

        const style ={
            root : {
                width:'100%',
                backgroundImage: 'url('+require('../../../images/topoBackground.jpg')+')',
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                height: window.innerHeight - 191
            },
            form : {
                margin: '0 auto',
                width:  window.innerWidth < 800 ? '90%' : '60%',
            },
            paper : {
                margin: '0 auto',
                padding: '20px',
                marginTop: '30px',
                marginBottom: '30px',
                width: '100%',
                maxWidth: '700px',
                overflow: 'hidden'
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '5px'
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
            tdHeading: {
                verticalAlign: 'top',
                padding: '10px',
                height:'35px',
                fontSize: '16px',
                width: '33%',
                backgroundColor: '#f8f8f8',
                fontWeight: 'bold',
                color: 'black'
            },
            tdData: {
                padding: '10px',
                height: '35px',
                fontSize: '16px',
                width: '66%',
                backgroundColor: '#f8f8f8',
                fontWeight: 'normal',
                color: '#8b9396'
            },
            table: {
                width: '100%',
                height: '100%',
                border: '0px solid black',
                borderSpacing: '5px',
                borderCollapse: 'separate'
            },
            mapCard : {
                paddingBottom: '20px',
                paddingTop: '15px'
            },
            map : {
                width: '100%',
            }

        }

        let formatDesc = '';
        this.props.allFormats.forEach((format) => {
            if(format.slug == this.props.formats) {
                formatDesc = format.name;
            };
        });

        const providers = this.props.providers.filter((provider) => {
            return provider.display != false;
        });
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
                    <form id="form" style={style.form} className={'qa-ExportSummary-form'}>
                        <Paper className={'qa-ExportSummary-Paper'}  style={style.paper} zDepth={2} rounded>
                            <div id='mainHeading' className={'qa-ExportSummary-mainHeading'} style={style.heading}>Preview and Run Export</div>
                            <div id='subHeading' style={style.subHeading} className={'qa-ExportSummary-subHeading'}>
                                Please make sure all the information below is correct.
                            </div>
                            <div className={'qa-ExportSummary-div'}>
                                <div id="export-information-heading" className={'qa-ExportSummary-exportHeading'} style={style.exportHeading}>
                                    Export Information
                                </div>
                                <table style={style.table} id='export-information'>
                                    <tbody>
                                        <tr id='name'className={'qa-ExportSummary-tr-name'}>
                                            <td style={style.tdHeading}>Name</td>
                                            <td style={style.tdData}>{this.props.exportName}</td>
                                        </tr>
                                        <tr id='description' className={'qa-ExportSummary-tr-description'}>
                                            <td style={style.tdHeading}>Description</td>
                                            <td style={style.tdData}>{this.props.datapackDescription}</td>
                                        </tr>
                                        <tr id='project'  className={'qa-ExportSummary-tr-category'}>
                                            <td style={style.tdHeading}>Project&nbsp;/ Category</td>
                                            <td style={style.tdData}>{this.props.projectName}</td>
                                        </tr>
                                        <tr id='published' className={'qa-ExportSummary-tr-published'}>
                                            <td style={style.tdHeading}>Published</td>
                                            <td style={style.tdData}>{this.props.makePublic.toString()}</td>
                                        </tr>
                                        <tr id='formats' className={'qa-ExportSummary-tr-formats'}>
                                            <td style={style.tdHeading}>File Formats</td>
                                            <td style={style.tdData}>{formatDesc}</td>
                                        </tr>
                                        <tr id='layers'  className={'qa-ExportSummary-tr-layers'}>
                                            <td style={style.tdHeading} rowSpan={providers.length}>Layer Data</td>
                                            <td style={style.tdData}>{providers.map((provider) => <p key={provider.uid}>{provider.name}</p>)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div id='aoi-heading' className={'qa-ExportSummary-aoiHeading'} style={style.exportHeading}>
                                    Area of Interest (AOI)
                                </div>
                                <table style={style.table} id='aoi-area' className={'qa-ExportSummary-tr-area'}>
                                    <tbody>
                                        <tr>
                                            <td style={style.tdHeading}>Area</td>
                                            <td style={style.tdData}>{this.props.area_str}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div id='aoi-map' className={'qa-ExportSummary-map'} style={style.mapCard}>
                                <Card className={'qa-ExportSummary-Card'}expandable={true}
                                      onExpandChange={this.expandedChange.bind(this)}>
                                    <CardHeader
                                        className={'qa-ExportSummary-CardHeader'}
                                        title="Selected Area of Interest"
                                        actAsExpander={true}
                                        showExpandableButton={true}
                                        style={{padding: '12px 10px 10px', backgroundColor: 'rgba(179, 205, 224, .2)'}}
                                        textStyle={{paddingRight: '6px', fontWeight: 'bold', fontSize: '18px'}}
                                    />
                                    <CardText
                                        className={'qa-ExportSummary-CardText'}
                                        expandable={true}
                                        style={{padding: '5px', backgroundColor: 'rgba(179, 205, 224, .2)'}}>
                                        <div id="summaryMap" style={style.map}></div>
                                    </CardText>
                                </Card>
                            </div>
                        </Paper>
                    </form>
                </CustomScrollbar>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportName: state.exportInfo.exportName,
        datapackDescription: state.exportInfo.datapackDescription,
        projectName: state.exportInfo.projectName,
        makePublic: state.exportInfo.makePublic,
        providers: state.exportInfo.providers,
        area_str: state.exportInfo.area_str,
        formats: state.exportInfo.formats,
    }
}

ExportSummary.contextTypes = {
    config: PropTypes.object
}

ExportSummary.propTypes = {
    geojson: PropTypes.object,
    exportName: PropTypes.string,
    datapackDescription: PropTypes.string,
    projectName: PropTypes.string,
    makePublic: PropTypes.bool,
    providers: PropTypes.array,
    area_str: PropTypes.string,
    formats: PropTypes.array,
    allFormats: PropTypes.array,
    walkthrough: React.PropTypes.bool,
    onWalkthroughReset: React.PropTypes.func,
}

export default connect(
    mapStateToProps,
    null
)(ExportSummary);

