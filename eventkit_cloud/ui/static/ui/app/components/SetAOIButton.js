import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import {toggleDrawSet, clickDrawSet} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import DrawButtons from './DrawButtons.js';
import { Button } from 'react-bootstrap';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
const isEqual = require('lodash/isEqual');


export class SetAOIButton extends Component {

    constructor(props) {
        super(props);
        this.updateSetButtonState = this.updateSetButtonState.bind(this);
        this.state = {
            setButtonClass: styles.setButtonInactive,
        };
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.drawSet.disabled != this.props.drawSet.disabled) {
            this.updateSetButtonState(nextProps.drawSet.disabled);
        }
        if (!isEqual(nextProps.geojson, this.props.geojson)) {
            this.props.toggleDrawSet();
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
            <div className={styles.setButtonDiv}>
                <Button bsClass={styles.buttonGeneral + ' ' + this.state.setButtonClass} onClick={this.props.clickDrawSet}>SET</Button>
            </div>
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
        toggleDrawSet: (currentToggleState) => {
            dispatch(toggleDrawSet(currentToggleState));
        },
        clickDrawSet: () => {
            dispatch(clickDrawSet());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SetAOIButton);



