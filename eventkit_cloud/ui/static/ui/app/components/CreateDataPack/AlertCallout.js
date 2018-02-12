import React, { Component, PropTypes } from 'react';
import Clear from 'material-ui/svg-icons/content/clear';

export class AlertCallout extends Component {
    render() {
        const styles = {
            container: {
                position: 'absolute',
                ...this.props.style,
            },
            clear: {
                float: 'right',
                height: '20px',
                width: '20px',
                fill: '#4498c0',
                cursor: 'pointer',
            },
            arrow: {
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '14px solid #fff',
                position: 'relative',
                bottom: '-100px',
                left: '50%',
                transform: 'translateX(-50%)',
            },
            textBox: {
                width: '220px',
                height: '100px',
                backgroundColor: '#fff',
                position: 'relative',
                bottom: '14px',
                left: '0px',
                color: '#d32f2f',
                padding: '20px',
            },
        };

        return (
            <div className="qa-AlertCallout" style={styles.container}>
                <div className="qa-AlertCallout-arrow" style={styles.arrow} />
                <div className="qa-AlertCallout-box" style={styles.textBox}>
                    <div className="qa-AlertCallout-header" style={{ lineHeight: '20px' }}>
                        <strong>There must be a buffer.</strong>
                        <Clear
                            className="qa-AlertCallout-alert-close"
                            style={styles.clear}
                            onClick={this.props.onClose}
                        />
                    </div>
                    <div className="qa-AlertCallout-body">
                        Please add a buffer before moving forward.
                    </div>
                </div>
            </div>
        );
    }
}

AlertCallout.propTypes = {
    style: PropTypes.object,
    onClose: PropTypes.func,
};

export default AlertCallout;
