import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class BaseTooltip extends Component {
    constructor(props) {
        super(props);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onClick = this.onClick.bind(this);
    }
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

    onClick(e) {
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(e);
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
            },
        };

        if (this.props.show) {
            styles.tooltip.display = 'block';
            styles.tooltip.opacity = '1';
            styles.tooltip.pointerEvents = 'auto';
        }

        return (
            <div
                role="button"
                tabIndex={0}
                className="qa-BaseTooltip"
                style={styles.tooltip}
                onMouseOver={this.onMouseOver}
                onMouseOut={this.onMouseOut}
                onKeyPress={this.onClick}
                onFocus={this.onMouseOver}
                onBlur={this.onMouseOut}
                onClick={this.onClick}
            >
                <div className="qa-BaseTooltip-title" style={styles.title}>
                    <strong>{this.props.title ? this.props.title : ''}</strong>
                </div>
                <div>
                    {this.props.children}
                </div>
                <div className="qa-BaseTooltip-arrow" style={styles.arrow} />
                <div className="qa-BaseTooltip-arrow-block" style={styles.arrowBlock} />
            </div>
        );
    }
}

BaseTooltip.defaultProps = {
    title: '',
    children: undefined,
    onMouseOut: undefined,
    onMouseOver: undefined,
    onClick: undefined,
    tooltipStyle: {},
    arrowStyle: {},
    titleStyle: {},
};

BaseTooltip.propTypes = {
    show: PropTypes.bool.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
        PropTypes.string,
    ]),
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    onClick: PropTypes.func,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    tooltipStyle: PropTypes.object,
    arrowStyle: PropTypes.object,
    titleStyle: PropTypes.object,
};

export default BaseTooltip;
