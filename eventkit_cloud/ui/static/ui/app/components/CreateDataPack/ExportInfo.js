import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import cookie from 'react-cookie';
import Joyride from 'react-joyride';

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

import Info from 'material-ui/svg-icons/action/info';
import NavigationRefresh from 'material-ui/svg-icons/navigation/refresh';
import { List, ListItem } from 'material-ui/List';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import CustomScrollbar from '../../components/CustomScrollbar';
import ProviderStatusIcon from './ProviderStatusIcon';
import { updateExportInfo, stepperNextEnabled, stepperNextDisabled } from '../../actions/exportsActions';
import BaseDialog from '../Dialog/BaseDialog';
import CustomTextField from '../CustomTextField';
import CustomTableRow from '../CustomTableRow';
import ol3mapCss from '../../styles/ol3map.css';
import BaseTooltip from '../BaseTooltip';
import { joyride } from '../../joyride.config';
import { getSqKmString } from '../../utils/generic';
import background from '../../../images/topoBackground.png';

export class ExportInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            projectionsDialogOpen: false,
            licenseDialogOpen: false,
            steps: [],
            isRunning: false,
            // we make a local copy of providers for editing
            providers: props.providers,
            refreshTooltipOpen: false,
        };
        this.onNameChange = this.onNameChange.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
        this.onProjectChange = this.onProjectChange.bind(this);
        this.hasRequiredFields = this.hasRequiredFields.bind(this);
        this.hasDisallowedSelection = this.hasDisallowedSelection.bind(this);
        this.initializeOpenLayers = this.initializeOpenLayers.bind(this);
        this.handleLicenseOpen = this.handleLicenseOpen.bind(this);
        this.callback = this.callback.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.handleProjectionsClose = this.handleProjectionsClose.bind(this);
        this.handleProjectionsOpen = this.handleProjectionsOpen.bind(this);
        this.handleRefreshTooltipOpen = this.handleRefreshTooltipOpen.bind(this);
        this.handleRefreshTooltipClose = this.handleRefreshTooltipClose.bind(this);
        this.expandedChange = this.expandedChange.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
        this.onRefresh = this.onRefresh.bind(this);
    }

    componentDidMount() {
        // if the state does not have required data disable next
        if (!this.hasRequiredFields(this.props.exportInfo) ||
            this.hasDisallowedSelection(this.props.exportInfo)) {
            this.props.setNextDisabled();
        }

        // calculate the area of the AOI
        const areaStr = getSqKmString(this.props.geojson);

        this.props.updateExportInfo({
            ...this.props.exportInfo,
            areaStr,
        });

        // make requests to check provider availability
        if (this.state.providers) {
            this.fetch = setInterval(this.state.providers.forEach((provider) => {
                if (provider.display === false) return;
                this.checkAvailability(provider);
            }), 30000);
        }
        const steps = joyride.ExportInfo;
        this.joyrideAddSteps(steps);
    }

    componentWillReceiveProps(nextProps) {
        // if currently in walkthrough, we want to be able to show the green forward button, so ignore these statements
        if (!nextProps.walkthroughClicked) {
        // if required fields are fulfilled enable next
            if (this.hasRequiredFields(nextProps.exportInfo) &&
                !this.hasDisallowedSelection(nextProps.exportInfo)) {
                if (!nextProps.nextEnabled) {
                    this.props.setNextEnabled();
                }
            } else if (nextProps.nextEnabled) {
                // if not and next is enabled it should be disabled
                this.props.setNextDisabled();
            }
        }
        if (nextProps.walkthroughClicked && !this.props.walkthroughClicked && !this.state.isRunning) {
            this.joyride.reset(true);
            this.setState({ isRunning: true });
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
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            exportName: e.target.value,
        });
    }

    onDescriptionChange(e) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            datapackDescription: e.target.value,
        });
    }

    onProjectChange(e) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            projectName: e.target.value,
        });
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

    onRefresh() {
        // make a copy of providers and set availability to empty json
        const providers = this.state.providers.map(provider => (
            { ...provider, availability: {} }
        ));
        // update state with the new copy of providers
        this.setState({ providers });

        // check all of providers again
        providers.forEach((provider) => {
            this.checkAvailability(provider);
        });
    }

    checkAvailability(provider) {
        // make a copy of the provider to edit
        const newProvider = { ...provider };

        const data = { geojson: this.props.geojson };
        const csrfmiddlewaretoken = cookie.load('csrftoken');
        axios({
            url: `/api/providers/${provider.slug}/status`,
            method: 'POST',
            data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            newProvider.availability = JSON.parse(response.data);
            newProvider.availability.slug = provider.slug;
            this.setState((prevState) => {
                // make a copy of state providers and replace the one we updated
                const providers = [...prevState.providers];
                providers.splice(providers.indexOf(provider), 1, newProvider);
                return { providers };
            });
        }).catch((error) => {
            console.log(error);
            newProvider.availability = {
                status: 'WARN',
                type: 'CHECK_FAILURE',
                message: "An error occurred while checking this provider's availability.",
            };
            newProvider.availability.slug = provider.slug;
            this.setState((prevState) => {
                // make a copy of state providers and replace the one we updated
                const providers = [...prevState.providers];
                providers.splice(providers.indexOf(provider), 1, newProvider);
                return { providers };
            });
        });
    }

    handleProjectionsClose() {
        this.setState({ projectionsDialogOpen: false });
    }

    handleProjectionsOpen() {
        this.setState({ projectionsDialogOpen: true });
    }

    handleLicenseOpen() {
        this.setState({ licenseDialogOpen: true });
    }

    handleLicenseClose() {
        this.setState({ licenseDialogOpen: false });
    }

    handleRefreshTooltipOpen() {
        this.setState({ refreshTooltipOpen: true });
        return false;
    }

    handleRefreshTooltipClose() {
        this.setState({ refreshTooltipOpen: false });
        return false;
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

    hasDisallowedSelection(exportInfo) {
        // if any unacceptable providers are selected return true, else return false
        return exportInfo.providers.some((provider) => {
            // short-circuiting means that this shouldn't be called until provider.availability
            // is populated, but if it's not, return false
            const providerState = this.state.providers.find(p => p.slug === provider.slug);
            if (!providerState) return false;
            return providerState.availability && providerState.availability.status.toUpperCase() === 'FATAL';
        });
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

        this.setState((currentState) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    callback(data) {
        const { action, step, type } = data;
        this.props.setNextDisabled();
        if (action === 'close' || action === 'skip' || type === 'finished') {
            this.setState({ isRunning: false });
            this.props.onWalkthroughReset();
            this.joyride.reset(true);
            window.location.hash = '';
        }

        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }

        if (data.index === 5 && data.type === 'tooltip:before') {
            this.props.setNextEnabled();
        }
    }


    render() {
        const formWidth = window.innerWidth < 800 ? '90%' : '60%';
        const { steps, isRunning } = this.state;

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
                backgroundImage: `url(${background})`,
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
            },
            form: {
                margin: '0 auto',
                width: formWidth,
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
                display: 'inline-block',
            },
            subHeading: {
                fontSize: '16px',
                color: 'black',
                alignContent: 'flex-start',
                display: 'inline-block',
                marginLeft: '20px',
            },
            textField: {
                backgroundColor: 'whitesmoke',
                width: '100%',
                marginTop: '15px',
            },
            listHeading: {
                height: '20px',
                fontSize: '16px',
                fontWeight: 300,
            },
            providerListHeading: {
                position: 'absolute',
                marginLeft: '10px',
            },
            refreshIcon: {
                marginBottom: '-4px',
                height: '18px',
                marginLeft: '5px',
                color: '#4999BD',
                cursor: 'pointer',
            },
            listItem: {
                fontWeight: 'normal',
                padding: '16px 16px 16px 45px',
                fontSize: '16px',
                marginBottom: '0',
            },
            providerLicense: {
                fontSize: '13px',
                borderTop: '1px solid rgb(224, 224, 224)',
                paddingLeft: '66px',
                marginLeft: '0',
            },
            serviceDescription: {
                fontSize: '13px',
                borderTop: '1px solid rgb(224, 224, 224)',
                paddingLeft: '44px',
                marginLeft: '0',
            },
            sectionBottom: {
                paddingBottom: '30px',
            },
            checkboxLabel: {
                display: 'inline-flex',
            },
            infoIcon: {
                marginLeft: '10px',
                height: '24px',
                width: '24px',
                cursor: 'pointer',
                display: 'inlineBlock',
                fill: '#4598bf',
                verticalAlign: 'middle',
            },
            mapCard: {
                padding: '15px 0px 20px',
            },
            map: {
                width: '100%',
            },
            editAoi: {
                fontSize: '15px',
                fontWeight: 'normal',
                verticalAlign: 'top',
                cursor: 'pointer',
                color: '#4598bf',
            },
            maxArea: {
                fontSize: '13px',
                borderTop: '1px solid rgb(224, 224, 224)',
                paddingLeft: '44px',
                marginLeft: '0',
            },
        };

        const providers = this.state.providers.filter(provider => (provider.display !== false));

        return (
            <div id="root" className="qa-ExportInfo-root" style={style.root}>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
                    locale={{
                        back: (<span>Back</span>),
                        close: (<span>Close</span>),
                        last: (<span>Done</span>),
                        next: (<span>Next</span>),
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}
                />
                <CustomScrollbar>
                    <form id="form" onSubmit={this.onSubmit} style={style.form} className="qa-ExportInfo-form">
                        <Paper
                            id="paper"
                            className="qa-ExportInfo-Paper"
                            style={style.paper}
                            zDepth={2}
                            rounded
                        >
                            <div className="qa-ExportInfo-general-info" id="GeneralInfo">
                                <div
                                    id="mainHeading"
                                    className="qa-ExportInfo-mainHeading"
                                    style={style.heading}
                                >
                                    Enter General Information
                                </div>
                                <div style={{ marginBottom: '30px' }}>
                                    <CustomTextField
                                        className="qa-ExportInfo-input-name"
                                        id="Name"
                                        name="exportName"
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
                                        id="Description"
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
                                        maxLength={250}
                                    />
                                    <CustomTextField
                                        className="qa-ExportInfo-input-project"
                                        id="Project"
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
                                </div>
                            </div>
                            <div id="layersHeader" className="qa-ExportInfo-layersHeader" style={style.heading}>Select Data Sources</div>
                            <div id="layersSubheader" style={style.subHeading}>You must choose <strong>at least one</strong></div>
                            <div style={style.sectionBottom}>
                                <div className="qa-ExportInfo-ListHeader" style={style.listHeading}>
                                    <span
                                        className="qa-ExportInfo-ListHeaderItem"
                                        style={style.providerListHeading}
                                    >
                                        DATA PROVIDERS
                                    </span>
                                    <span
                                        className="qa-ExportInfo-ListHeaderItem"
                                        style={{ marginLeft: '75%', position: 'relative' }}
                                    >
                                        AVAILABILITY
                                        <NavigationRefresh
                                            style={style.refreshIcon}
                                            onMouseOver={this.handleRefreshTooltipOpen}
                                            onMouseOut={this.handleRefreshTooltipClose}
                                            onFocus={this.handleRefreshTooltipOpen}
                                            onBlur={this.handleRefreshTooltipClose}
                                            onClick={this.onRefresh}
                                        />
                                        <BaseTooltip
                                            show={this.state.refreshTooltipOpen}
                                            title="RUN AVAILABILITY CHECK AGAIN"
                                            tooltipStyle={{
                                                right: '-150px',
                                                bottom: '35px',
                                            }}
                                            onMouseOver={this.handleRefreshTooltipOpen}
                                            onMouseOut={this.handleRefreshTooltipClose}
                                            onFocus={this.handleRefreshTooltipOpen}
                                            onBlur={this.handleRefreshTooltipClose}
                                            onClick={this.onRefresh}
                                        >
                                            <div>You may try to resolve errors by running the availability check again.</div>
                                        </BaseTooltip>
                                    </span>
                                </div>
                                <List
                                    id="ProviderList"
                                    className="qa-ExportInfo-List"
                                    style={{ width: '100%', fontSize: '16px' }}
                                >
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
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={this.handleLicenseOpen}
                                                                onKeyPress={this.handleLicenseOpen}
                                                                style={{ cursor: 'pointer', color: '#4598bf' }}
                                                            >
                                                                {provider.license.name}
                                                            </span>
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
                                                style={style.providerLicense}
                                            />);
                                        }
                                        nestedItems.push(<ListItem
                                            className="qa-ExportInfo-ListItem-provServDesc"
                                            key={nestedItems.length}
                                            primaryText={<div style={{ whiteSpace: 'pre-wrap' }}>{provider.service_description}</div>}
                                            disabled
                                            style={style.serviceDescription}
                                        />);
                                        nestedItems.push(<ListItem
                                            className="qa-ExportInfo-ListItem-provMaxAoi"
                                            key={nestedItems.length}
                                            primaryText={
                                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                                    <span style={{ fontWeight: 'bold' }}>Maximum selection area: </span>
                                                    {((provider.max_selection == null ||
                                                        provider.max_selection === '' ||
                                                        parseFloat(provider.max_selection) <= 0) ?
                                                        'unlimited' : `${provider.max_selection} km²`
                                                    )}
                                                </div>
                                            }
                                            disabled
                                            style={style.maxArea}
                                        />);

                                        const backgroundColor = (ix % 2 === 0) ? 'whitesmoke' : 'white';

                                        return (<ListItem
                                            className="qa-ExportInfo-ListItem"
                                            key={provider.uid}
                                            style={{ ...style.listItem, backgroundColor }}
                                            nestedListStyle={{ padding: '0px', backgroundColor }}
                                            primaryText={
                                                <div>
                                                    <span className="qa-ExportInfo-ListItemName" style={{ paddingRight: '10px' }}>
                                                        {provider.name}
                                                    </span>
                                                    <ProviderStatusIcon
                                                        id="ProviderStatus"
                                                        baseStyle={{ left: '80%' }}
                                                        tooltipStyle={{ zIndex: '1' }}
                                                        availability={provider.availability}
                                                    />
                                                </div>
                                            }
                                            leftCheckbox={<Checkbox
                                                className="qa-ExportInfo-CheckBox-provider"
                                                name={provider.name}
                                                style={{ left: '0px', paddingLeft: '10px' }}
                                                checked={
                                                    this.props.exportInfo.providers.map(x => x.name)
                                                        .indexOf(provider.name) !== -1
                                                }
                                                onCheck={this.onChangeCheck}
                                                checkedIcon={
                                                    <ActionCheckCircle
                                                        className="qa-ExportInfo-ActionCheckCircle-provider"
                                                        style={{ fill: '#55ba63' }}
                                                    />
                                                }
                                                uncheckedIcon={
                                                    <UncheckedCircle
                                                        className="qa-ExportInfo-UncheckedCircle-provider"
                                                        style={{ fill: '#4598bf' }}
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

                            <div
                                id="projectionHeader"
                                className="qa-ExportInfo-projectionHeader"
                                style={style.heading}
                            >
                                Select Projection
                            </div>
                            <div style={style.sectionBottom}>
                                <div id="Projections" className="qa-ExportInfo-projections" style={style.checkboxLabel}>
                                    <Checkbox
                                        className="qa-ExportInfo-CheckBox-projection"
                                        label="EPSG:4326 - World Geodetic System 1984 (WGS84)"
                                        name="EPSG:4326"
                                        checked
                                        labelStyle={{ fontWeight: 'normal', fontSize: '16px', width: '90%' }}
                                        style={{ display: 'inlineBlock' }}
                                        disabled
                                        checkedIcon={<ActionCheckCircle className="qa-ExportInfo-ActionCheckCircle-projection" />}
                                    />
                                    <Info
                                        className="qa-ExportInfo-Info-projection"
                                        onClick={this.handleProjectionsOpen}
                                        style={style.infoIcon}
                                    />
                                    <BaseDialog
                                        show={this.state.projectionsDialogOpen}
                                        title="Projection Information"
                                        onClose={this.handleProjectionsClose}
                                    >
                                        <div
                                            style={{ paddingBottom: '10px', wordWrap: 'break-word' }}
                                            className="qa-ExportInfo-dialog-projection"
                                        >
                                            All geospatial data provided by EventKit are in the
                                             World Geodetic System 1984 (WGS 84) projection.
                                             This projection is also commonly known by its EPSG code: 4326.
                                             Additional projection support will be added in subsequent versions.
                                        </div>
                                    </BaseDialog>
                                </div>
                            </div>
                            <div id="aoiHeader" className="qa-ExportInfo-AoiHeader" style={style.heading}>
                                Area of Interest (AOI)
                            </div>
                            <div style={style.sectionBottom}>
                                <CustomTableRow
                                    className="qa-ExportInfo-area"
                                    title="Area"
                                    data={this.props.exportInfo.areaStr}
                                    containerStyle={{ fontSize: '16px' }}
                                />
                                <div style={style.mapCard}>
                                    <Card
                                        expandable
                                        id="Map"
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
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={this.props.handlePrev}
                                                onKeyPress={this.props.handlePrev}
                                                style={style.editAoi}
                                            >
                                                Edit
                                            </span>
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
    config: PropTypes.object,
};

ExportInfo.propTypes = {
    geojson: PropTypes.object.isRequired,
    exportInfo: PropTypes.object.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    nextEnabled: PropTypes.bool.isRequired,
    handlePrev: PropTypes.func.isRequired,
    updateExportInfo: PropTypes.func.isRequired,
    setNextDisabled: PropTypes.func.isRequired,
    setNextEnabled: PropTypes.func.isRequired,
    walkthroughClicked: PropTypes.bool.isRequired,
    onWalkthroughReset: PropTypes.func.isRequired,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportInfo);
