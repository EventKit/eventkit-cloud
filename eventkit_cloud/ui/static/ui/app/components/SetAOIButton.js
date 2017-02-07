import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './SetAOIToolbar.css';
import {toggleDrawSet, clickDrawSet} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox, setAOI, unsetAOI} from '../actions/exportsActions.js';

export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
const isEqual = require('lodash/isEqual');


export class SetAOIButton extends Component {

    constructor(props) {
        super(props);
        this.updateSetButtonState = this.updateSetButtonState.bind(this);
        this.dispatchSetClick = this.dispatchSetClick.bind(this);
        this.handleSetClick = this.handleSetClick.bind(this);
        this.state = {
            setButtonClass: styles.setButtonInactive,
        };
    }

    componentWillMount() {
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.drawSet.disabled != this.props.drawSet.disabled) {
            this.updateSetButtonState(nextProps.drawSet.disabled);
        }
        if (!isEqual(nextProps.geojson, {}) && !isEqual(nextProps.geojson, this.props.geojson)) {
            this.props.toggleDrawSet(false);
        }
        if(nextProps.drawSet.click != this.props.drawSet.click) {
            this.handleSetClick();
        }
    }

    handleSetClick() {
        this.props.setAOI();
    }

    dispatchSetClick() {
        if(!this.props.drawSet.disabled) {
            this.props.clickDrawSet();
            this.props.toggleDrawSet(true);
        }
    }

    updateSetButtonState(disabled) {
        if (disabled) {
            this.setState({setButtonClass: styles.setButtonInactive});
        }
        else {
            this.setState({setButtonClass: styles.setButtonActive});
        }
    }
    render() {
        return (
            <button className={styles.setButton} onClick={this.dispatchSetClick}>
                <div>
                    <i className={"material-icons " + styles.forwardArrow}>arrow_forward</i>
                    <div>SET</div>
                </div>
            </button>
        )
    }
}

function mapStateToProps(state) {
    return {
        drawSet: state.drawSet,
        geojson: state.geojson,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleDrawSet: (isDisabled) => {
            dispatch(toggleDrawSet(isDisabled));
        },
        clickDrawSet: () => {
            dispatch(clickDrawSet());
        },
        setAOI: () => {
            dispatch(setAOI());
        },
        unsetAOI: () => {
            dispatch(unsetAOI());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SetAOIButton);



