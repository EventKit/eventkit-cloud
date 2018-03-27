import React, { Component, PropTypes } from 'react';

export class ShareBodyTooltip extends Component {
    render() {
        const targetPosition = this.props.target.getBoundingClientRect();
        const bodyPosition = this.props.body.getBoundingClientRect();

        const styles = {
            arrowContainer: {
                position: 'absolute',
                width: '30px',
                height: '20px',
                left: targetPosition.left - bodyPosition.left,
                top: ((targetPosition.top - bodyPosition.top) - targetPosition.height),
                fontSize: '12px',
                opacity: 1,
                pointerEvents: 'auto',
                cursor: 'default',
                whiteSpace: 'normal',
                zIndex: 9001,
                ...this.props.arrowContainerStyle,
            },
            arrow: {
                position: 'absolute',
                width: 0,
                height: 0,
                left: -1,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '20px solid white',
                zIndex: 1,
                ...this.props.arrowStyle,
            },
            arrowSilhouette: {
                position: 'absolute',
                width: 0,
                height: 0,
                left: -2,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '21px solid rgba(0, 0, 0, 0.2)',
                ...this.props.arrowSilhouetteStyle,
            },
            textContainer: {
                position: 'absolute',
                left: 30,
                right: 30,
                bottom: (bodyPosition.height - (targetPosition.top - bodyPosition.top)) + 27,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 9000,
                ...this.props.textContainerStyle,
            },
            text: {
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                padding: '15px 45px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 700,
                ...this.props.textStyle,
            },
        };

        return (
            <div>
                <div
                    className="qa-ShareBodyTooltip-arrow"
                    style={styles.arrowContainer}
                >
                    <div
                        style={styles.arrow}
                    />
                    <div
                        style={styles.arrowSilhouette}
                    />
                </div>
                <div
                    className="qa-ShareBodyTooltip-text"
                    style={styles.textContainer}
                >
                    <div
                        style={styles.text}
                    >
                        {this.props.text}
                    </div>
                </div>
            </div>
        );
    }
}

ShareBodyTooltip.defaultProps = {
    arrowStyle: {},
    arrowContainerStyle: {},
    arrowSilhouetteStyle: {},
    textContainerStyle: {},
    textStyle: {},
};

ShareBodyTooltip.propTypes = {
    text: PropTypes.string.isRequired,
    target: PropTypes.object.isRequired,
    body: PropTypes.object.isRequired,
    arrowStyle: PropTypes.object,
    arrowContainerStyle: PropTypes.object,
    arrowSilhouetteStyle: PropTypes.object,
    textContainerStyle: PropTypes.object,
    textStyle: PropTypes.object,
};

export default ShareBodyTooltip;
