import { Component } from 'react';
import {Route} from 'react-router';
import history from '../../utils/history';
import {connect} from 'react-redux';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import isEqual from 'lodash/isEqual';
import Divider from '@mui/material/Divider';
import Warning from '@mui/icons-material/Warning';
import NavigationArrowBack from '@mui/icons-material/ArrowBack';
import NavigationArrowForward from '@mui/icons-material/ArrowForward';
import NavigationCheck from '@mui/icons-material/Check';
import ExportAOI from './ExportAOI';
import ExportInfo from './ExportInfo';
import ExportSummary from './ExportSummary';
import {flattenFeatureCollection} from '../../utils/mapUtils';
import {isZoomLevelInRange} from '../../utils/generic';
import {clearAoiInfo, clearExportInfo, clearJobInfo, submitJob} from '../../actions/datacartActions';
import {stepperNextDisabled} from '../../actions/uiActions';
import {getFormats} from '../../actions/formatActions';
import {getNotifications, getNotificationsUnreadCount} from '../../actions/notificationsActions';
import BaseDialog from '../Dialog/BaseDialog';
import ConfirmDialog from '../Dialog/ConfirmDialog';
import PageLoading from '../common/PageLoading';
import {Location} from 'history';
import {Fab, Typography} from "@mui/material";
import * as PropTypes from "prop-types";
import {getProjections} from "../../actions/projectionActions";
import {MapLayer} from "./CreateExport";
import EstimateLabel from "./EstimateLabel";
import {CreatePagePermissionsBanner} from "./CreatePagePermissionsBanner";
import {MatomoClickTracker} from "../MatomoHandler";
import Visibility = Eventkit.Permissions.Visibility;

export interface JobData {
    name: string;
    description: string;
    event: string;
    include_zipfile: boolean;
    provider_tasks: Eventkit.ProviderTask[];
    selection: GeoJSON.FeatureCollection;
    original_selection: GeoJSON.FeatureCollection;
    tags: [];
    projections: number[];
    visibility: Visibility;
}

export interface Props {
    aoiInfo: Eventkit.Store.AoiInfo;
    providers: Eventkit.Provider[];
    geojson: GeoJSON.FeatureCollection;
    stepperNextEnabled: boolean;
    exportInfo: Eventkit.Store.ExportInfo;
    submitJob: (data: JobData) => void;
    dataPack: Eventkit.FullRun;
    job: Eventkit.Job;
    getProviders: () => void;
    setNextDisabled: () => void;
    clearAoiInfo: () => void;
    clearExportInfo: () => void;
    clearJobInfo: () => void;
    jobFetched: boolean;
    jobError: object;
    jobuid: string;
    formats: Eventkit.Format[];
    getFormats: () => void;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    history: any;
    routes: typeof Route[];
    getNotifications: () => void;
    getNotificationsUnreadCount: () => void;
    theme: Eventkit.Theme & Theme;
    getProjections: () => void;
    projections: Eventkit.Projection[];
    tasks: Eventkit.Task[];
    breadCrumbStepperProps: any;
    mapLayers: MapLayer[];
    getEstimate: any;
    checkProvider: (args: any) => void;
    updateEstimate: () => void;
    sizeEstimate: number;
    timeEstimate: number;
    isCollectingEstimates: boolean;
}


export interface State {
    stepIndex: number;
    showError: boolean;
    error: any;
    loading: boolean;
    showLeaveWarningDialog: boolean;
    modified: boolean;
    estimateExplanationOpen: boolean;
    isLoading: boolean;
    selectedExports: string[];
    isBannerOpen: boolean;
}

export class BreadcrumbStepper extends Component<Props, State> {
    context: any;
    private leaveRoute: null | string;

