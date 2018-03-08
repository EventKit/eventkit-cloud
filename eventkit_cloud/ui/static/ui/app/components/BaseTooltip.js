import React, { PropTypes, Component } from 'react';

export class BaseTooltip extends Component {

    onMouseOver(e) {
        if (typeof this.props.onMouseOver === 'function') {
            this.props.onMouseOver(e);
        }
    }

    onMouseOut(e) {
        if (typeof this.props.onMouseOut === 'function') {
            this.props.onMouseOut(e);
        }
    }

    onTouchTap(e) {
        if (typeof this.props.onTouchTap === 'function') {
            this.props.onTouchTap(e);
        }
    }


    render() {
        // default styling with the option for overriding with custom props
        const styles = {
            tooltip: {
                position: 'absolute',
                fontSize: '12px',
                background: 'white',
                boxShadow: 'rgba(0, 0, 0, 0.106) -2px 2px 2px 0px',
                padding: '20px',
                width: '330px',
                transition: '0.25s',
                opacity: '0',
                pointerEvents: 'none',
                cursor: 'default',
                whiteSpace: 'normal',
                ...this.props.tooltipStyle,
            },
            arrow: {
                color: 'white',
                marginLeft: '-10px',
                transform: 'rotate(-45deg)',
                transformOrigin: '0 0',
                top: '100%',
                left: '50%',
                border: '10px solid',
                content: ' ',
                height: '0',
                width: '0',
                position: 'absolute',
                boxShadow: '2px -2px 0px 1px white, rgba(0,0,0,0.105) -2px 0 1px',
                ...this.props.arrowStyle,
            },
            arrowBlock: {
                top: '100%',
                left: '50%',
                border: '14px solid',
                content: ' ',
                height: '0',
                width: '0',
                position: 'absolute',
                marginLeft: '-10px',
                marginTop: '-3px',
                opacity: '0',
                cursor: 'pointer',
                pointerEvents: 'all',
                ...this.props.arrowStyle,
            },
            title: {
                textTransform: 'uppercase',
                marginBottom: '10px',
                ...this.props.titleStyle,
            }
        };

        if (this.props.show) {
            styles.tooltip.display = 'block';
            styles.tooltip.opacity = '1';
            styles.tooltip.pointerEvents = 'auto';
        }

        return (
            <div
                className="qa-BaseTooltip"
                style={styles.tooltip}
                onMouseOver={this.onMouseOver.bind(this)}
                onMouseOut={this.onMouseOut.bind(this)}
                onTouchTap={this.onTouchTap.bind(this)}
            >
                <div className="qa-BaseTooltip-title" style={styles.title}>
                    <strong>{this.props.title ? this.props.title : ''}</strong>
                </div>
                <div>
                    {this.props.children}
                </div>
                <div className="qa-BaseTooltip-arrow" style={styles.arrow} ></div>
                <div className="qa-BaseTooltip-arrow-block" style={styles.arrowBlock} ></div>
            </div>
        );
    }
}

BaseTooltip.propTypes = {
    show: PropTypes.bool.isRequired,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    tooltipStyle: PropTypes.object,
    arrowStyle: PropTypes.object,
    titleStyle: PropTypes.object,
};

export default BaseTooltip;
