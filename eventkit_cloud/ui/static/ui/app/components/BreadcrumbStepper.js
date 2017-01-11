import React from 'react';
import {
    Step,
    Stepper,
    StepLabel,
} from 'material-ui/Stepper';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';

/**
 * Horizontal steppers are ideal when the contents of one step depend on an earlier step.
 * Avoid using long step names in horizontal steppers.
 *
 * Linear steppers require users to complete one step in order to move on to the next.
 */
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
                return 'Select campaign settings...';
            case 1:
                return 'What is an ad group anyways?';
            case 2:
                return 'This is the bit I really care about!';
            case 3:
                return 'This is the 4th one!';
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
                fontSize: '14px',
            },
            stepLabel: {
                color: 'white',
                fontSize: '16px',
            },
            button: {
                width: '20px',
            }
        };
        const {finished, stepIndex} = this.state;
        const contentStyle = {margin: '0 16px'};

        return (
            <div style={{width: '100%', backgroundColor: '#161e2e'}}>
            <div style={{maxWidth: '700px', margin: 'auto', backgroundColor: '#161e2e',}}>
                <Stepper style={styles.stepper} activeStep={stepIndex}>
                    <Step>
                        <StepLabel style={styles.stepLabel}>Set AOI</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel style={styles.stepLabel}>Add Info</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel style={styles.stepLabel}>Preview and Export</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel style={styles.stepLabel}>Export Status</StepLabel>
                    </Step>
                </Stepper>

                <div style={contentStyle}>
                    
                </div>
             </div>
                <div style={{ float:'right', marginTop: '-20px', marginRight: '100px'}}>
                    <FlatButton
                        label="Back"
                        disabled={stepIndex === 0}
                        onTouchTap={this.handlePrev}
                        style={{marginRight: 12}}
                    />
                    <RaisedButton
                        style={styles.button}
                        label={stepIndex === 2 ? 'Finish' : 'Next'}
                        primary={true}
                        onTouchTap={this.handleNext}
                    />
                </div>
            </div>
        );
    }
}

export default BreadcrumbStepper;
