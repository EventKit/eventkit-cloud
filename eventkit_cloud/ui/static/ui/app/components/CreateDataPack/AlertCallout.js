import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Clear from '@material-ui/icons/Clear';
import css from '../../styles/popup.css';

export class AlertCallout extends Component {
    render() {
        const styles = {
            clear: {
                height: '20px',
                width: '20px',
                flex: '0 0 auto',
                fill: '#4498c0',
                cursor: 'pointer',
            },
        };

        return (
            <div
                className={`${css.callout} ${css[this.props.orientation]} qa-AlertCallout`}
                style={this.props.style}
            >
                <div
                    style={{ minHeight: '20px', display: 'flex', marginBottom: '10px' }}
                    className="qa-AlertCallout-title"
                >
                    <div style={{ flexWrap: 'wrap', flex: '1 1 auto' }}><strong>{this.props.title}</strong></div>
                    <Clear
                        className="qa-AlertCallout-alert-close"
                        style={styles.clear}
                        onClick={this.props.onClose}
                    />
                </div>
                <div className="qa-AlertCallout-body">
                    {this.props.body}
                </div>
            </div>
        );
    }
}
AlertCallout.defaultProps = {
    title: '',
    body: null,
    style: {},
};

AlertCallout.propTypes = {
    title: PropTypes.string,
    body: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    orientation: PropTypes.oneOf([
        'top',
        'bottom',
        'top-left',
        'top-right',
        'right-bottom',
        'left-bottom',
    ]).isRequired,
    style: PropTypes.object,
    onClose: PropTypes.func.isRequired,
};

export default AlertCallout;
