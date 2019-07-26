import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';

export class InvalidDrawWarning extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const style = {
            display: this.props.show ? 'initial' : 'none',
            position: 'absolute',
            top: '70px',
            right: '80px',
            width: '200px',
            border: '1px solid transparent',
            padding: '5px 5px 5px 10px',
            backgroundColor: colors.warning,
            borderColor: colors.warning,
            color: colors.white,
            zIndex: 2,
            opacity: 0.7,
            fontSize: '12px',
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
