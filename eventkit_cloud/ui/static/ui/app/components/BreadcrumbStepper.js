import React from 'react';
import {browserHistory} from 'react-router';
import { Link, IndexLink } from 'react-router'
import {connect} from 'react-redux'
import {
    Step,
    Stepper,
    StepLabel,
} from 'material-ui/Stepper';
import FloatingActionButton from 'material-ui/FloatingActionButton'
import style from '../styles/BreadcrumbStepper.css'
import ExportAOI, {MODE_DRAW_BBOX, MODE_NORMAL} from './ExportAOI'
import ExportInfo from './ExportInfo'
import ExportSummary from './ExportSummary'
import { createExportRequest, getProviders, stepperNextDisabled,
    stepperNextEnabled, exportInfoDone, submitJob, clearAoiInfo, clearExportInfo} from '../actions/exportsActions'
const isEqual = require('lodash/isEqual');

class BreadcrumbStepper extends React.Component {
    constructor() {
        super()
    }

    state = {
        finished: false,
        stepIndex: 0,
        nextDisabled: true,
    };

    componentDidMount(){
        this.props.getProviders();
        this.props.setNextDisabled();
    }

    componentWillUnmount() {
        this.props.clearAoiInfo();
        this.props.clearExportInfo();
    }

    componentWillReceiveProps(nextProps) {

    }

    handleSubmit = () => {
        const {stepIndex} = this.state;
        let provider_tasks = [];
        const providers = this.props.exportInfo.providers;

        //TODO: Set formats up as an array for future need of other formats other than geopackage!
        for(let provider in providers){
            provider_tasks.push({'provider': providers[provider], 'formats': ['gpkg']});
        }

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
        browserHistory.push('/status');

        // this.setState({
        //     stepIndex: stepIndex + 1,
        //     finished: stepIndex >= 2,
        // });

    }

    handleNext = () => {
        const {stepIndex} = this.state;
        if (stepIndex == 1) {
            this.props.setExportInfoDone();
        }

        else
        {
            this.setState({
            stepIndex: stepIndex + 1,
            finished: stepIndex >= 2,
         });
        }
    };

    incrementStepper = () => {
        const {stepIndex} = this.state;
        this.setState({stepIndex: stepIndex + 1,
            finished: stepIndex >= 2,
        });
    }

    handlePrev = () => {
        const {stepIndex} = this.state;
        if (stepIndex > 0) {
            this.setState({stepIndex: stepIndex - 1});
        }
    };

    getStepContent(stepIndex) {
    switch (stepIndex) {
        case 0:
            return <ExportAOI mode={this._mapMode}/>;
        case 1:
            return <ExportInfo providers={this.props.providers}
                                incrementStepper={this.incrementStepper}/>
        case 2:
            return <ExportSummary/>
        case 3:
            return 'return export status';
        default:
            return <ExportAOI mode={this._mapMode}/>;
    }
}
    getButtonContent(stepIndex) {
        switch (stepIndex) {
            case 0:
                return <FloatingActionButton mini={true}
                                             disabled={!this.props.stepperNextEnabled}
                                             onTouchTap={this.handleNext}
                                             className={style.forwardButtonDiv}><i className="material-icons" aria-hidden="true">arrow_forward</i></FloatingActionButton>
            case 1:
                return <FloatingActionButton mini={true}
                                             disabled={!this.props.stepperNextEnabled}
                                             onTouchTap={this.handleNext}
                                             className={style.forwardButtonDiv}><i className="material-icons" aria-hidden="true">arrow_forward</i></FloatingActionButton>
            case 2:
                return <FloatingActionButton mini={false}
                                             disabled={!this.props.stepperNextEnabled}
                                             onTouchTap={this.handleSubmit}
                                             className={style.bigForwardButtonDiv}><i className="material-icons" aria-hidden="true">check</i></FloatingActionButton>
            case 3:
                return <div></div>
            default:
                return <ExportAOI mode={this._mapMode}/>;
        }
    }

    render() {

        const { createExportRequest } = this.props

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
        }
        };
        const {finished, stepIndex} = this.state;

        return (
            <div style={{backgroundColor: '#161e2e'}}>
                <div className={style.topWrapper}>
                    <div className={style.stepperImageWrapper}>
                        <div className={style.stepperWrapper}>
                            <Stepper activeStep={stepIndex}>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Define Area of Interest (AOI)</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Select Data & Formats</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Review & Submit</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Status & Download</StepLabel>
                                </Step>
                            </Stepper>
                        </div>
                        <div className={style.imageWrapper} style={{maxWidth: '150px'}}>
                            <FloatingActionButton mini={true}
                                                disabled={stepIndex === 0}
                                                onTouchTap={this.handlePrev}
                                                className={style.backButtonDiv}><i className="material-icons" aria-hidden="false">arrow_back</i></FloatingActionButton>
                            {this.getButtonContent(this.state.stepIndex)}
                        </div>
                    </div>
                </div>
                {this.getStepContent(this.state.stepIndex)}
            </div>

        );
    }
    //
    // Internal API
    //

    get _mapMode() {
        if (this.props.location === 'exportAOI') {
            return MODE_DRAW_BBOX
        }
        return MODE_NORMAL
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
    setExportInfoDone: React.PropTypes.func,
    clearAoiInfo: React.PropTypes.func,
    clearExportInfo: React.PropTypes.func,
};

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
        providers: state.providers,
        stepperNextEnabled: state.stepperNextEnabled,
        exportInfo: state.exportInfo,
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
        }
    }
}

export default  connect(
    mapStateToProps,
    mapDispatchToProps
)(BreadcrumbStepper);
