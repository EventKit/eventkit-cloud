import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning';
import CircularProgress from 'material-ui/CircularProgress';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import ExportAOI from './CreateDataPack/ExportAOI';
import ExportInfo from './CreateDataPack/ExportInfo';
import ExportSummary from './CreateDataPack/ExportSummary';
import { flattenFeatureCollection } from '../utils/mapUtils';
import { getProviders, stepperNextDisabled,
    stepperNextEnabled, submitJob, clearAoiInfo, clearExportInfo, clearJobInfo, getFormats } from '../actions/exportsActions';
import { getDatacartDetails } from '../actions/statusDownloadActions';
import BaseDialog from './BaseDialog';

export class BreadcrumbStepper extends React.Component {
    constructor() {
        super();
        this.getStepLabel = this.getStepLabel.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        this.submitDatapack = this.submitDatapack.bind(this);
        this.state = {
            stepIndex: 0,
            showError: false,
            error: null,
            loading: false,
        };
    }

    componentDidMount() {
        // Clone will mount the stepper and we don't want it disabled if there's information in the exportInfo props
        if (this.props.exportInfo.exportName === '') {
            this.props.setNextDisabled();
        }
        this.props.getProviders();
        this.props.getFormats();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.jobFetched !== nextProps.jobFetched) {
            if (nextProps.jobFetched) {
                this.hideLoading();
                browserHistory.push(`/status/${nextProps.jobuid}`);
                this.props.clearJobInfo();
            }
        }
        if (nextProps.jobError) {
            this.hideLoading();
            this.showError(nextProps.jobError.response);
        }
    }

    componentWillUnmount() {
        this.props.clearAoiInfo();
        this.props.clearExportInfo();
        this.props.clearJobInfo();
    }

    getErrorMessage(title, detail, ix) {
        return (
            <div className="BreadcrumbStepper-error-container" key={`${title}-${detail}`}>
                { ix > 0 ? <Divider style={{ marginBottom: '10px' }} /> : null }
                <p className="BreadcrumbStepper-error-title">
                    <Warning style={{ fill: '#ce4427', verticalAlign: 'bottom', marginRight: '10px' }} />
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

    getStepLabel(stepIndex) {
        const labelStyle = {
            color: 'white',
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

    getStepContent(stepIndex) {
        switch (stepIndex) {
        case 0:
            return <ExportAOI />;
        case 1:
            return <ExportInfo providers={this.props.providers} formats={this.props.formats} handlePrev={this.handlePrev} />;
        case 2:
            return <ExportSummary allFormats={this.props.formats} />;
        default:
            return <ExportAOI />;
        }
    }

    getPreviousButtonContent(stepIndex) {
        const styles = {
            arrowBack: {
                fill: stepIndex === 0 ? '#e2e2e2' : '#4598bf',
                opacity: stepIndex === 0 ? '0.3' : '1',
                cursor: stepIndex === 0 ? 'default' : 'pointer',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
        };

        switch (stepIndex) {
        case 0:
            return (
                <NavigationArrowBack
                    className="qa-BreadcrumbStepper-NavigationArrowBack-previous-case0"
                    style={styles.arrowBack}
                    onClick={this.handlePrev}
                />
            );
        case 1:
            return (
                <NavigationArrowBack
                    className="qa-BreadcrumbStepper-NavigationArrowBack-previous-case1"
                    style={styles.arrowBack}
                    onClick={this.handlePrev}
                />
            );
        case 2:
            return (
                <FloatingActionButton
                    mini
                    className="qa-BreadcrumbStepper-FloatingActionButton-previous"
                    onClick={this.handlePrev}
                    style={styles.arrowBack}
                    backgroundColor="#4598bf"
                >
                    <NavigationArrowBack
                        className="qa-BreadcrumbStepper-NavigationArrowBack-previous-case2"
                    />
                </FloatingActionButton>
            );
        default:
            return <div />;
        }
    }

    getButtonContent(stepIndex) {
        const btnStyles = {
            submit: {
                color: 'black',
                marginRight: '12px',
                verticalAlign: 'middle',
                boxShadow: 'none',
                transition: 'none',
            },
            forward: {
                marginRight: '12px',
                verticalAlign: 'middle',
                boxShadow: 'none',
                transition: 'none',
            },
        };

        switch (stepIndex) {
        case 0:
            return (
                <FloatingActionButton
                    mini
                    className="qa-BreadcrumbStepper-FloatingActionButton-case0"
                    disabled={!this.props.stepperNextEnabled}
                    backgroundColor="#55ba63"
                    onClick={this.handleNext}
                    style={btnStyles.forward}
                >
                    <NavigationArrowForward />
                </FloatingActionButton>
            );
        case 1:
            return (
                <FloatingActionButton
                    mini
                    className="qa-BreadcrumbStepper-FloatingActionButton-case1"
                    disabled={!this.props.stepperNextEnabled}
                    backgroundColor="#55ba63"
                    onClick={this.handleNext}
                    style={btnStyles.forward}
                >
                    <NavigationArrowForward />
                </FloatingActionButton>
            );
        case 2:
            return (
                <FloatingActionButton
                    className="qa-BreadcrumbStepper-FloatingActionButton-case2"
                    mini={false}
                    disabled={!this.props.stepperNextEnabled}
                    backgroundColor="#55ba63"
                    onClick={this.submitDatapack}
                    style={btnStyles.submit}
                >
                    <NavigationCheck className="qa-BreadcrumbStepper-NavigationCheck" />
                </FloatingActionButton>
            );
        default:
            return <div />;
        }
    }

    submitDatapack() {
        this.showLoading();
        // wait a moment before calling handleSubmit because
        // flattenFeatureCollection may lock up the browser
        // and prevent loading icon from rendering
        window.setTimeout(this.handleSubmit, 100);
    }

    handleSubmit() {
        const provider_tasks = [];
        const providers = [...this.props.exportInfo.providers];

        // formats only consists of geopackage right now
        const { formats } = this.props.exportInfo;

        providers.forEach((provider) => {
            provider_tasks.push({ provider: provider.name, formats: [formats[0]] });
        });

        const selection = flattenFeatureCollection(this.props.aoiInfo.geojson);

        const data = {
            name: this.props.exportInfo.exportName,
            description: this.props.exportInfo.datapackDescription,
            event: this.props.exportInfo.projectName,
            include_zipfile: false,
            published: this.props.exportInfo.makePublic,
            provider_tasks: provider_tasks,
            selection,
            original_selection: this.props.aoiInfo.originalGeojson,
            tags: [],
        };
        this.props.submitJob(data);
    }

    handleNext() {
        const { stepIndex } = this.state;
        this.setState({ stepIndex: stepIndex + 1 });
    }

    handlePrev() {
        const { stepIndex } = this.state;
        if (stepIndex > 0) {
            this.setState({ stepIndex: stepIndex - 1 });
        }
    }

    showError(error) {
        this.setState({ showError: true, error });
        this.props.clearJobInfo();
    }

    hideError() {
        this.setState({ showError: false });
    }

    showLoading() {
        this.setState({ loading: true });
    }

    hideLoading() {
        this.setState({ loading: false });
    }

    render() {
        let message = [];
        if (this.state.error) {
            const responseError = { ...this.state.error };
            if (responseError.data && responseError.data.errors) {
                const errors = [...responseError.data.errors];
                message = errors.map((error, ix) => (
                    this.getErrorMessage(error.title, error.detail, ix)
                ));
            }
            if (!message.length) {
                message.push(this.getErrorMessage('Error', 'An unknown error has occured'));
            }
        }

        return (
            <div className="qa-BreadcrumbStepper-div-content" style={{ backgroundColor: '#161e2e' }}>
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
                { this.state.loading ?
                    <div style={{ zIndex: 10, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                            <CircularProgress
                                className="qa-BreadcrumbStepper-CircularProgress"
                                style={{ margin: 'auto', display: 'block' }} 
                                color={'#4598bf'}
                                size={50}
                            />
                        </div>
                    </div>
                    :
                    null
                }
            </div>
        );
    }
}

BreadcrumbStepper.propTypes = {
    aoiInfo: React.PropTypes.object.isRequired,
    providers: React.PropTypes.array.isRequired,
    stepperNextEnabled: React.PropTypes.bool.isRequired,
    exportInfo: React.PropTypes.object.isRequired,
    submitJob: React.PropTypes.func.isRequired,
    getProviders: React.PropTypes.func.isRequired,
    setNextDisabled: React.PropTypes.func.isRequired,
    setNextEnabled: React.PropTypes.func.isRequired,
    clearAoiInfo: React.PropTypes.func.isRequired,
    clearExportInfo: React.PropTypes.func.isRequired,
    clearJobInfo: React.PropTypes.func.isRequired,
    jobFetched: React.PropTypes.bool.isRequired,
    jobError: React.PropTypes.object.isRequired,
    jobuid: React.PropTypes.string.isRequired,
    formats: React.PropTypes.array.isRequired,
    getFormats: React.PropTypes.func.isRequired,
};

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
        getProviders: () => {
            dispatch(getProviders());
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled());
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled());
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
        getDatacartDetails: (jobuid) => {
            dispatch(getDatacartDetails(jobuid));
        },
        getFormats: () => {
            dispatch(getFormats());
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(BreadcrumbStepper);
