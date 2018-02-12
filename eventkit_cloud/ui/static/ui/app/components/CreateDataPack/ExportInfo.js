import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import numeral from 'numeral';
import debounce from 'lodash/debounce';
import Info from 'material-ui/svg-icons/action/info';

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

import { List, ListItem } from 'material-ui/List';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import CustomScrollbar from '../../components/CustomScrollbar';
import { updateExportInfo, stepperNextEnabled, stepperNextDisabled } from '../../actions/exportsActions';
import BaseDialog from '../BaseDialog';
import CustomTextField from '../CustomTextField';
import ol3mapCss from '../../styles/ol3map.css';
import Joyride from 'react-joyride';


export class ExportInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            formatsDialogOpen: false,
            projectionsDialogOpen: false,
            licenseDialogOpen: false,
            layers: [],
            steps: [],
            isRunning: false,
        };
        this.onNameChange = this.onNameChange.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
        this.onProjectChange = this.onProjectChange.bind(this);
        this.hasRequiredFields = this.hasRequiredFields.bind(this);
        this.initializeOpenLayers = this.initializeOpenLayers.bind(this);
        this.callback = this.callback.bind(this);
        this.setLicenseOpen = this.setLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.handleFormatsClose = this.handleFormatsClose.bind(this);
        this.handleFormatsOpen = this.handleFormatsOpen.bind(this);
        this.handleProjectionsClose = this.handleProjectionsClose.bind(this);
        this.handleProjectionsOpen = this.handleProjectionsOpen.bind(this);
        this.expandedChange = this.expandedChange.bind(this);
        this.toggleCheckbox = this.toggleCheckbox.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
    }

    componentDidMount() {
        // if the state does not have required data disable next
        if (!this.hasRequiredFields(this.props.exportInfo)) {
            this.props.setNextDisabled();
        }

        // calculate the area of the AOI
        const areaStr = this.setArea();

        // Will need to change this once we are allowing other formats
        // since formats is checked and disabled we can't track user selection
        const formats = [];
        formats.push(this.refs.formatsCheckbox.props.name);
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            areaStr,
            formats,
        });

        // set up debounce functions for user text input
        this.nameHandler = debounce((event) => {
            this.props.updateExportInfo({
                ...this.props.exportInfo,
                exportName: event.target.value,
            });
        }, 250);

        this.descriptionHandler = debounce((event) => {
            this.props.updateExportInfo({
                ...this.props.exportInfo,
                datapackDescription: event.target.value,
            });
        }, 250);

        this.projectHandler = debounce((event) => {
            this.props.updateExportInfo({
                ...this.props.exportInfo,
                projectName: event.target.value,
            });
        }, 250);

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
                title: 'Enter General Information',
                text: 'Enter the general details and identifying information about the datapack.',
                selector: '.qa-ExportInfo-input-name',
                position: 'bottom',
                style: tooltipStyle,
            },
            {
                title: 'Choose your sources',
                text: 'Choose the data sources desired for the datapack.',
                selector: '.qa-ExportInfo-List',
                position: 'left',
                style: tooltipStyle,
            },
            {
                title: 'Go to next step',
                text: 'Once the information is entered, move to the next step in the create process by clicking the green arrow button.',
                selector: '.qa-BreadcrumbStepper-FloatingActionButton-case1',
                position: 'left',
                style: tooltipStyle,
            },
        ];

        this.joyrideAddSteps(steps);
    }

   componentWillReceiveProps(nextProps) {
       //if currently in walkthrough, we want to be able to show the green forward button, so ignore these statements
       if(nextProps.walkthroughClicked != true) {
        // if required fields are fulfilled enable next
        if (this.hasRequiredFields(nextProps.exportInfo)) {
            if (!nextProps.nextEnabled) {
                this.props.setNextEnabled();
            }
        } else if (nextProps.nextEnabled) {
            // if not and next is enabled it should be disabled
            this.props.setNextDisabled();
        }
    }
       if(nextProps.walkthroughClicked == true && this.state.isRunning == false) {
           this.refs.joyride.reset(true);
           this.setState({isRunning: true});
       }

   }

    componentDidUpdate(prevProps, prevState) {
        // if the user expaned the AOI section mount the map
        if (prevState.expanded !== this.state.expanded) {
            if (this.state.expanded) {
                this.initializeOpenLayers();
            }
        }
    }

    onNameChange(e) {
        e.persist();
        this.nameHandler(e);
    }

    onDescriptionChange(e) {
        e.persist();
        this.descriptionHandler(e);
    }

    onProjectChange(e) {
        e.persist();
        this.projectHandler(e);
    }

    onChangeCheck(e) {
        // current array of providers
        const providers = [...this.props.exportInfo.providers];
        const propsProviders = this.props.providers;
        let index;
        // check if the check box is checked or unchecked
        if (e.target.checked) {
            // add the provider to the array
            for (let i = 0; i < propsProviders.length; i += 1) {
                if (propsProviders[i].name === e.target.name) {
                    providers.push(propsProviders[i]);
                    break;
                }
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = providers.map(x => x.name).indexOf(e.target.name);
            for (let i = 0; i < propsProviders.length; i += 1) {
                if (propsProviders[i].name === e.target.name) {
                    providers.splice(index, 1);
                }
            }
        }

        // update the state with the new array of options
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            providers,
        });
    }

    setArea() {
        const source = new VectorSource({ wrapX: true });
        const geojson = new GeoJSON();
        const features = geojson.readFeatures(this.props.geojson, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeatures(features);
        let area = 0;
        features.forEach((feature) => {
            area += feature.getGeometry().getArea() / 1000000;
        });
        const areaStr = numeral(area).format('0,0');
        return `${areaStr} sq km`;
    }

    setLicenseOpen() {
        this.setState({ licenseDialogOpen: true });
    }

    handleFormatsClose() {
        this.setState({ formatsDialogOpen: false });
    }

    handleFormatsOpen() {
        this.setState({ formatsDialogOpen: true });
    }

    handleProjectionsClose() {
        this.setState({ projectionsDialogOpen: false });
    }

    handleProjectionsOpen() {
        this.setState({ projectionsDialogOpen: true });
    }

    handleLicenseClose() {
        this.setState({ licenseDialogOpen: false });
    }

    toggleCheckbox(event, checked) {
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            makePublic: checked,
        });
    }

    expandedChange(expanded) {
        this.setState({ expanded });
    }

    hasRequiredFields(exportInfo) {
        // if the required fields are populated return true, else return false
        return exportInfo.exportName
            && exportInfo.datapackDescription
            && exportInfo.projectName
            && exportInfo.providers.length > 0;
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
            target: 'infoMap',
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
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' '),
                }),
            ],
        });
        const source = new VectorSource();
        const geojson = new GeoJSON();
        const features = geojson.readFeatures(this.props.geojson, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeatures(features);
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
        this.props.setNextDisabled();
        if(data.action === 'close' || data.action === 'skip' || data.type === 'finished'){
            this.setState({ isRunning: false });
            this.props.onWalkthroughReset();
            this.refs.joyride.reset(true);
        }
        if(data.index === 0 && data.type === 'tooltip:before') {

        }

        if(data.index === 2 && data.type === 'tooltip:before') {
            this.props.setNextEnabled();
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
            underlineStyle: {
                width: 'calc(100% - 10px)',
                left: '5px',
            },
            window: {
                height: window.innerHeight - 180,
            },
            root: {
                width: '100%',
                height: window.innerHeight - 180,
                backgroundImage: 'url('+require('../../../images/topoBackground.jpg')+')',
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
            },
            form: {
                margin: '0 auto',
                width: window.innerWidth < 800 ? '90%' : '60%',
                height: window.innerHeight - 180,
            },
            paper: {
                margin: '0px auto',
                padding: '20px',
                marginTop: '30px',
                marginBottom: '30px',
                width: '100%',
                maxWidth: '700px',
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '10px',
            },
            subHeading: {
                fontSize: '16px',
                color: 'black',
                alignContent: 'flex-start',
            },
            textField: {
                backgroundColor: 'whitesmoke',
                width: '100%',
                marginTop: '15px',
            },
            sectionBottom: {
                paddingBottom: '50px',
            },
            checkboxLabel: {
                display: 'inline-flex',
            },
            mapCard: {
                paddingBottom: '20px',
            },
            map: {
                width: '100%',
            },
        };

        const providers = this.props.providers.filter(provider => (provider.display !== false));

        // We only display geopackage as a format option for right now.
        const formats = this.props.formats.filter(format => (format.slug === 'gpkg'));

        return (
            <div id="root" className="qa-ExportInfo-root" style={style.root}>
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
                    <form id="form" onSubmit={this.onSubmit} style={style.form} className="qa-ExportInfo-form">
                        <Paper
                            id="paper"
                            className="qa-ExportInfo-Paper"
                            style={style.paper}
                            zDepth={2}
                            rounded
                        >
                            <div id="mainHeading" className="qa-ExportInfo-mainHeading" style={style.heading}>Enter General Information</div>
                            <CustomTextField
                                className="qa-ExportInfo-input-name"
                                id="nameField"
                                name="exportName"
                                ref="exportName"
                                underlineStyle={style.underlineStyle}
                                underlineFocusStyle={style.underlineStyle}
                                onChange={this.onNameChange}
                                defaultValue={this.props.exportInfo.exportName}
                                hintText="Datapack Name"
                                style={style.textField}
                                inputStyle={{ fontSize: '16px', paddingLeft: '5px' }}
                                hintStyle={{ fontSize: '16px', paddingLeft: '5px' }}
                                maxLength={100}
                            />
                            <CustomTextField
                                className="qa-ExportInfo-input-description"
                                id="descriptionField"
                                underlineStyle={style.underlineStyle}
                                underlineFocusStyle={style.underlineStyle}
                                name="datapackDescription"
                                onChange={this.onDescriptionChange}
                                defaultValue={this.props.exportInfo.datapackDescription}
                                hintText="Description"
                                multiLine
                                style={style.textField}
                                textareaStyle={{ fontSize: '16px', paddingLeft: '5px' }}
                                hintStyle={{ fontSize: '16px', paddingLeft: '5px' }}
                                maxLength={1000}
                            />
                            <CustomTextField
                                className="qa-ExportInfo-input-project"
                                id="projectField"
                                underlineStyle={style.underlineStyle}
                                underlineFocusStyle={style.underlineStyle}
                                name="projectName"
                                onChange={this.onProjectChange}
                                defaultValue={this.props.exportInfo.projectName}
                                hintText="Project Name"
                                style={style.textField}
                                inputStyle={{ fontSize: '16px', paddingLeft: '5px' }}
                                hintStyle={{ fontSize: '16px', paddingLeft: '5px' }}
                                maxLength={100}
                            />
                            <div>
                                <Checkbox
                                    className="qa-ExportInfo-CheckBox-publish"
                                    name="makePublic"
                                    onCheck={this.toggleCheckbox}
                                    defaultChecked={this.props.exportInfo.makePublic}
                                    style={{ left: '0px', paddingLeft: '5px', margin: '30px 0px' }}
                                    label="Make Public"
                                    labelStyle={{ fontWeight: 'normal', fontSize: '16px' }}
                                    checkedIcon={<ActionCheckCircle className="qa-ExportInfo-ActionCheckCircle" style={{ fill: '#55ba63' }} />}
                                    uncheckedIcon={<UncheckedCircle className="qa-ExportInfo-UncheckedCircle" style={{ fill: '4598bf' }} />}
                                />
                            </div>
                            
                            <div id="layersHeader" className="qa-ExportInfo-layersHeader" style={style.heading}>Select Data Sources</div>
                            <div id="layersSubheader" style={style.subHeading}>You must choose <strong>at least one</strong></div>
                            <div style={style.sectionBottom}>
                                <List className="qa-ExportInfo-List" style={{ width: '100%', fontSize: '16px' }}>
                                    {providers.map((provider, ix) => {
                                        // Show license if one exists.
                                        const nestedItems = [];
                                        if (provider.license) {
                                            nestedItems.push(<ListItem
                                                key={nestedItems.length}
                                                disabled
                                                primaryText={
                                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                                        <i>
                                                            Use of this data is governed by&nbsp;
                                                            <a onClick={this.setLicenseOpen} style={{ cursor: 'pointer', color: '#4598bf' }}>
                                                                {provider.license.name}
                                                            </a>
                                                        </i>
                                                        <BaseDialog
                                                            show={this.state.licenseDialogOpen}
                                                            title={provider.license.name}
                                                            onClose={this.handleLicenseClose}
                                                        >
                                                            <div style={{ whiteSpace: 'pre-wrap' }}>{provider.license.text}</div>
                                                        </BaseDialog>
                                                    </div>
                                                }
                                                style={{ fontSize: '13px', borderTop: '1px solid rgb(224, 224, 224)', paddingLeft: '66px', marginLeft: '0' }}
                                            />);
                                        }
                                        nestedItems.push(<ListItem
                                            className="qa-ExportInfo-ListItem-provServDesc"
                                            key={nestedItems.length}
                                            primaryText={<div style={{ whiteSpace: 'pre-wrap' }}>{provider.service_description}</div>}
                                            disabled
                                            style={{ fontSize: '13px', borderTop: '1px solid rgb(224, 224, 224)', paddingLeft: '44px', marginLeft: '0' }}
                                        />);

                                        const backgroundColor = (ix % 2 === 0) ? 'whitesmoke' : 'white';

                                        return (<ListItem
                                            className="qa-ExportInfo-ListItem"
                                            key={provider.uid}
                                            style={{ backgroundColor, fontWeight: 'normal', padding: '16px 16px 16px 45px', fontSize: '16px', marginBottom: '0' }}
                                            nestedListStyle={{ padding: '0px', backgroundColor }}
                                            primaryText={provider.name}
                                            leftCheckbox={<Checkbox
                                                className="qa-ExportInfo-CheckBox-provider"
                                                name={provider.name}
                                                style={{ left: '0px', paddingLeft: '5px' }}
                                                defaultChecked={this.props.exportInfo.providers.map(x => x.name).indexOf(provider.name) === -1 ? false : true}
                                                onCheck={this.onChangeCheck}
                                                checkedIcon={
                                                    <ActionCheckCircle
                                                        className="qa-ExportInfo-ActionCheckCircle-provider"
                                                        style={{ fill: '#55ba63', paddingLeft: '5px' }}
                                                    />
                                                }
                                                uncheckedIcon={
                                                    <UncheckedCircle
                                                        className="qa-ExportInfo-UncheckedCircle-provider"
                                                        style={{ fill: '#4598bf', paddingLeft: '5px' }}
                                                    />
                                                }
                                            />}
                                            initiallyOpen={false}
                                            primaryTogglesNestedList={false}
                                            nestedItems={nestedItems}
                                        />);
                                    })}
                                </List>
                            </div>

                            <div id="projectionHeader" className="qa-ExportInfo-projectionHeader" style={style.heading}>Select Projection</div>
                            <div style={style.sectionBottom}>
                                <div id="projectionCheckbox" style={style.checkboxLabel}>
                                    <Checkbox
                                        className="qa-ExportInfo-CheckBox-projection"
                                        label="EPSG:4326 - World Geodetic System 1984 (WGS84)"
                                        name="EPSG:4326"
                                        checked
                                        labelStyle={{ fontWeight: 'normal', fontSize: '16px', width: '90%' }}
                                        style={{ display: 'inlineBlock' }}
                                        disabled
                                        checkedIcon={<ActionCheckCircle className="qa-ExportInfo-ActionCheckCircle-projection" />}
                                    /><Info className="qa-ExportInfo-Info-projection" onTouchTap={this.handleProjectionsOpen} style={{ marginLeft: '10px', height: '24px', width: '24px', cursor: 'pointer', display: 'inlineBlock', fill: '#4598bf', verticalAlign: 'middle' }} />
                                    <BaseDialog
                                        show={this.state.projectionsDialogOpen}
                                        title="Projection Information"
                                        onClose={this.handleProjectionsClose}
                                    >
                                        <div style={{ paddingBottom: '10px', wordWrap: 'break-word' }} className="qa-ExportInfo-dialog-projection">
                                            All geospatial data provided by EventKit are in the World Geodetic System 1984 (WGS 84) projection. This projection is also commonly known by its EPSG code: 4326. Additional projection support will be added in subsequent versions.
                                        </div>
                                    </BaseDialog>
                                </div>
                            </div>

                            <div id="formatsHeader" className="qa-ExportInfo-formatsHeader" style={style.heading}>Select Export File Formats</div>
                            <div id="formatsCheckbox" style={style.sectionBottom}>
                                {formats.map(format => (
                                    <div key={format.slug} style={style.checkboxLabel}>
                                        <Checkbox
                                            className="qa-ExportInfo-CheckBox-formats"
                                            key={format.slug}
                                            ref="formatsCheckbox"
                                            label={format.name}
                                            labelStyle={{ fontWeight: 'normal', fontSize: '16px', width: '90%' }}
                                            name={format.slug}
                                            style={{ display: 'inlineBlock' }}
                                            defaultChecked
                                            disabled
                                            checkedIcon={<ActionCheckCircle />}
                                        /><Info onTouchTap={this.handleFormatsOpen} style={{ marginLeft: '10px', height: '24px', width: '24px', cursor: 'pointer', display: 'inlineBlock', fill: '#4598bf', verticalAlign: 'middle' }}/>
                                        <BaseDialog
                                            show={this.state.formatsDialogOpen}
                                            title="Format Information"
                                            onClose={this.handleFormatsClose}
                                        ><div style={{ paddingBottom: '20px', wordWrap: 'break-word' }}>
                                            EventKit provides all geospatial data in the GeoPackage (.gpkg) format. Additional format support will be added in subsequent versions.</div>
                                        </BaseDialog>
                                    </div>
                                ))}
                            </div>

                            <div style={style.mapCard}>
                                <Card
                                    expandable
                                    className="qa-ExportInfo-Card-map"
                                    onExpandChange={this.expandedChange}
                                >
                                    <CardHeader
                                        className="qa-ExportInfo-CardHeader-map"
                                        title="Selected Area of Interest"
                                        actAsExpander={false}
                                        showExpandableButton
                                        style={{ padding: '12px 10px 10px', backgroundColor: 'rgba(179, 205, 224, .2)' }}
                                        textStyle={{ paddingRight: '6px', fontWeight: 'bold', fontSize: '18px' }}
                                    >
                                        <a
                                            onClick={this.props.handlePrev}
                                            style={{ fontSize: '15px', fontWeight: 'normal', verticalAlign: 'top', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </a>
                                    </CardHeader>
                                    <CardText
                                        className="qa-ExportInfo-CardText-map"
                                        expandable
                                        style={{ padding: '5px', backgroundColor: 'rgba(179, 205, 224, .2)' }}
                                    >
                                        <div id="infoMap" style={style.map} />
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
        exportInfo: state.exportInfo,
        providers: state.providers,
        nextEnabled: state.stepperNextEnabled,
        formats: state.formats,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo));
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled());
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled());
        },
    };
}

ExportInfo.contextTypes = {
    config: React.PropTypes.object,
};

ExportInfo.propTypes = {
    geojson: PropTypes.object.isRequired,
    exportInfo: PropTypes.object.isRequired,
    providers: PropTypes.array.isRequired,
    nextEnabled: PropTypes.bool.isRequired,
    handlePrev: PropTypes.func.isRequired,
    updateExportInfo: PropTypes.func.isRequired,
    setNextDisabled: PropTypes.func.isRequired,
    setNextEnabled: PropTypes.func.isRequired,
    formats: React.PropTypes.array,
    walkthrough: React.PropTypes.bool,
    onWalkthroughReset: React.PropTypes.func,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportInfo);
