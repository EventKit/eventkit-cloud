import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import background from '../../../images/ek_topo_pattern.png';

export default function Loading() {
    const constainerStyle = {
        backgroundImage: `url(${background})`,
        height: window.innerHeight - 95,
        width: window.innerWidth,
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
