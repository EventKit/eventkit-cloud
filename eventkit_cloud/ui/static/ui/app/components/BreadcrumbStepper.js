import React from 'react';
import {browserHistory} from 'react-router';
import { Link, IndexLink } from 'react-router'
import {connect} from 'react-redux'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import ExportAOI from './CreateDataPack/ExportAOI'
import ExportInfo from './CreateDataPack/ExportInfo'
import ExportSummary from './CreateDataPack/ExportSummary'
import { createExportRequest, getProviders, stepperNextDisabled,
    stepperNextEnabled, exportInfoDone, submitJob, clearAoiInfo, clearExportInfo, clearJobInfo} from '../actions/exportsActions'
import { setDatacartDetailsReceived, getDatacartDetails} from '../actions/statusDownloadActions'
import BaseDialog from './BaseDialog';

const isEqual = require('lodash/isEqual');

export class BreadcrumbStepper extends React.Component {
    constructor() {
        super();
        this.getStepLabel = this.getStepLabel.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.incrementStepper = this.incrementStepper.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
        this.state = {
            stepIndex: 0,
            showError: false,
            error: null
        };
    }

    componentDidMount(){
        //Clone will mount the stepper and we don't want it disabled if there's information in the exportInfo props
        if(this.props.exportInfo.exportName == '') {
            this.props.setNextDisabled();
        }
        this.props.getProviders();
    }

