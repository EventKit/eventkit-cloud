import React from 'react';
import { Link, IndexLink } from 'react-router'
import {
    Step,
    Stepper,
    StepLabel,
} from 'material-ui/Stepper';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import FlatButton from 'material-ui/FlatButton';
import style from './BreadcrumbStepper.css'

class BreadcrumbStepper extends React.Component {

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
                return 'return the export AOI';
            case 1:
                return 'return the export info';
            case 2:
                return 'return preview export';
            case 3:
                return 'return export status';
            default:
                return 'You\'re a long way from home sonny jim!';
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
            <div style={{backgroundColor: '#161e2e'}}>
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
                    <div className={style.imageWrapper} style={{width: '150px'}}>
                        <FloatingActionButton mini={true}
                                              disabled={stepIndex === 0}
                                              onTouchTap={this.handlePrev}
                                              style={{marginRight: 12}}><i className="fa fa-arrow-left fa-lg" aria-hidden="true"></i></FloatingActionButton>
                        <FloatingActionButton mini={true}
                                              onTouchTap={this.handleNext}
                                              style={{marginRight: 12}}><i className="fa fa-arrow-right fa-lg" aria-hidden="true"></i></FloatingActionButton>
                    </div>
                </div>

             </div>

            </div>

                </div>

        );
    }
}

export default BreadcrumbStepper;
