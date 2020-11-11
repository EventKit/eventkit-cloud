import * as PropTypes from 'prop-types';
import * as React from 'react';
import {createStyles, Theme, withStyles, withTheme} from '@material-ui/core/styles';
import {connect} from 'react-redux';
import axios from 'axios';
import {arrayHasValue} from '../../utils/generic';
import {Step, StoreHelpers} from 'react-joyride';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Popover from '@material-ui/core/Popover';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import NavigationRefresh from '@material-ui/icons/Refresh';
import CustomScrollbar from '../common/CustomScrollbar';
import DataProvider from './DataProvider';
import MapCard from '../common/MapCard';
import {updateExportInfo} from '../../actions/datacartActions';
import {stepperNextDisabled, stepperNextEnabled} from '../../actions/uiActions';
import CustomTextField from '../common/CustomTextField';
import CustomTableRow from '../common/CustomTableRow';
import {joyride} from '../../joyride.config';
import {getSqKmString} from '../../utils/generic';
import BaseDialog from "../Dialog/BaseDialog";
import AlertWarning from '@material-ui/icons/Warning';
import {useDebouncedState, useEffectOnMount} from "../../utils/hooks/hooks";
import {useEffect} from "react";
import {useJobValidationContext} from "./context/JobValidation";
import RequestDataSource from "./RequestDataSource";
import {Link} from "@material-ui/core";
import {useState} from "react";
import EventkitJoyride from "../common/JoyrideWrapper";

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    underlineStyle: {
        width: 'calc(100% - 10px)',
        left: '5px',
    },
    window: {
        height: 'calc(100vh - 180px)',
    },
    root: {
        width: '100%',
        height: 'calc(100vh - 180px)',
        backgroundImage: `url(${theme.eventkit.images.topo_light})`,
        backgroundRepeat: 'repeat repeat',
        justifyContent: 'space-around',
        display: 'flex',
        flexWrap: 'wrap',
    },
    form: {
        margin: '0 auto',
        width: '90%',
        height: 'calc(100vh - 180px)',
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
        paddingBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        lineHeight: '25px',
    },
    textField: {
        marginTop: '15px',
        backgroundColor: theme.eventkit.colors.secondary,
    },
    input: {
        fontSize: '16px',
        paddingLeft: '5px',
        paddingRight: '50px',
    },
    listHeading: {
        fontSize: '16px',
        fontWeight: 300,
        display: 'flex',
        padding: '0px 10px',
    },
    refreshIcon: {
        height: '22px',
        marginLeft: '5px',
        cursor: 'pointer',
        verticalAlign: 'bottom',
    },
    sectionBottom: {
        paddingBottom: '30px',
    },
    projections: {
        display: 'block',
        lineHeight: '24px',
    },
    selectAll: {
        padding: '0px 10px 10px 16px',
        display: 'flex',
        lineHeight: '24px',
    },
    infoIcon: {
        height: '24px',
        width: '24px',
        cursor: 'pointer',
    },
    editAoi: {
        fontSize: '15px',
        fontWeight: 'normal',
        verticalAlign: 'top',
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
    },
    checkbox: {
        width: '24px',
        height: '24px',
        marginRight: '15px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
    },
    checked: {},
    stickyRow: {
        height: '50px',
        display: 'flex',
    },
    stickyRowItems: {
        flexGrow: 1,
    },
});

// Use this to keep track of incompatibilities in the user selected DataPack options
export interface IncompatibilityInfo {
    formats: {
        [slug: string]: {
            projections: number[]; // Map format slugs to the projection SRID's that it is NOT compatible with.
        }
    };
    projections: {
        [srid: number]: {
            formats: Eventkit.Format[]; // Map projection SRID's to the format it is NOT compatible with.
        }
    };
}

export interface Props {
    geojson: GeoJSON.FeatureCollection;
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    nextEnabled: boolean;
    handlePrev: () => void;
    updateExportInfo: (args: any) => void;
    setNextDisabled: () => void;
    setNextEnabled: () => void;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
    onUpdateEstimate?: () => void;
    projections: Eventkit.Projection[];
    formats: Eventkit.Format[];
    checkProvider: any;
}

