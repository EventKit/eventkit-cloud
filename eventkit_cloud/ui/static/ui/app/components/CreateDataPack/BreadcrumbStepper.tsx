import * as React from 'react';
import { browserHistory, InjectedRouter, PlainRoute } from 'react-router';
import { connect } from 'react-redux';
import { withTheme, Theme } from '@material-ui/core/styles';
import * as isEqual from 'lodash/isEqual';
import Divider from '@material-ui/core/Divider';
import Warning from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import NavigationArrowBack from '@material-ui/icons/ArrowBack';
import NavigationArrowForward from '@material-ui/icons/ArrowForward';
import NavigationCheck from '@material-ui/icons/Check';
import ExportAOI from './ExportAOI';
import ExportInfo from './ExportInfo';
import ExportSummary from './ExportSummary';
import { flattenFeatureCollection } from '../../utils/mapUtils';
import {
    submitJob, clearAoiInfo, clearExportInfo, clearJobInfo,
} from '../../actions/datacartActions';
import { stepperNextDisabled } from '../../actions/uiActions';
import { getFormats } from '../../actions/formatActions';
import { getProviders } from '../../actions/providerActions';
import { getNotifications, getNotificationsUnreadCount } from '../../actions/notificationsActions';
import BaseDialog from '../Dialog/BaseDialog';
import ConfirmDialog from '../Dialog/ConfirmDialog';
import PageLoading from '../common/PageLoading';
import { Location } from 'history';

export interface JobData {
    name: string;
    description: string;
    event: string;
    include_zipfile: boolean;
    provider_tasks: Eventkit.ProviderTask[];
    selection: GeoJSON.FeatureCollection;
    original_selection: GeoJSON.FeatureCollection;
    tags: [];
}

export interface Props {
    aoiInfo: Eventkit.Store.AoiInfo;
    providers: Eventkit.Provider[];
    stepperNextEnabled: boolean;
    exportInfo: Eventkit.Store.ExportInfo;
    submitJob: (data: JobData) => void;
    getProviders: () => void;
    setNextDisabled: () => void;
    clearAoiInfo: () => void;
    clearExportInfo: () => void;
    clearJobInfo: () => void;
    jobFetched: boolean;
    jobError: object;
    jobuid: string;
    formats: object[];
    getFormats: () => void;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    router: InjectedRouter;
    routes: PlainRoute[];
    getNotifications: () => void;
    getNotificationsUnreadCount: () => void;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    stepIndex: number;
    showError: boolean;
    error: any;
    loading: boolean;
    showLeaveWarningDialog: boolean;
    modified: boolean;
    limits: {
        max: number;
        sizes: number[];
    };
}

export class BreadcrumbStepper extends React.Component<Props, State> {
    private leaveRoute: null | string;

    static defaultProps = {
        jobError: undefined,
        jobFetched: null,
    };

    constructor(props: Props) {
        super(props);
        this.getProviders = this.getProviders.bind(this);
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
        this.state = {
            stepIndex: 0,
            showError: false,
            error: null,
            loading: false,
            showLeaveWarningDialog: false,
            modified: false,
            limits: {
                max: 0,
                sizes: [],
            },
        };
        this.leaveRoute = null;
    }

    async componentDidMount() {
        // Clone will mount the stepper and we don't want it disabled
        // if there's information in the exportInfo props
        if (this.props.exportInfo.exportName === '') {
            this.props.setNextDisabled();
        }
        this.getProviders();
        this.props.getFormats();

        const route = this.props.routes[this.props.routes.length - 1];
        this.props.router.setRouteLeaveHook(route, this.routeLeaveHook);
    }

