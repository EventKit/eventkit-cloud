import React, { Component, PropTypes } from 'react';
import Clear from 'material-ui/svg-icons/content/clear';
import css from '../../styles/popup.css';

export class AlertCallout extends Component {
    render() {
        const styles = {
            clear: {
                float: 'right',
                height: '20px',
                width: '20px',
                fill: '#4498c0',
                cursor: 'pointer',
            },
        };

        return (
            <div
                className={`${css.callout} ${css[this.props.orientation]} qa-AlertCallout`}
                style={this.props.style}
            >
                <p style={{ minHeight: '20px' }} className="qa-AlertCallout-title">
                    <strong>{this.props.title}</strong>
                    <Clear
                        className="qa-AlertCallout-alert-close"
                        style={styles.clear}
                        onClick={this.props.onClose}
                    />
                </p>
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
