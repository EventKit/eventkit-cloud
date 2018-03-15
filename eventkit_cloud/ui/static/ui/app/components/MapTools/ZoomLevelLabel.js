import React, { Component, PropTypes } from 'react';
import css from '../../styles/ol3map.css';

export class ZoomLevelLabel extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const zoomLevel = Math.floor(this.props.zoomLevel);

        return (
            <div className={css.olZoomLevel}>Zoom Level: {zoomLevel}</div>
        )
    }
}

ZoomLevelLabel.propTypes = {
    zoomLevel: PropTypes.number.isRequired,
};

export default ZoomLevelLabel;