export interface State {
    steps: Step[];
    isRunning: boolean;
    providers: Eventkit.Provider[];
    refreshPopover: null | HTMLElement;
    projectionCompatibilityOpen: boolean;
    displaySrid: number;  // Which projection is shown in the compatibility warning box
    selectedFormats: string[];
    incompatibilityInfo: IncompatibilityInfo;
    providerDrawerIsOpen: boolean;
    stepIndex: number;
}

export function hasRequiredFields(exportInfo: Eventkit.Store.ExportInfo) {
    // if the required fields are populated return true, else return false
    const {exportOptions} = exportInfo;
    const formatsAreSelected = exportInfo.providers.map((provider) => {
        return !!exportOptions[provider.slug]
            && exportOptions[provider.slug].formats
            && exportOptions[provider.slug].formats.length > 0;
    });
    return exportInfo.exportName
        && exportInfo.datapackDescription
        && exportInfo.projectName
        && exportInfo.providers.length > 0
        && exportInfo.projections.length > 0
        && formatsAreSelected.every(selected => selected);
}

export function hasDisallowedSelection(exportInfo: Eventkit.Store.ExportInfo) {
    // if any unacceptable providers are selected return true, else return false
    return exportInfo.providers.some((provider) => {
        // short-circuiting means that this shouldn't be called until provider.availability
        // is populated, but if it's not, return false
        const providerInfo = exportInfo.providerInfo[provider.slug];
        if (!providerInfo) {
            return false;
        }
        const {availability} = providerInfo;
        if (availability && availability.status) {
            return availability.status.toUpperCase() === 'FATAL';
        }
        return false;
    });
}

function StepValidator(props: Props) {
    const {setNextEnabled, setNextDisabled, walkthroughClicked, exportInfo, nextEnabled} = props;
    const {aoiHasArea, areEstimatesLoading, dataSizeInfo, aoiArea} = useJobValidationContext();
    const {exceedingSize = [], noMaxDataSize = []} = dataSizeInfo || {};

    useEffectOnMount(() => {
        setNextDisabled();
    });

    useEffect(() => {
        const validState = hasRequiredFields(exportInfo) && !hasDisallowedSelection(exportInfo);
        const providersValid = exportInfo.providers.every(provider => {
            // If the AOI is exceeded, check to see if the data size is exceeded.
            if (aoiArea > parseFloat(provider.max_selection)) {
                if (arrayHasValue(noMaxDataSize, provider.slug)) {
                    return false;
                }
                // The AOI is exceeded, and data size can be used.
                // Estimates can't be currently loading, and the provider must not be exceeding its data size
                return !areEstimatesLoading && !arrayHasValue(exceedingSize, provider.slug);
            }
            return true;
        });
        const setEnabled = !walkthroughClicked && aoiHasArea && validState && providersValid;
        if (setEnabled && !nextEnabled) {
            setNextEnabled();
        } else if (!setEnabled && nextEnabled) {
            setNextDisabled();
        }
    });

    return null;
}

