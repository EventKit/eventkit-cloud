import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class FeaturedFlag extends Component {
    render() {
        const style = {
            backgroundColor: '#4498c0',
            color: '#fff',
            textAlign: 'center',
            fontSize: '11px',
            position: 'absolute',
            top: -15,
            right: -10,
            width: 100,
            height: 16,
            lineHeight: '16px',
            zIndex: 2,
            ...this.props.style,
        };

        if (!this.props.show) {
            return null;
        }

        return (
            <div className="qa-FeaturedFlag-div tour-datapack-featured" style={style}>FEATURED</div>
        );
    }
}

FeaturedFlag.defaultProps = {
    style: {},
};

FeaturedFlag.propTypes = {
    show: PropTypes.bool.isRequired,
    style: PropTypes.object,
};

export default FeaturedFlag;
