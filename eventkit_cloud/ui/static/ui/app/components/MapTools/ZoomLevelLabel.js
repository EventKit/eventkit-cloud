import PropTypes from 'prop-types';
import React, { Component } from 'react';
import css from '../../styles/ol3map.css';

export class ZoomLevelLabel extends Component {
    render() {
        return (
            <div className={css.olZoomLevel}>Zoom Level: {this.props.zoomLevel}</div>
        );
    }
}

ZoomLevelLabel.propTypes = {
    zoomLevel: PropTypes.number.isRequired,
};

export default ZoomLevelLabel;