    componentDidUpdate(prevProps) {
        if (this.props.jobFetched && !prevProps.jobFetched) {
            this.props.clearJobInfo();
            this.props.getNotifications();
            this.props.getNotificationsUnreadCount();
            browserHistory.push(`/status/${this.props.jobuid}`);
        }
        if (this.props.jobError && !prevProps.jobError) {
            this.hideLoading();
            this.showError(this.props.jobError);
        }

        if (!isEqual(this.props.aoiInfo, prevProps.aoiInfo) ||
            !isEqual(this.props.exportInfo, prevProps.exportInfo)) {
            this.setState({ modified: true });
        }
    }

    componentWillUnmount() {
        this.props.clearAoiInfo();
        this.props.clearExportInfo();
        this.props.clearJobInfo();
    }

    private async getProviders() {
        await this.props.getProviders();
        let max = 0;
        const sizes = [];
        this.props.providers.forEach((provider) => {
            if (!provider.display) {
                return;
            }
            const providerMax = parseFloat(provider.max_selection);
            sizes.push(providerMax);
            if (providerMax > max) {
                max = providerMax;
            }
        });
        const limits = {
            max,
            sizes: sizes.sort((a, b) => a - b),
        };
        this.setState({ limits });
    }

    private getErrorMessage(title: string, detail: string, ix: number) {
        return (
            <div className="BreadcrumbStepper-error-container" key={`${title}-${detail}`}>
                { ix > 0 ? <Divider style={{ marginBottom: '10px' }} /> : null }
                <p className="BreadcrumbStepper-error-title">
                    <Warning style={{ fill: this.props.theme.eventkit.colors.warning, verticalAlign: 'bottom', marginRight: '10px' }} />
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
            minWidth: '200px',
            display: 'inline-block',
            lineHeight: '50px',
            marginLeft: '24px',
        };

        switch (stepIndex) {
            case 0:
                return (
                    <div className="qa-BreadcrumbStepper-step1Label" style={labelStyle}>
                    STEP 1 OF 3:  Define Area of Interest
                    </div>
                );
            case 1:
                return (
                    <div className="qa-BreadcrumbStepper-step2Label" style={labelStyle}>
                    STEP 2 OF 3:  Select Data & Formats
                    </div>
                );
            case 2:
                return (
                    <div className="qa-BreadcrumbStepper-step3Label" style={labelStyle}>
                    STEP 3 OF 3:  Review & Submit
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
                        limits={this.state.limits}
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                    />
                );
            case 1:
                return (
                    <ExportInfo
                        handlePrev={this.handlePrev}
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                    />
                );
            case 2:
                return (
                    <ExportSummary
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                    />
                );
            default:
                return (
                    <ExportAOI
                        limits={this.state.limits}
                        walkthroughClicked={this.props.walkthroughClicked}
                        onWalkthroughReset={this.props.onWalkthroughReset}
                    />
                );
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
            case 1:
                return (
                    <NavigationArrowBack
                        id="Previous"
                        className="qa-BreadcrumbStepper-NavigationArrowBack-previous"
                        style={styles.arrowBack}
                        onClick={this.handlePrev}
                    />
                );
            case 2:
                return (
                    <Button
                        mini
                        id="Previous"
                        variant="fab"
                        color="primary"
                        className="qa-BreadcrumbStepper-Button-previous"
                        onClick={this.handlePrev}
                        style={styles.arrowBack}
                    >
                        <NavigationArrowBack
                            className="qa-BreadcrumbStepper-NavigationArrowBack-previous-case2"
                        />
                    </Button>
                );
            default:
                return <div />;
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
                this.props.theme.eventkit.colors.success : this.props.theme.eventkit.colors.secondary,
        };

        switch (stepIndex) {
            case 0:
            case 1:
                return (
                    <Button
                        mini
                        id="Next"
                        variant="fab"
                        color="primary"
                        className="qa-BreadcrumbStepper-Button-next"
                        disabled={!this.props.stepperNextEnabled}
                        onClick={this.handleNext}
                        style={btnStyle}
                    >
                        <NavigationArrowForward />
                    </Button>
                );
            case 2:
                return (
                    <Button
                        id="Next"
                        variant="fab"
                        color="primary"
                        className="qa-BreadcrumbStepper-Button-next"
                        disabled={!this.props.stepperNextEnabled}
                        onClick={this.submitDatapack}
                        style={btnStyle}
                    >
                        <NavigationCheck className="qa-BreadcrumbStepper-NavigationCheck" />
                    </Button>
                );
            default:
                return <div />;
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
        this.setState({ showLeaveWarningDialog: true });
        return false;
    }

    private submitDatapack() {
        this.setState({ modified: false });
        this.showLoading();
        // wait a moment before calling handleSubmit because
        // flattenFeatureCollection may lock up the browser
        // and prevent loading icon from rendering
        window.setTimeout(this.handleSubmit, 100);
    }

    private handleSubmit() {
        const providerTasks = [];
        const providers = [...this.props.exportInfo.providers];

        // formats only consists of geopackage right now
        const { formats } = this.props.exportInfo;

        providers.forEach((provider) => {
            providerTasks.push({ provider: provider.name, formats: [formats[0]] });
        });

        const selection = flattenFeatureCollection(this.props.aoiInfo.geojson);

        const data: JobData = {
            name: this.props.exportInfo.exportName,
            description: this.props.exportInfo.datapackDescription,
            event: this.props.exportInfo.projectName,
            include_zipfile: false,
            provider_tasks: providerTasks,
            selection,
            original_selection: this.props.aoiInfo.originalGeojson,
            tags: [],
        };
        this.props.submitJob(data);
    }

    private handleNext() {
        const { stepIndex } = this.state;
        this.setState({ stepIndex: stepIndex + 1 });
    }

    private handlePrev() {
        const { stepIndex } = this.state;
        if (stepIndex > 0) {
            this.setState({ stepIndex: stepIndex - 1 });
        }
    }

    private showError(error: any) {
        this.setState({ showError: true, error });
        this.props.clearJobInfo();
    }

    private hideError() {
        this.setState({ showError: false });
    }

    private showLoading() {
        this.setState({ loading: true });
    }

    private hideLoading() {
        this.setState({ loading: false });
    }

    private handleLeaveWarningDialogCancel() {
        this.setState({ showLeaveWarningDialog: false });
        this.leaveRoute = null;
    }

    private handleLeaveWarningDialogConfirm() {
        this.props.router.push(this.leaveRoute);
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        let message = [];
        if (this.state.error) {
            const responseError = { ...this.state.error };
            const errors = [...responseError.errors];
            message = errors.map((error, ix) => (
                this.getErrorMessage(error.title, error.detail, ix)
            ));
            if (!message.length) {
                message.push(this.getErrorMessage('Error', 'An unknown error has occured', 0));
            }
        }

        return (
            <div className="qa-BreadcrumbStepper-div-content" style={{ backgroundColor: colors.background }}>
                <div className="qa-BreadcrumbStepper-div-stepLabel" style={{ width: '100%', height: '50px' }}>
                    {this.getStepLabel(this.state.stepIndex)}
                    <div className="qa-BreadcrumbStepper-div-buttons" style={{ float: 'right', padding: '5px' }}>
                        {this.getPreviousButtonContent(this.state.stepIndex)}
                        {this.getButtonContent(this.state.stepIndex)}
                    </div>
                </div>
                {this.getStepContent(this.state.stepIndex)}
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
                { this.state.loading ?
                    <PageLoading background="transparent" />
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
        providers: state.providers,
        stepperNextEnabled: state.stepperNextEnabled,
        exportInfo: state.exportInfo,
        jobFetched: state.submitJob.fetched,
        jobError: state.submitJob.error,
        jobuid: state.submitJob.jobuid,
        formats: state.formats,
    };
}
function mapDispatchToProps(dispatch) {
    return {
        submitJob: (data) => {
            dispatch(submitJob(data));
        },
        getProviders: () => (
            dispatch(getProviders())
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

export default withTheme()(connect(
    mapStateToProps,
    mapDispatchToProps,
)(BreadcrumbStepper));
