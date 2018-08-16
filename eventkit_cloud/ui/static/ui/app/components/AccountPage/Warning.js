import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class Warning extends Component {
    render() {
        const bodyStyle = {
            backgroundColor: '#f8e6dd',
            width: '100%',
            margin: '5px 0px',
            lineHeight: '25px',
            padding: '16px',
            textAlign: 'center',
        };

        return (
            <div className="qa-Warning-text" style={bodyStyle}>
                {this.props.text}
            </div>
        );
    }
}

Warning.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
};

export default Warning;
