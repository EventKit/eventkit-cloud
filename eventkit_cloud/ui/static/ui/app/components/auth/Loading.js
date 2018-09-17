import React from 'react';
import PropTypes from 'prop-types';
import { withTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

export function Loading(props) {
    const constainerStyle = {
        backgroundImage: `url(${props.theme.eventkit.images.topo_dark})`,
        height: 'calc(100vh - 95px)',
        width: '100vw',
        display: 'inline-flex',
    };
    return (
        <div
            className="qa-loading-body"
            style={constainerStyle}
        >
            <CircularProgress
                style={{ margin: 'auto', display: 'block' }}
                color="primary"
                size={50}
            />
        </div>
    );
}

Loading.propTypes = {
    theme: PropTypes.object.isRequired,
};

export default withTheme()(Loading);