    componentWillUnmount() {
        this.props.clearAoiInfo();
        this.props.clearExportInfo();
        this.props.clearJobInfo();
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.datacartDetailsReceived){
            browserHistory.push('/status/'+nextProps.jobuid);
        }
        if (this.props.jobFetched != nextProps.jobFetched) {
            if (nextProps.jobFetched) {
                this.props.setDatacartDetailsReceived();
            }
        }
        if(nextProps.jobError) {
            this.showError(nextProps.jobError.response);
        }
    }

    showError(error) {
        this.setState({showError: true, error: error});
        this.props.clearJobInfo();
    }

    hideError() {
        this.setState({showError: false});
    }

    getErrorMessage() {
        const error = {...this.state.error};
        console.log(error);
        let message = '';
        if(error.data) {
            const data = error.data
            for (const key in data) {
                message += `${key}: ${data[key][0]}\n`;
            }
        }
        if (!message) {
            message += `Details:\nAn unknow error has occured`;
        }
        return message;
    }

    handleSubmit() {
        let provider_tasks = [];
        const providers = this.props.exportInfo.providers;

        //TODO: Set formats up as an array for future need of other formats other than geopackage!

        providers.forEach((provider) => {
            provider_tasks.push({'provider': provider.name, 'formats': ['gpkg']});
        });

        const data = {
            name: this.props.exportInfo.exportName,
            description: this.props.exportInfo.datapackDescription,
            event: this.props.exportInfo.projectName,
            include_zipfile : false,
            published : this.props.exportInfo.makePublic,
            provider_tasks : provider_tasks,
            selection: this.props.aoiInfo.geojson,
            tags : [],
        };
        this.props.submitJob(data);
    }

    handleNext() {
        const {stepIndex} = this.state;
        if (stepIndex == 1) {
            this.props.setExportInfoDone();
        }
        else {
            this.setState({stepIndex: stepIndex + 1});
        }
    };

    incrementStepper() {
        const {stepIndex} = this.state;
        this.setState({stepIndex: stepIndex + 1});
    }

    handlePrev() {
        const {stepIndex} = this.state;
        if (stepIndex > 0) {
            this.setState({stepIndex: stepIndex - 1});
        }
    };

    getStepLabel(stepIndex) {
        const labelStyle = {
            color: 'white',
            height: '50px',
            minWidth: '200px',
            display: 'inline-block',
            lineHeight: '50px',
            marginLeft: '24px'
        };

        switch(stepIndex) {
            case 0:
                return  <div style={labelStyle}>
                            STEP 1 OF 3:  Define Area of Interest
                        </div>;
            case 1:
                return  <div style={labelStyle}>
                            STEP 2 OF 3:  Select Data & Formats
                        </div>;
            case 2:
                return  <div style={labelStyle}>
                            STEP 3 OF 3:  Review & Submit
                        </div>;
            default:
                return  <div style={labelStyle}>
                            STEPPER ERROR
                        </div>;
        }
    }

    getStepContent(stepIndex) {
        switch (stepIndex) {
            case 0:
                return <ExportAOI/>;
            case 1:
                return <ExportInfo providers={this.props.providers}
                                   incrementStepper={this.incrementStepper}
                                   handlePrev={this.handlePrev}/>
            case 2:
                return <ExportSummary/>
            default:
                return <ExportAOI/>;
        }
    }

    getPreviousButtonContent(stepIndex) {
        const styles = {
            arrowBack: {
                fill: stepIndex == 0 ? '#e2e2e2' : '#4598bf',
                opacity: stepIndex == 0 ? '0.3' : '1',
                cursor: stepIndex == 0 ? 'default' : 'pointer',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
        };

        switch (stepIndex) {
            case 0:
                return <NavigationArrowBack
                    style={styles.arrowBack}
                    onClick={this.handlePrev}
                />
            case 1:
                return <NavigationArrowBack
                    style={styles.arrowBack}
                    onClick={this.handlePrev}
                />
            case 2:
                return <FloatingActionButton mini={true}
                                             onClick={this.handlePrev}
                                             style={styles.arrowBack}
                                             backgroundColor={'#4598bf'}>
                        <NavigationArrowBack/>
                    </FloatingActionButton>

            default:
                return <div/>;
        }
    }

    getButtonContent(stepIndex) {
        const btnStyles = {
            submit: {
                color: 'black',
                marginRight: '12px',
                verticalAlign: 'middle',
                boxShadow: 'none',
                transition: 'none'
            },
            forward: {
                marginRight: '12px',
                verticalAlign: 'middle',
                boxShadow: 'none',
                transition: 'none'
            }
        };

        switch (stepIndex) {
            case 0:
                return <FloatingActionButton mini={true}
                            disabled={!this.props.stepperNextEnabled}
                            backgroundColor={'#55ba63'}
                            onClick={this.handleNext}
                            style={btnStyles.forward} >
                                <NavigationArrowForward/>
                        </FloatingActionButton>
            case 1:
                return <FloatingActionButton mini={true}
                            disabled={!this.props.stepperNextEnabled}
                            backgroundColor={'#55ba63'}
                            onClick={this.handleNext}
                            style={btnStyles.forward}>
                                <NavigationArrowForward/>
                        </FloatingActionButton>
            case 2:
                return <FloatingActionButton mini={false}
                            disabled={!this.props.stepperNextEnabled}
                            backgroundColor={'#55ba63'}
                            onClick={this.handleSubmit}
                            style={btnStyles.submit}>
                                <NavigationCheck/>
                        </FloatingActionButton>
            default:
                return <div/>;
        }
    }

    render() {
        const { createExportRequest } = this.props
        const {stepIndex} = this.state;
        const styles = {
            stepper: {
                backgroundColor: '#161e2e',
                height: '35px',
                fontColor: 'white',
                fontFamily: 'Roboto',
                zIndex: 1,
            },
            stepLabel: {
                color: 'white',
                fontSize: '18px',
            },
            arrowBack: {
                fill: stepIndex == 0 ? '#e2e2e2' : '#4598bf',
                opacity: stepIndex == 0 ? '0.3' : '1',
                cursor: stepIndex == 0 ? 'default' : 'pointer',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
        };

        const message = this.getErrorMessage();
        return (
            <div style={{backgroundColor: '#161e2e'}}>
                <div style={{width: '100%', height: '50px'}}>
                    {this.getStepLabel(this.state.stepIndex)}
                    <div style={{float: 'right', padding: '5px'}}>
                        {this.getPreviousButtonContent(this.state.stepIndex)}
                        {this.getButtonContent(this.state.stepIndex)}
                    </div>
                </div>
                {this.getStepContent(this.state.stepIndex)}
                <BaseDialog
                    show={this.state.showError}
                    title={'ERROR'}
                    onClose={this.hideError}
                >
                    {message}
                </BaseDialog>
            </div>
        );
    }
}

BreadcrumbStepper.propTypes = {
    aoiInfo: React.PropTypes.object,
    providers: React.PropTypes.array,
    stepperNextEnabled: React.PropTypes.bool,
    exportInfo: React.PropTypes.object,
    createExportRequest: React.PropTypes.func.isRequired,
    submitJob: React.PropTypes.func,
    getProviders: React.PropTypes.func,
    setNextDisabled: React.PropTypes.func,
    setNextEnabled: React.PropTypes.func,
    setDatacartDetailsReceived: React.PropTypes.func,
    setExportInfoDone: React.PropTypes.func,
    clearAoiInfo: React.PropTypes.func,
    clearExportInfo: React.PropTypes.func,
    clearJobInfo: React.PropTypes.func,
    jobFetched: React.PropTypes.bool,
    jobuid: React.PropTypes.string,
};

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
        providers: state.providers,
        stepperNextEnabled: state.stepperNextEnabled,
        datacartDetailsReceived: state.datacartDetailsReceived,
        exportInfo: state.exportInfo,
        jobFetched: state.submitJob.fetched,
        jobError: state.submitJob.error,
        jobuid: state.submitJob.jobuid
    };
}
function mapDispatchToProps(dispatch) {
    return {
        createExportRequest: () => {
            dispatch(createExportRequest());
        },
        submitJob: (data) => {
            dispatch(submitJob(data))
        },
        getProviders: () => {
            dispatch(getProviders())
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled());
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled());
        },
        setExportInfoDone: () => {
            dispatch(exportInfoDone());
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
        setDatacartDetailsReceived: () => {
            dispatch(setDatacartDetailsReceived());
        },
        getDatacartDetails: (jobuid) => {
            dispatch(getDatacartDetails(jobuid))
        },
    }
}

export default  connect(
    mapStateToProps,
    mapDispatchToProps
)(BreadcrumbStepper);
