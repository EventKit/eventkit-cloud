import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import RaisedButton from 'material-ui/RaisedButton';
import {toggleDrawSet, clickDrawSet, toggleDrawBoxButton, clickDrawBoxButton, toggleDrawFreeButton, clickDrawFreeButton} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import { Button } from 'react-bootstrap';


export class DrawButtons extends Component {



    constructor(props) {
        super(props);
        this.handleDrawFreeClick = this.handleDrawFreeClick.bind(this);
        this.handleDrawBoxClick = this.handleDrawBoxClick.bind(this);
        this.setBoxStyle = this.setBoxStyle.bind(this);
        this.setFreeStyle = this.setFreeStyle.bind(this);
        this.state = {
            freeClass: styles.drawButtonInactive,
            boxClass: styles.drawButtonInactive,
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.drawBoxButton.disabled != this.props.drawBoxButton.disabled) {
            this.setBoxStyle(nextProps.drawBoxButton.disabled);
        }
        if (nextProps.drawBoxButton.click != this.props.drawBoxButton.click) {
            this.handleDrawBoxClick();
        }
        if (nextProps.drawFreeButton.disabled != this.props.drawFreeButton.disabled) {
            this.setFreeStyle(nextProps.drawFreeButton.disabled);
        }
        if (nextProps.drawFreeButton.click != this.props.drawFreeButton.click) {
            this.handleDrawFreeClick();
        }
    }

    setBoxStyle(disabled) {
        if(!disabled) {
            this.setState({boxClass: styles.drawButtonActive});
        }
        else {
            this.setState({boxClass: styles.drawButtonInactive});
        }
    }

    setFreeStyle(disabled) {
        if(!disabled) {
            this.setState({freeClass: styles.drawButtonActive});
        }
        else {
            this.setState({freeClass: styles.drawButtonInactive});
        }
    }

    handleDrawBoxClick() {
        if (this.props.drawBoxButton.disabled) {
            if(!this.props.drawFreeButton.disabled) {
                this.props.toggleDrawFreeButton(true);
            }
            this.props.toggleDrawBoxButton(false);
        }
    }

    handleDrawFreeClick() {
        if (this.props.drawFreeButton.disabled) {
            if(!this.props.drawBoxButton.disabled) {
                this.props.toggleDrawBoxButton(true);
            }
            this.props.toggleDrawFreeButton(false);
        }
    }

    render() {
        return (
            <div>
               <Button bsClass={styles.buttonGeneral + " " + this.state.boxClass} onClick={this.props.clickDrawBoxButton}>BOX</Button>
               <Button bsClass={styles.buttonGeneral + " " + this.state.freeClass} onClick={this.props.clickDrawFreeButton}>FREE</Button>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        drawBoxButton: state.drawBoxButton,
        drawFreeButton: state.drawFreeButton,
        mode: state.mode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        toggleDrawBoxButton: (isDisabled) => {
            dispatch(toggleDrawBoxButton(isDisabled));
        },
        clickDrawBoxButton: () => {
            dispatch(clickDrawBoxButton());
        },
        toggleDrawFreeButton: (isDisabled) => {
            dispatch(toggleDrawFreeButton(isDisabled));
        },
        clickDrawFreeButton: () => {
            dispatch(clickDrawFreeButton());
        },

    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DrawButtons);
