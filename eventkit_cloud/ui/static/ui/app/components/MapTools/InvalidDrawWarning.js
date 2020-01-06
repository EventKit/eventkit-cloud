import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';

export class InvalidDrawWarning extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const style = {
            backgroundColor: colors.warning,
            border: '1px solid transparent',
            borderColor: colors.warning,
            color: colors.white,
            display: this.props.show ? 'initial' : 'none',
            fontSize: '12px',
            opacity: 0.7,
            padding: '5px 5px 5px 10px',
            position: 'absolute',
            right: '80px',
            top: '70px',
            width: '200px',
            zIndex: 2,
        };

        return (
            <div style={style} className="qa-InvalidDrawWardning-div">
                <span>You drew an invalid bounding box, please redraw.</span>
            </div>
        );
    }
}

InvalidDrawWarning.propTypes = {
    show: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(InvalidDrawWarning);
