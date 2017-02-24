import React from 'react';
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
import { createExportRequest } from '../actions/exportsActions'
const isEqual = require('lodash/isEqual');

class BreadcrumbStepper extends React.Component {
    constructor() {
        super()
        this._handleBoundingBoxChange = this._handleBoundingBoxChange.bind(this)
    }

    state = {
        finished: false,
        stepIndex: 0,
        nextDisabled: true,
    };

    componentWillReceiveProps(nextProps) {
        if(!isEqual(nextProps.aoiInfo.geojson, this.props.aoiInfo.geojson)) {
            if(!isEqual(nextProps.aoiInfo.geojson, {})) {
                //make the stepper button clickable
                this.setState({nextDisabled: false});
            }
            else {
                //make the stepper button disabled
                this.setState({nextDisabled: true});
            }
        }
    }

    handleNext = () => {
        const {stepIndex} = this.state;
        this.setState({
            stepIndex: stepIndex + 1,
            finished: stepIndex >= 2,
        });
    };

    handlePrev = () => {
        const {stepIndex} = this.state;
        if (stepIndex > 0) {
            this.setState({stepIndex: stepIndex - 1});
        }
    };

    getStepContent(stepIndex) {
        switch (stepIndex) {
            case 0:
                return <ExportAOI mode={this._mapMode}
                                  onBoundingBoxChange={() => this._handleBoundingBoxChange()}/>;
            case 1:
                return <ExportInfo bbox={this.props.bbox}
                                   createExportRequest={createExportRequest} />
            case 2:
                return <ExportSummary/>
            case 3:
                return 'return export status';
            default:
                return <ExportAOI mode={this._mapMode}
                                  onBoundingBoxChange={() => this._handleBoundingBoxChange()}/>;
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
                                    <StepLabel style={styles.stepLabel}>Set AOI</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Add Info</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Preview & Export</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel style={styles.stepLabel}>Export Status</StepLabel>
                                </Step>
                            </Stepper>
                        </div>
                        <div className={style.imageWrapper} style={{maxWidth: '150px'}}>
                            <FloatingActionButton mini={true}
                                                disabled={stepIndex === 0}
                                                onTouchTap={this.handlePrev}
                                                className={style.backButtonDiv}><i className="material-icons" aria-hidden="false">arrow_back</i></FloatingActionButton>
                            <FloatingActionButton mini={true}
                                                disabled={this.state.nextDisabled}
                                                onTouchTap={this.handleNext}
                                                className={style.forwardButtonDiv}><i className="material-icons" aria-hidden="true">arrow_forward</i></FloatingActionButton>
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

    _handleBoundingBoxChange(bbox) {
        console.log('Running Handle bounding box change in CreateExport.js')
        console.log(this.props.bbox)
    }

}

BreadcrumbStepper.propTypes = {
    bbox: React.PropTypes.arrayOf(React.PropTypes.number),
    aoiInfo: React.PropTypes.object,
    createExportRequest: React.PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        aoiInfo: state.aoiInfo,
    };
}
function mapDispatchToProps(dispatch) {
    return {
        createExportRequest: () => {
            dispatch(createExportRequest());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BreadcrumbStepper);