export class ExportInfo extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };

    private helpers: StoreHelpers;
    joyride;
    dataProvider;
    private bounceBack: boolean;
    // joyride: React.RefObject<Joyride>;
    // dataProvider: React.RefObject<typeof DataProvider>;
    private CancelToken = axios.CancelToken;
    private source = this.CancelToken.source();

    constructor(props: Props) {
        super(props);
        this.state = {
            steps: [],
            isRunning: false,
            // we make a local copy of providers for editing
            providers: props.providers,
            refreshPopover: null,
            projectionCompatibilityOpen: false,
            displaySrid: null,
            selectedFormats: [],
            incompatibilityInfo: {
                formats: {},
                projections: {},
            } as IncompatibilityInfo,
            providerDrawerIsOpen: false,
            stepIndex: 0,
        };

        this.onNameChange = this.onNameChange.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
        this.onProjectChange = this.onProjectChange.bind(this);
        this.callback = this.callback.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
        this.onSelectAll = this.onSelectAll.bind(this);
        this.onSelectProjection = this.onSelectProjection.bind(this);
        this.onRefresh = this.onRefresh.bind(this);
        this.handlePopoverOpen = this.handlePopoverOpen.bind(this);
        this.handlePopoverClose = this.handlePopoverClose.bind(this);
        this.handleProjectionCompatibilityOpen = this.handleProjectionCompatibilityOpen.bind(this);
        this.handleProjectionCompatibilityClose = this.handleProjectionCompatibilityClose.bind(this);
        this.checkCompatibility = this.checkCompatibility.bind(this);
        this.checkSelectedFormats = this.checkSelectedFormats.bind(this);
        this.projectionHasErrors = this.projectionHasErrors.bind(this);
        this.getProjectionDialog = this.getProjectionDialog.bind(this);
        this.clearEstimate = this.clearEstimate.bind(this);
        this.deselect = this.deselect.bind(this);
        this.dataProvider = React.createRef();
        this.joyride = React.createRef();
        // this.dataProvider = React.createRef<typeof DataProvider>();
        // this.joyride = React.createRef<Joyride>();
    }

    componentDidMount() {
        // calculate the area of the AOI
        const areaStr = getSqKmString(this.props.geojson);

        const updatedInfo = {
            areaStr,
        } as Eventkit.Store.ExportInfo;

        const steps = joyride.ExportInfo as any[];
        this.joyrideAddSteps(steps);

        if (this.props.projections.find((projection) => projection.srid === 4326)) {
            if (this.props.exportInfo.projections && this.props.exportInfo.projections.length === 0) {
                updatedInfo.projections = [4326];
            }
        }
        this.props.updateExportInfo(updatedInfo);
    }

    componentWillUnmount(): void {
        this.source.cancel('Exiting Page.');
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        // if currently in walkthrough, we want to be able to show the green forward button, so ignore these statements
        const {exportInfo} = this.props;
        let nextState = {};

        if (this.props.walkthroughClicked && !prevProps.walkthroughClicked && !this.state.isRunning) {
            this.joyride?.current?.reset(true);
            this.setState({isRunning: true});
        }

        if (this.props.providers.length !== prevProps.providers.length) {
            this.setState({providers: this.props.providers});
        } else {
            const providerSlugs = this.props.providers.map(provider => provider.slug);
            const prevProviderSlugs = prevProps.providers.map(provider => provider.slug);
            if (providerSlugs.some(slug => !arrayHasValue(prevProviderSlugs, slug))) {
                this.setState({providers: this.props.providers});
            }
        }

        const selectedProjections = [...exportInfo.projections];
        const prevSelectedProjections = [...prevProps.exportInfo.projections];
        if (!ExportInfo.elementsEqual(selectedProjections, prevSelectedProjections)) {
            nextState = {
                ...nextState,
                ...this.checkCompatibility()
            };
        }
        nextState = {
            ...nextState,
            ...this.checkSelectedFormats(prevState)
        };
        if (Object.keys(nextState).length > 0) {
            this.setState({...nextState});
        }
    }

    static elementsEqual(array1, array2) {
        // To compare two arrays for equality, we check length for an early exit,
        // otherwise we sort them then compare element by element.
        if (array1.length !== array2.length) {
            return false;
        }
        // This code will only run if the arrays are the same length
        array1.sort();
        array2.sort();
        let valuesEqual = true;
        array1.forEach((item, index) => {
            if (item !== array2[index]) {
                valuesEqual = false;
                return;
            }
        });
        return valuesEqual;
    }

    private checkCompatibility() {
        const { formats } = this.props;
        const selectedProjections = this.props.exportInfo.projections;

        const formatMap = {};
        const projectionMap = {};
        formats.forEach(format => {
            const formatSupportedProjections = format.supported_projections.map(projection => projection.srid);
            selectedProjections.forEach(selectedProjection => {
                if (!formatMap[format.slug]){
                    formatMap[format.slug] = {projections: []};
                }
                if (!projectionMap[selectedProjection]){
                    projectionMap[selectedProjection] = {formats:[]};
                }
                if (!formatSupportedProjections.includes(selectedProjection)) {
                    projectionMap[selectedProjection].formats.push(format);
                    formatMap[format.slug].projections.push(selectedProjection);
                }
            });
        });

        return {
            incompatibilityInfo: {
                ...this.state.incompatibilityInfo,
                formats: formatMap,
                projections: projectionMap,
            }
        };
    }

    private checkSelectedFormats(prevState: State) {
        // exportInfo.providers is the list of selected providers, i.e. what will be included in the DataPack.
        // this.props.providers is the list of available providers.
        const exportOptions = this.props.exportInfo.exportOptions;
        const providers = [...this.props.exportInfo.providers];
        const getFormats = (formatArray) => {
            providers.forEach((provider) => {
                const providerOptions = exportOptions[provider.slug];
                if (providerOptions && !!providerOptions.formats) {
                    providerOptions.formats.forEach(formatSlug => {
                        if (formatArray.indexOf(formatSlug) < 0) {
                            formatArray.push(formatSlug);
                        }
                    });
                }
            });
        };
        const selectedFormats = [] as string[];
        getFormats(selectedFormats);
        if (!ExportInfo.elementsEqual(selectedFormats, prevState.selectedFormats)) {
            return {selectedFormats};
        }
    }

    private handleProjectionCompatibilityOpen(projection: Eventkit.Projection) {
        this.setState({
            // selectedFormats,
            displaySrid: projection.srid,
            projectionCompatibilityOpen: true,
        });
    }

    private handleProjectionCompatibilityClose() {
        this.setState({projectionCompatibilityOpen: false});
    }

    private handleDataProviderExpand() {
        this.dataProvider.current.handleExpand();
    }

    private onNameChange(value) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            exportName: value,
        });
    }

    private onDescriptionChange(value) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            datapackDescription: value,
        });
    }

    private onProjectChange(value) {
        // It feels a little weird to write every single change to redux
        // but the TextField (v0.18.7) does not size vertically to the defaultValue prop, only the value prop.
        // If we use value we cannot debounce the input because the user should see it as they type.
        this.props.updateExportInfo({
            projectName: value,
        });
    }

    private onChangeCheck(e: React.ChangeEvent<HTMLInputElement>) {
        // current array of providers
        const providers = [...this.props.exportInfo.providers];
        const propsProviders = this.props.providers;
        let index;
        // check if the check box is checked or unchecked
        if (e.target.checked) {
            // add the provider to the array
            for (const provider of propsProviders) {
                if (provider.name === e.target.name) {
                    providers.push(provider);
                    break;
                }
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = providers.map(x => x.name).indexOf(e.target.name);
            for (const provider of propsProviders) {
                if (provider.name === e.target.name) {
                    providers.splice(index, 1);
                }
            }
        }
        // update the state with the new array of options
        this.props.updateExportInfo({
            providers,
        });

    }

    private deselect(provider: Eventkit.Provider) {
        const providers = [...this.props.exportInfo.providers];
        const propsProviders = this.props.providers;
        let index;
        index = providers.map(x => x.name).indexOf(provider.name);
        for (const _provider of propsProviders) {
            if (provider.name === provider.name) {
                providers.splice(index, 1);
            }
        }

        // update the state with the new array of options
        this.props.updateExportInfo({
            providers,
        });
    }

    private onSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
        // current array of providers
        let providers = [];
        if (e.target.checked) {
            // set providers to the list of ALL providers
            providers = [...this.props.providers.filter(provider => provider.display)];
        }

        // update the state with the new array of options
        this.props.updateExportInfo({
            providers,
        });
    }

    private onSelectProjection(event) {
        // Selecting projections for the DataPack, here srid is spatial reference ID
        const selectedSrids = [...this.props.exportInfo.projections] || [];

        let index;
        // check if the check box is checked or unchecked
        // `target` is the checkbox, and the `name` field is set to the projection srid
        const selectedSrid = Number(event.target.name);
        if (event.target.checked) {
            // add the format to the array
            if (selectedSrids.indexOf(selectedSrid) <= 0) {
                selectedSrids.push(selectedSrid);
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = selectedSrids.indexOf(selectedSrid);
            if (index >= 0) {
                selectedSrids.splice(index, 1);
            }
        }
        // update the state with the new array of options
        this.props.updateExportInfo({
            projections: selectedSrids,
        });
    }

    private onRefresh() {
        // make a copy of providers and set availability to empty json
        this.props.providers.forEach(provider => this.props.checkProvider(provider));
    }

    private clearEstimate(provider: Eventkit.Provider) {
        const providerInfo = {...this.props.exportInfo.providerInfo} as Eventkit.Map<Eventkit.Store.ProviderInfo>;
        const updatedProviderInfo = {...providerInfo};

        const providerInfoData = updatedProviderInfo[provider.slug];
        if (!providerInfoData) {
            return; // Error handling, nothing needs to be done
        }

        updatedProviderInfo[provider.slug] = {
            ...providerInfoData,
            estimates: undefined,
        };

        this.props.updateExportInfo({
            providerInfo: updatedProviderInfo
        });
    }

    private handlePopoverOpen(e: React.MouseEvent<any>) {
        this.setState({refreshPopover: e.currentTarget});
    }

    private handlePopoverClose() {
        this.setState({refreshPopover: null});
    }

    private joyrideAddSteps(steps: Step[]) {
        const newSteps = steps;
        if (!newSteps.length) {
            return;
        }

        this.setState((currentState) => {
            const nextState = {...currentState};
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    private openDrawer() {
        const isOpen: boolean = this.dataProvider.current.open;
        if (this.state.providerDrawerIsOpen == null) {
            this.setState({providerDrawerIsOpen: isOpen});
        }
        if (!isOpen) {
            this.handleDataProviderExpand();
        }
    }

    private resetDrawer() {
        if (this.dataProvider.current.open !== this.state.providerDrawerIsOpen) {
            this.handleDataProviderExpand();
        }
        this.setState({providerDrawerIsOpen: null});
    }

    private callback(data: any) {
        const {
            action,
            type,
            step,
        } = data;

        this.props.setNextDisabled();

        if (action === 'close' || action === 'skip' || type === 'tour:end') {
            this.resetDrawer();
            this.setState({isRunning: false});
            this.props.onWalkthroughReset();
            this?.helpers.reset(true);
            window.location.hash = '';
        } else {
            if (data.index === 9 && data.type === 'tooltip:before') {
                this.props.setNextEnabled();
            }

            if ((step.selector === '.qa-DataProvider-ListItem-zoomSelection' && type === 'step:before') ||
                (step.selector === '.qa-DataProvider-ListItem-provFormats' && type === 'step:before')) {
                this.openDrawer();
            }
        }
        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }
    }

    private getProviders() {
        // During rapid state updates, it is possible that duplicate providers get added to the list.
        // They need to be deduplicated, so that they don't render duplicate elements or cause havoc on the DOM.
        let providers = this.state.providers.filter(provider => (!provider.hidden && provider.display));
        providers = [...new Map(providers.map(x => [x.slug, x])).values()];
        return providers;
    }

    private projectionHasErrors(srid: number) {
        const projectionInfo = this.state.incompatibilityInfo.projections[srid];
        if (!!projectionInfo) {
            return projectionInfo.formats.some(format => this.state.selectedFormats.indexOf(format.slug) >= 0);
        }
        return false;
    }

    private getProjectionDialog() {
        const incompatibilityInfo = this.state.incompatibilityInfo.projections[this.state.displaySrid];
        const formats = incompatibilityInfo.formats.filter(format => {
            return this.state.selectedFormats.indexOf(format.slug) >= 0;
        });
        return (<BaseDialog
            show={this.state.projectionCompatibilityOpen}
            title={`Format and Projection Conflict - EPSG:${this.state.displaySrid}`}
            onClose={this.handleProjectionCompatibilityClose}
        >
            <div
                style={{paddingBottom: '10px', wordWrap: 'break-word'}}
                className="qa-ExportInfo-dialog-projection"
            >
                <p><strong>This projection does not support the following format(s):</strong></p>
                <div style={{marginBottom: '10px'}}>
                    {formats.map(format => (
                        <div key={format.slug}>
                            {format.name}
                        </div>
                    ))}
                </div>
            </div>
        </BaseDialog>);
    }

    render() {
        const {colors} = this.props.theme.eventkit;
        const {classes} = this.props;
        const {projectionCompatibilityOpen, steps, isRunning} = this.state;

        // Move EPSG:4326 (if present -- it should always be) to the front so it displays first.
        let projections = [...this.props.projections];
        const indexOf4326 = projections.map(projection => projection.srid).indexOf(4326);
        if (indexOf4326 >= 1) {
            projections = [projections.splice(indexOf4326, 1)[0], ...projections];
        }

        return (
            <div id="root" className={`qa-ExportInfo-root ${classes.root}`}>
                {/*<PermissionsBanner isOpen={true} handleClosedPermissionsBanner={() => {}}/>*/}
                <StepValidator {...this.props}/>
                <EventkitJoyride
                    callback={this.callback}
                    ref={this.joyride}
                    steps={steps}
                    getHelpers={(helpers: any) => {
                        this.helpers = helpers
                    }}
                    continuous
                    showSkipButton
                    showProgress
                    locale={{
                        back: (<span>Back</span>) as any,
                        close: (<span>Close</span>) as any,
                        last: (<span>Done</span>) as any,
                        next: (<span>Next</span>) as any,
                        skip: (<span>Skip</span>) as any,
                    }}
                    run={isRunning}
                />
                <CustomScrollbar>
                    <form id="form" className={`qa-ExportInfo-form ${classes.form}`}>
                        <Paper
                            id="paper"
                            className={`qa-ExportInfo-Paper ${classes.paper}`}
                            elevation={2}
                        >
                            <div className="qa-ExportInfo-general-info" id="GeneralInfo">
                                <div
                                    id="mainHeading"
                                    className={`qa-ExportInfo-mainHeading ${classes.heading}`}
                                >
                                    Enter General Information
                                </div>
                                <div style={{marginBottom: '30px'}}>
                                    <DebouncedTextField
                                        className={`qa-ExportInfo-input-name ${classes.textField}`}
                                        id="Name"
                                        name="exportName"
                                        setValue={this.onNameChange}
                                        defaultValue={this.props.exportInfo.exportName}
                                        placeholder="Datapack Name"
                                        InputProps={{className: classes.input}}
                                        fullWidth
                                        maxLength={100}
                                    />
                                    <DebouncedTextField
                                        className={`qa-ExportInfo-input-description ${classes.textField}`}
                                        id="Description"
                                        name="datapackDescription"
                                        setValue={this.onDescriptionChange}
                                        defaultValue={this.props.exportInfo.datapackDescription}
                                        placeholder="Description"
                                        multiline
                                        inputProps={{style: {fontSize: '16px', lineHeight: '20px'}}}
                                        fullWidth
                                        maxLength={250}
                                        // eslint-disable-next-line react/jsx-no-duplicate-props
                                        InputProps={{className: classes.input, style: {lineHeight: '21px'}}}
                                    />
                                    <DebouncedTextField
                                        className={`qa-ExportInfo-input-project ${classes.textField}`}
                                        id="Project"
                                        name="projectName"
                                        setValue={this.onProjectChange}
                                        defaultValue={this.props.exportInfo.projectName}
                                        placeholder="Project Name"
                                        InputProps={{className: classes.input}}
                                        fullWidth
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                            <div className={classes.heading}>
                                <div
                                    id="layersHeader"
                                    className="qa-ExportInfo-layersHeader"
                                    style={{marginRight: '5px'}}
                                >
                                    Select Data Sources
                                </div>
                                <div
                                    id="layersSubheader"
                                    style={{fontWeight: 'normal', fontSize: '12px', fontStyle: 'italic'}}
                                >
                                    (You must choose <strong>at least one</strong>)
                                </div>
                            </div>
                            <div id="select" className={`qa-ExportInfo-selectAll ${classes.selectAll}`}>
                                <Checkbox
                                    classes={{root: classes.checkbox, checked: classes.checked}}
                                    name="SelectAll"
                                    checked={this.props.exportInfo.providers.length === this.props.providers.filter(
                                        provider => provider.display).length}
                                    onChange={this.onSelectAll}
                                    style={{width: '24px', height: '24px'}}
                                />
                                <span
                                    style={{
                                        padding: '0px 15px', display: 'flex',
                                        flexWrap: 'wrap', fontSize: '16px',
                                    }}
                                >
                                    Select All
                                </span>
                            </div>
                            <div className={classes.sectionBottom}>
                                <div className={`qa-ExportInfo-ListHeader ${classes.listHeading}`}>
                                    <div
                                        className="qa-ExportInfo-ListHeaderItem"
                                        style={{flex: '1 1 auto'}}
                                    >
                                        DATA PROVIDERS
                                    </div>
                                    <div
                                        className="qa-ExportInfo-ListHeaderItem"
                                        style={{display: 'flex', justifyContent: 'flex-end', position: 'relative'}}
                                    >
                                        <span>AVAILABILITY</span>
                                        <NavigationRefresh
                                            className={classes.refreshIcon}
                                            onMouseEnter={this.handlePopoverOpen}
                                            onMouseLeave={this.handlePopoverClose}
                                            onClick={this.onRefresh}
                                            color="primary"
                                        />
                                        <Popover
                                            style={{pointerEvents: 'none'}}
                                            PaperProps={{
                                                style: {padding: '16px'},
                                            }}
                                            open={Boolean(this.state.refreshPopover)}
                                            anchorEl={this.state.refreshPopover}
                                            onClose={this.handlePopoverClose}
                                            anchorOrigin={{
                                                vertical: 'top',
                                                horizontal: 'center',
                                            }}
                                            transformOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'center',
                                            }}
                                        >
                                            <div style={{maxWidth: 400}}>
                                                <Typography variant="h6" gutterBottom style={{fontWeight: 600}}>
                                                    RUN AVAILABILITY CHECK AGAIN
                                                </Typography>
                                                <div>You may try to resolve errors by running the availability check
                                                    again.
                                                </div>
                                            </div>
                                        </Popover>
                                    </div>
                                </div>
                                <List
                                    id="ProviderList"
                                    className="qa-ExportInfo-List"
                                    style={{width: '100%', fontSize: '16px'}}
                                >
                                    {this.getProviders().map((provider, ix) => (
                                        <DataProvider
                                            key={provider.slug + "-DataProviderList"}
                                            geojson={this.props.geojson}
                                            provider={provider}
                                            onChange={this.onChangeCheck}
                                            deselect={this.deselect}
                                            checked={this.props.exportInfo.providers.map(x => x.name)
                                                .indexOf(provider.name) !== -1}
                                            alt={ix % 2 === 0}
                                            renderEstimate={this.context.config.SERVE_ESTIMATES}
                                            checkProvider={() => {
                                                // Clear Provider Info since we will be checking.
                                                this.props.updateExportInfo({
                                                    providerInfo: {
                                                        ...this.props.exportInfo.providerInfo,
                                                        [provider.slug]: {
                                                            estimates: undefined,
                                                            availability: undefined,
                                                        },
                                                    }
                                                });
                                                // Ask parent to update the estimate (i.e. display loading icon).
                                                this.props.onUpdateEstimate();
                                                // Check the provider for updated info.
                                                this.props.checkProvider(provider).then(providerInfo => {
                                                    this.props.updateExportInfo({
                                                        providerInfo: {
                                                            ...this.props.exportInfo.providerInfo,
                                                            [provider.slug]: providerInfo.data,
                                                        }
                                                    });
                                                    // Trigger an estimate calculation update in the parent
                                                    // Does not re-request any data, calculates the total from available results.
                                                    this.props.onUpdateEstimate();
                                                });
                                            }}
                                            incompatibilityInfo={this.state.incompatibilityInfo}
                                            clearEstimate={this.clearEstimate}
                                            // Get reference to handle logic for joyride.
                                            {...(() => {
                                                const refProps = {} as any;
                                                if (ix === 0) {
                                                    refProps.getRef =(ref: any) => this.dataProvider.current = ref;
                                                }
                                                return refProps;
                                            })()}
                                        />
                                    ))}
                                </List>
                                <div className={classes.stickyRow}>
                                    <div className={classes.stickyRowItems}
                                         style={{paddingLeft: '5px', paddingTop: '15px'}}>
                                        <AddDataSource/>
                                    </div>
                                </div>
                            </div>
                            <div
                                id="projectionHeader"
                                className={`qa-ExportInfo-projectionHeader ${classes.heading}`}
                            >
                                Select Projection
                            </div>
                            <div className={classes.sectionBottom}>
                                <div id="Projections" className={`qa-ExportInfo-projections ${classes.projections}`}>
                                    {projections.map((projection, ix) => (
                                        <div
                                            key={projection.srid}
                                            style={{
                                                display: 'flex',
                                                padding: '16px 10px',
                                                backgroundColor: (ix % 2 === 0) ? colors.secondary : colors.white
                                            }}
                                        >
                                            <Checkbox
                                                className="qa-ExportInfo-CheckBox-projection"
                                                classes={{root: classes.checkbox, checked: classes.checked}}
                                                name={`${projection.srid}`}
                                                checked={this.props.exportInfo.projections.indexOf(projection.srid) !== -1}
                                                style={{width: '24px', height: '24px'}}
                                                onChange={this.onSelectProjection}
                                            />
                                            <span style={{padding: '0px 15px', display: 'flex', flexWrap: 'wrap'}}>
                                                EPSG:{projection.srid} - {projection.name}
                                            </span>
                                            {this.projectionHasErrors(projection.srid) &&
                                            <AlertWarning
                                                className={`qa-Projection-Warning-Icon`}
                                                onClick={() => {
                                                    this.handleProjectionCompatibilityOpen(projection);
                                                }}
                                                style={{
                                                    cursor: 'pointer', verticalAlign: 'middle',
                                                    marginLeft: '5px', height: '18px', width: '18px',
                                                    color: 'rgba(255, 162, 0, 0.87)'
                                                }}
                                            />
                                            }
                                        </div>
                                    ))}
                                    {projectionCompatibilityOpen &&
                                    this.getProjectionDialog()
                                    }
                                </div>
                            </div>
                            <div id="aoiHeader" className={`qa-ExportInfo-AoiHeader ${classes.heading}`}>
                                Area of Interest (AOI)
                            </div>
                            <div className={classes.sectionBottom}>
                                <CustomTableRow
                                    className="qa-ExportInfo-area"
                                    title="Area"
                                    containerStyle={{fontSize: '16px'}}
                                >
                                    {this.props.exportInfo.areaStr}
                                </CustomTableRow>
                                <div style={{padding: '15px 0px 20px'}}>
                                    <MapCard geojson={this.props.geojson}>
                                        <span style={{marginRight: '10px'}}>Selected Area of Interest</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={this.props.handlePrev}
                                            onKeyPress={this.props.handlePrev}
                                            className={classes.editAoi}
                                        >
                                            Edit
                                        </span>
                                    </MapCard>
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
        projections: [...state.projections],
        formats: [...state.formats],
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

function AddDataSource() {
    const [requestDataSourceOpen, setRequestDataSourceOpen] = useState(false);

    return (
        <>
            <RequestDataSource open={requestDataSourceOpen}
                               onClose={() => setRequestDataSourceOpen(false)}/>
            <Link onClick={() => setRequestDataSourceOpen(true)} style={{cursor: 'pointer'}}>
                Request New Data Source
            </Link>
        </>
    );
}

// Wrapper around the CustomTextField component that debounces the redux store call.
// This was done to avoid refactoring the entire component to hooks all at once.
// At a later point this could be removed and done in place.
function DebouncedTextField(props: any) {
    const {setValue, ...passThroughProps} = props;
    const [value, debounceValue] = useDebouncedState(props.defaultValue, 500);
    useEffect(() => {
        props.setValue(value);
    }, [value]);
    return (
        <CustomTextField
            onChange={e => debounceValue(e.target.value)}
            {...passThroughProps}
            className={`debounced-textField ${props.className ? props.className : ''}`}
        />
    )
}

export default withTheme(withStyles(jss)(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportInfo)));