    static defaultProps = {
        jobError: undefined,
        jobFetched: null,
    };

    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.getStepLabel = this.getStepLabel.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.submitDatapack = this.submitDatapack.bind(this);
        this.routeLeaveHook = this.routeLeaveHook.bind(this);
        this.handleLeaveWarningDialogCancel = this.handleLeaveWarningDialogCancel.bind(this);
        this.handleLeaveWarningDialogConfirm = this.handleLeaveWarningDialogConfirm.bind(this);
        this.setBannerOpen = this.setBannerOpen.bind(this);
        this.state = {
            stepIndex: 0,
            showError: false,
            error: null,
            loading: false,
            showLeaveWarningDialog: false,
            modified: false,
            estimateExplanationOpen: false,
            isLoading: false,
            selectedExports: [],
            isBannerOpen: false,
        };
        this.leaveRoute = null;
    }

    async componentDidMount() {
        // Clone will mount the stepper and we don't want it disabled
        // if there's information in the exportInfo props
        if (this.props.exportInfo.exportName === '') {
            this.props.setNextDisabled();
        }
        this.props.getProjections();
        this.props.getFormats();
        // const route = this.props.routes[this.props.routes.length - 1];
        // this.props.router.setRouteLeaveHook(route, this.routeLeaveHook);
    }

    componentDidUpdate(prevProps) {
        if (this.props.jobFetched && !prevProps.jobFetched) {
            this.props.clearJobInfo();
            this.props.getNotifications();
            this.props.getNotificationsUnreadCount();
            history.push(`/status/${this.props.jobuid}`);
        }
        if (this.props.jobError && !prevProps.jobError) {
            this.hideLoading();
            this.showError(this.props.jobError);
        }
        if (!isEqual(this.props.aoiInfo, prevProps.aoiInfo) ||
            !isEqual(this.props.exportInfo, prevProps.exportInfo)) {
            this.setState({modified: true});
        }
    }

    componentWillUnmount() {
        this.props.clearAoiInfo();
        this.props.clearExportInfo();
        this.props.clearJobInfo();
    }

    private setBannerOpen(shouldOpen: boolean) {
        this.setState({isBannerOpen: shouldOpen});
    }

    private getErrorMessage(title: string, detail: string, ix: number) {
        return (
            <div className="BreadcrumbStepper-error-container" key={`${title}-${detail}`}>
                {ix > 0 ? <Divider style={{marginBottom: '10px'}}/> : null}
                <p className="BreadcrumbStepper-error-title">
                    <Warning style={{
                        fill: this.props.theme.eventkit.colors.warning,
                        verticalAlign: 'bottom',
                        marginRight: '10px'
                    }}/>
                    <strong>
                        {title}
                    </strong>
                </p>
                <p className="BreadcrumbStepper-error-detail">
                    {detail}
                </p>
            </div>
        );
    }

    private getStepLabel(stepIndex: number) {
        const labelStyle = {
            color: this.props.theme.eventkit.colors.white,
            height: '50px',
            width: '60%',
            display: 'inline-flex',
            marginLeft: '24px',
            fontSize: '16px',
        };
        const textStyle = {
            color: this.props.theme.eventkit.colors.white,
            fontSize: '0.9em',
            width: '380px'
        };

        switch (stepIndex) {
            case 0:
                return (
                    <div className="qa-BreadcrumbStepper-step1Label" style={labelStyle}>
                        <Typography style={{...textStyle}}>
                            STEP 1 OF 3: Define Area of Interest
                        </Typography>
                    </div>
                );
            case 1:
                return (
                    <div className="qa-BreadcrumbStepper-step2Label" style={labelStyle}>
                        <Typography style={{...textStyle, display: 'inline'}}>
                            STEP 2 OF 3: Select Data & Formats
                        </Typography>
                    </div>
                );
            case 2:
                return (
                    <div className="qa-BreadcrumbStepper-step3Label" style={labelStyle}>
                        <Typography style={{...textStyle}}>
                            STEP 3 OF 3: Review & Submit
                        </Typography>
                    </div>
                );
            default:
                return (
                    <div className="qa-BreadcrumbStepper-stepErrorLabel" style={labelStyle}>
                        STEPPER ERROR
                    </div>
                );
        }
    }

    private getStepContent(stepIndex: number) {
        switch (stepIndex) {
            case 0:
                return (
                    <ExportAOI
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                        mapLayers={this.props.mapLayers}
                        isPermissionsBannerOpen={this.state.isBannerOpen}
                    />
                );
            case 1:
                return (
                    <ExportInfo
                        handlePrev={this.handlePrev}
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                        onUpdateEstimate={this.props.updateEstimate}
                        checkProvider={this.props.checkProvider}
                    />
                );
            case 2:
                return (
                    <ExportSummary
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                        formats={this.props.formats}
                    />
                );
            default:
                return null;
        }
    }

    private getPreviousButtonContent(stepIndex: number) {
        const styles = {
            arrowBack: {
                fill: stepIndex === 0 ? this.props.theme.eventkit.colors.secondary_dark : this.props.theme.eventkit.colors.primary,
                opacity: stepIndex === 0 ? 0.3 : 1,
                cursor: stepIndex === 0 ? 'default' : 'pointer',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
        };

        switch (stepIndex) {
            case 0:
                return (
                    <MatomoClickTracker
                        eventAction="Navigation"
                        eventName="Back Button - Step 1"
                    >
                        <NavigationArrowBack
                            id="Previous"
                            className="qa-BreadcrumbStepper-NavigationArrowBack-previous"
                            style={styles.arrowBack}
                            onClick={this.handlePrev}
                        />
                    </MatomoClickTracker>
                );
            case 1:
            case 2:
                return (
                    <MatomoClickTracker
                        eventAction="Navigation"
                        eventName={`Back Button - Step ${stepIndex + 1}`}
                    >
                        <Fab
                            size="small"
                            id="Previous"
                            color="primary"
                            className="qa-BreadcrumbStepper-Button-previous"
                            onClick={this.handlePrev}
                            style={styles.arrowBack}
                        >
                            <NavigationArrowBack
                                className="qa-BreadcrumbStepper-NavigationArrowBack-previous-case2"
                            />
                        </Fab>
                    </MatomoClickTracker>
                );
            default:
                return <div/>;
        }
    }

    private getButtonContent(stepIndex: number) {
        const btnStyle = {
            marginRight: '12px',
            verticalAlign: 'middle',
            boxShadow: 'none',
            transition: 'none',
            fill: this.props.theme.eventkit.colors.success,
            backgroundColor: this.props.stepperNextEnabled ?
                this.props.theme.eventkit.colors.success : this.props.theme.eventkit.colors.secondary
        };

        switch (stepIndex) {
            case 0:
            case 1:
                return (
                    <MatomoClickTracker
                        eventAction="Navigation"
                        eventName={`Next Button - Step ${stepIndex + 1}`}
                    >
                        <Fab
                            size="small"
                            id="Next"
                            color="primary"
                            className="qa-BreadcrumbStepper-Button-next"
                            disabled={!this.props.stepperNextEnabled}
                            onClick={this.handleNext}
                            style={btnStyle}
                        >
                            <NavigationArrowForward/>
                        </Fab>
                    </MatomoClickTracker>
                );
            case 2:
                return (
                    <MatomoClickTracker
                        eventAction="Submit Button"
                        eventName={`Submit DataPack`}
                    >
                        <Fab
                            size="small"
                            id="Next"
                            color="primary"
                            className="qa-BreadcrumbStepper-Button-next"
                            disabled={!this.props.stepperNextEnabled}
                            onClick={this.submitDatapack}
                            style={btnStyle}
                        >
                            <NavigationCheck className="qa-BreadcrumbStepper-NavigationCheck"/>
                        </Fab>
                    </MatomoClickTracker>
                );
            default:
                return <div/>;
        }
    }

    private routeLeaveHook(info: Location) {
        // Show warning dialog if we try to navigate away with changes.
        if (!this.state.modified || this.leaveRoute) {
            // No changes to lose, or we confirmed we want to leave.
            return true;
        }

        // We must have started making changes. Save the route we're trying to navigate to and show a warning.
        this.leaveRoute = info.pathname;
        this.setState({showLeaveWarningDialog: true});
        return false;
    }

    private submitDatapack() {
        this.setState({modified: false});
        this.showLoading();
        // wait a moment before calling handleSubmit because
        // flattenFeatureCollection may lock up the browser
        // and prevent loading icon from rendering
        window.setTimeout(this.handleSubmit, 100);
    }

    private handleSubmit() {
        const providerTasks = [];
        const {exportOptions} = this.props.exportInfo;
        const {providers, projections} = this.props.exportInfo;


        providers.forEach((provider) => {
            let minZoom = provider.level_from;
            let maxZoom = provider.level_to;
            let formats = ['gpkg'];  // Default to GPKG if nothing is passed through
            const options = exportOptions[provider.slug];
            if (options) {
                if (isZoomLevelInRange(options.minZoom, provider as Eventkit.Provider)) {
                    minZoom = Number(options.minZoom);
                }
                if (isZoomLevelInRange(options.maxZoom, provider as Eventkit.Provider)) {
                    maxZoom = Number(options.maxZoom);
                }
                if (options && options.formats) {
                    formats = options.formats;
                }
            }

            providerTasks.push({
                formats,
                provider: provider.slug, max_zoom: maxZoom, min_zoom: minZoom,
            });
        });

        const selection = flattenFeatureCollection(this.props.aoiInfo.geojson) as GeoJSON.FeatureCollection;

        const data: JobData = {
            projections,
            selection,
            name: this.props.exportInfo.exportName,
            description: this.props.exportInfo.datapackDescription,
            event: this.props.exportInfo.projectName,
            include_zipfile: false,
            provider_tasks: providerTasks,
            original_selection: this.props.aoiInfo.originalGeojson,
            tags: [],
            visibility: this.props.exportInfo.visibility,
        };
        this.props.submitJob(data);
    }

    private handleNext() {
        const {stepIndex} = this.state;
        this.setState({stepIndex: stepIndex + 1});
    }

    private handlePrev() {
        const {stepIndex} = this.state;
        if (stepIndex > 0) {
            this.setState({stepIndex: stepIndex - 1});
        }
    }

    private showError(error: any) {
        this.setState({showError: true, error});
        this.props.clearJobInfo();
    }

    private hideError() {
        this.setState({showError: false});
    }

    private showLoading() {
        this.setState({loading: true});
    }

    private hideLoading() {
        this.setState({loading: false});
    }

    private handleLeaveWarningDialogCancel() {
        this.setState({showLeaveWarningDialog: false});
        this.leaveRoute = null;
    }

    private handleLeaveWarningDialogConfirm() {
        this.props.history.push(this.leaveRoute);
    }

    render() {
        const {colors} = this.props.theme.eventkit;
        let message = [];
        if (this.state.error) {
            const responseError = {...this.state.error};
            const errors = [...responseError.errors];
            message = errors.map((error, ix) => (
                this.getErrorMessage(error.title, error.detail, ix)
            ));
            if (!message.length) {
                message.push(this.getErrorMessage('Error', 'An unknown error has occured', 0));
            }
        }

        return (
            <div className="qa-BreadcrumbStepper-top-level" style={{
                backgroundColor: colors.background,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
            }}>
                <div className="qa-BreadcrumbStepper-div-stepLabel"
                     style={{width: '100%', height: '50px', display: 'inline-block'}}
                >
                    <div style={{position: 'relative', display: 'flex'}}>
                        {this.getStepLabel(this.state.stepIndex)}
                        <div style={{marginLeft: 'auto', zIndex: 5, pointerEvents: 'none'}}>
                            <div
                                className="qa-BreadcrumbStepper-div-buttons"
                                style={{float: 'right', padding: '5px', pointerEvents: 'auto'}}
                            >
                                {this.getPreviousButtonContent(this.state.stepIndex)}
                                {this.getButtonContent(this.state.stepIndex)}
                            </div>
                        </div>
                        <EstimateLabel
                            show={this.context.config.SERVE_ESTIMATES}
                            step={this.state.stepIndex}
                            exportInfo={this.props.exportInfo}
                            sizeEstimate={this.props.sizeEstimate}
                            timeEstimate={this.props.timeEstimate}
                            isCollectingEstimates={this.props.isCollectingEstimates}
                        />
                    </div>
                </div>
                {!!this.props.providers && this.props.providers.length && (
                    <CreatePagePermissionsBanner
                        providers={this.props.providers}
                        setBannerOpen={this.setBannerOpen}
                        step={this.state.stepIndex}
                    />
                )}
                <div
                    className="qa-BreadcrumbStepper-div-stepContent"
                    style={{flex: 1}}
                >
                    {this.getStepContent(this.state.stepIndex)}
                </div>
                <BaseDialog
                    show={this.state.showError}
                    title="ERROR"
                    onClose={this.hideError}
                >
                    <div>{message}</div>
                </BaseDialog>
                <ConfirmDialog
                    show={this.state.showLeaveWarningDialog}
                    title="ARE YOU SURE?"
                    onCancel={this.handleLeaveWarningDialogCancel}
                    onConfirm={this.handleLeaveWarningDialogConfirm}
                    confirmLabel="Yes, I'm Sure"
                    isDestructive
                >
                    <strong>You haven&apos;t finished creating this DataPack yet. Any settings will be lost.</strong>
                </ConfirmDialog>
                {this.state.loading ?
                    <PageLoading background="transparent"/>
                    :
                    null
                }
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
        providers: state.providers.objects,
        stepperNextEnabled: state.stepperNextEnabled,
        exportInfo: state.exportInfo,
        jobFetched: state.submitJob.fetched,
        jobError: state.submitJob.error,
        jobuid: state.submitJob.jobuid,
        formats: state.formats,
        projections: state.projections,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        submitJob: (data) => {
            dispatch(submitJob(data));
        },
        getProjections: () => (
            dispatch(getProjections())
        ),
        setNextDisabled: () => {
            dispatch(stepperNextDisabled());
        },
        clearAoiInfo: () => {
            dispatch(clearAoiInfo());
        },
        clearExportInfo: () => {
            dispatch(clearExportInfo());
        },
        clearJobInfo: () => {
            dispatch(clearJobInfo());
        },
        getFormats: () => {
            dispatch(getFormats());
        },
        getNotifications: (args) => {
            dispatch(getNotifications(args));
        },
        getNotificationsUnreadCount: (args) => {
            dispatch(getNotificationsUnreadCount(args));
        },
    };
}

export default withTheme(connect(
    mapStateToProps,
    mapDispatchToProps,
)(BreadcrumbStepper));
