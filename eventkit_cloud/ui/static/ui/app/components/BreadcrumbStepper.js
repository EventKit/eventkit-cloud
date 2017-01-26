import React from 'react';
import { Link, IndexLink } from 'react-router'
import {connect} from 'react-redux'
import {
    Step,
    Stepper,
    StepLabel,
} from 'material-ui/Stepper';
import FloatingActionButton from 'material-ui/FloatingActionButton'
import style from './BreadcrumbStepper.css'
import ExportAOI, {MODE_DRAW_BBOX, MODE_NORMAL} from './ExportAOI'
import ExportInfo from './ExportInfo'

class BreadcrumbStepper extends React.Component {
    constructor() {
        super()
        this._handleBoundingBoxChange = this._handleBoundingBoxChange.bind(this)
    }

    state = {
        finished: false,
        stepIndex: 0,
    };

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
                return <ExportInfo/>
            case 2:
                return 'return preview export';
            case 3:
                return 'return export status';
            default:
                return <ExportAOI mode={this._mapMode}
                                  onBoundingBoxChange={() => this._handleBoundingBoxChange()}/>;
        }
    }

    render() {

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
            <div>
            <div style={{width: '100%', backgroundColor: '#161e2e', paddingTop: '5px'}}>
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
                                              style={{marginRight: 12}}><i className="fa fa-arrow-left fa-lg" aria-hidden="true"></i></FloatingActionButton>
                        <FloatingActionButton mini={true}
                                              disabled={stepIndex === 3}
                                              onTouchTap={this.handleNext}
                                              style={{marginRight: 12}}><i className="fa fa-arrow-right fa-lg" aria-hidden="true"></i></FloatingActionButton>
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
    bbox:            React.PropTypes.arrayOf(React.PropTypes.number),
};

function mapStateToProps(state) {
    return {
        bbox: state.bbox,
    };
}


export default connect(
    mapStateToProps,
)(BreadcrumbStepper);