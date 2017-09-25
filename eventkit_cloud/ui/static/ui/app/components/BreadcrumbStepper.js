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
    stepperNextEnabled, submitJob, clearAoiInfo, clearExportInfo, clearJobInfo} from '../actions/exportsActions'
import { setDatacartDetailsReceived, getDatacartDetails} from '../actions/statusDownloadActions'

const isEqual = require('lodash/isEqual');

export class BreadcrumbStepper extends React.Component {
    constructor() {
        super();
        this.getStepLabel = this.getStepLabel.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
        this.state = {
            stepIndex: 0,
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
        this.setState({stepIndex: stepIndex + 1});
    };

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
                return  <div className={'qa-BreadcrumbStepper-step1Label'} style={labelStyle}>
                            STEP 1 OF 3:  Define Area of Interest
                        </div>;
            case 1:
                return  <div className={'qa-BreadcrumbStepper-step2Label'} style={labelStyle}>
                            STEP 2 OF 3:  Select Data & Formats
                        </div>;
            case 2:
                return  <div className={'qa-BreadcrumbStepper-step3Label'} style={labelStyle}>
                            STEP 3 OF 3:  Review & Submit
                        </div>;
            default:
                return  <div className={'qa-BreadcrumbStepper-stepErrorLabel'} style={labelStyle}>
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
                    className={'qa-BreadcrumbStepper-NavigationArrowBack-previous-case0'}
                    style={styles.arrowBack}
                    onClick={this.handlePrev}
                />
            case 1:
                return <NavigationArrowBack
                    className={'qa-BreadcrumbStepper-NavigationArrowBack-previous-case1'}
                    style={styles.arrowBack}
                    onClick={this.handlePrev}
                />
            case 2:
                return <FloatingActionButton mini={true}
                                             className={'qa-BreadcrumbStepper-FloatingActionButton-previous'}
                                             onClick={this.handlePrev}
                                             style={styles.arrowBack}
                                             backgroundColor={'#4598bf'}>
                        <NavigationArrowBack className={'qa-BreadcrumbStepper-NavigationArrowBack-previous-case2'}/>
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
                            className={'qa-BreadcrumbStepper-FloatingActionButton-case0'}
                            disabled={!this.props.stepperNextEnabled}
                            backgroundColor={'#55ba63'}
                            onClick={this.handleNext}
                            style={btnStyles.forward} >
                                <NavigationArrowForward/>
                        </FloatingActionButton>
            case 1:
                return <FloatingActionButton mini={true}
                            className={'qa-BreadcrumbStepper-FloatingActionButton-case1'}
                            disabled={!this.props.stepperNextEnabled}
                            backgroundColor={'#55ba63'}
                            onClick={this.handleNext}
                            style={btnStyles.forward}>
                                <NavigationArrowForward/>
                        </FloatingActionButton>
            case 2:
                return <FloatingActionButton
                            className={'qa-BreadcrumbStepper-FloatingActionButton-case2'}
                            mini={false}
                            disabled={!this.props.stepperNextEnabled}
                            backgroundColor={'#55ba63'}
                            onClick={this.handleSubmit}
                            style={btnStyles.submit}>
                                <NavigationCheck className={'qa-BreadcrumbStepper-NavigationCheck'}/>
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

        return (
            <div className={'qa-BreadcrumbStepper-div-content'} style={{backgroundColor: '#161e2e'}}>
                <div  className={'qa-BreadcrumbStepper-div-stepLabel'}style={{width: '100%', height: '50px'}}>
                    {this.getStepLabel(this.state.stepIndex)}
                    <div className={'qa-BreadcrumbStepper-div-buttons'} style={{float: 'right', padding: '5px'}}>
                        {this.getPreviousButtonContent(this.state.stepIndex)}
                        {this.getButtonContent(this.state.stepIndex)}
                    </div>
                </div>
                {this.getStepContent(this.state.stepIndex)}
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
