import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from './DrawAOIToolbar.css'
import RaisedButton from 'material-ui/RaisedButton'
import {toggleDrawSet, clickDrawSet, toggleDrawBoxButton, clickDrawBoxButton} from '../actions/drawToolBarActions.js'
import {updateMode, updateBbox} from '../actions/exportsActions.js'


export class DrawButtons extends Component {



    constructor(props) {
        super(props)
        this.handleFreeClick = this.handleFreeClick.bind(this)
        this.handleDrawBoxClick = this.handleDrawBoxClick.bind(this)
        this.setBoxStyle = this.setBoxStyle.bind(this)
        this.state = {
            freeClass: styles.drawButtonsFreeDiv,
            freeSelected: false,
            boxClass: styles.drawButtonsBoxDiv,
            boxSelected: false,
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
            this.setState({boxClass: styles.drawButtonsBoxDivSelect, boxSelected: true})
        }
        else {
            this.setState({boxClass: styles.drawButtonsBoxDiv, boxSelected: false})
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
                <div className={this.state.freeClass}>
                    <RaisedButton label="FREE" style={buttonStyles.button} onClick={this.handleFreeClick} />
                </div>

                <div className={this.state.boxClass}>
                    <RaisedButton label="BOX" style={buttonStyles.button} onClick={this.props.clickDrawBoxButton} />
                </div>
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
