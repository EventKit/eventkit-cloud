import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from './DrawAOIToolbar.css'
import RaisedButton from 'material-ui/RaisedButton'
import {toggleDrawSet, clickDrawSet, toggleDrawBoxButton, clickDrawBoxButton} from '../actions/drawToolBarActions.js'
import {updateMode, updateBbox} from '../actions/exportsActions.js'
import { Button } from 'react-bootstrap';


export class DrawButtons extends Component {



    constructor(props) {
        super(props)
        this.handleFreeClick = this.handleFreeClick.bind(this)
        this.handleDrawBoxClick = this.handleDrawBoxClick.bind(this)
        this.setBoxStyle = this.setBoxStyle.bind(this)
        this.state = {
            freeClass: styles.drawButtonInactive,
            boxClass: styles.drawButtonInactive,
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.drawBoxButton.disabled != this.props.drawBoxButton.disabled) {
            this.setBoxStyle(nextProps.drawBoxButton.disabled)
        }
        if (nextProps.drawBoxButton.click != this.props.drawBoxButton.click) {
            this.handleDrawBoxClick()
        }
    }

    setBoxStyle(disabled) {
        if(!disabled) {
            this.setState({boxClass: styles.drawButtonActive})
        }
        else {
            this.setState({boxClass: styles.drawButtonInactive})
        }
    }

    handleFreeClick(event) {
        console.log("Not implemented yet");
    }

    handleDrawBoxClick() {
        if (this.props.drawBoxButton.disabled) {
            if(this.state.freeSelected) {
                this.setState({freeClass: styles.drawButtonsFreeDiv, freeSelected: false})
            }
            this.props.toggleDrawBoxButton(this.props.drawBoxButton.disabled);
        }
    }

    render() {

        const buttonStyles = {
            button: {
                height: '30px',
                width: '70px',
            }
        }

        return (
            <div>
               <Button bsClass={styles.buttonGeneral + " " + this.state.boxClass} onClick={this.props.clickDrawBoxButton}>BOX</Button>
               <Button bsClass={styles.buttonGeneral + " " + this.state.freeClass} >FREE</Button>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        drawBoxButton: state.drawBoxButton,
        mode: state.mode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode))
        },
        toggleDrawBoxButton: (currentToggleState) => {
            dispatch(toggleDrawBoxButton(currentToggleState))
        },
        clickDrawBoxButton: () => {
            dispatch(clickDrawBoxButton())
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DrawButtons);
