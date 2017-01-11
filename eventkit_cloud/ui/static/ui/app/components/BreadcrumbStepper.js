import React from 'react';
import { Link, IndexLink } from 'react-router'
import Button from 'react-bootstrap/lib/Button'
import Breadcrumb from 'react-bootstrap/lib/Breadcrumb'
import style from './BreadcrumbStepper.css'

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
                fontFamily: 'Roboto',
                fontSize: '18px',
            },
            stepLabel: {
                color: 'white',
                fontSize: '18px',
            },
            btnLg : {
            width: '50px',
            height: '50px',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: '18px',
            lineHeight: '1.33',
            borderRadius: '25px',
        }
        };
        const {finished, stepIndex} = this.state;
        const contentStyle = {margin: '0 16px'};

        return (
            <div style={{width: '100%', backgroundColor: '#161e2e'}}>
            <div style={{width: '50%', margin: '0 auto', backgroundColor: '#161e2e'}}>
                <Breadcrumb style={styles.stepper}>
                    <Breadcrumb.Item style={styles.stepper} href="#">
                        Set AOI
                    </Breadcrumb.Item>
                    <Breadcrumb.Item style={styles.stepper} href="#">
                        Add Info
                    </Breadcrumb.Item>
                    <Breadcrumb.Item style={styles.stepper}>
                        Preview & Export
                    </Breadcrumb.Item>
                    <Breadcrumb.Item style={styles.stepper}>
                        Export Status
                    </Breadcrumb.Item>
                </Breadcrumb>

                <div style={contentStyle}>

                </div>
             </div>
                <div style={{ float:'right', marginTop: '-45px', marginRight: '400px'}}>
                    <Button bsStyle="primary" style={styles.btnLg}  disabled><i className="fa fa-arrow-left" aria-hidden="true"></i></Button>
                    <Button bsStyle="success" style={styles.btnLg}><i className="fa fa-arrow-right" aria-hidden="true"></i></Button>
                </div>
            </div>
        );
    }
}

export default BreadcrumbStepper;
