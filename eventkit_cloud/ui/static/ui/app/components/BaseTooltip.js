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


    render() {
        // default styling with the option for overriding with custom props
        const styles = {
            tooltip: {
                position: 'absolute',
                fontSize: '12px',
                // marginTop: '-38%',
                // marginLeft: '-48%',
                bottom: '36px',
                left: '-157px',
                background: 'white',
                boxShadow: 'rgba(0, 0, 0, 0.106) -2px 2px 2px 0px',
                padding: '20px',
                width: '330px',
                transition: '0.25s',
                display: 'none',
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
                display: 'inherit',
                opacity: 'inherit',
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
        }

        return (
            <div
                className="qa-BaseTooltip"
                style={styles.tooltip}
                onMouseOver={this.onMouseOver.bind(this)}
                onMouseOut={this.onMouseOut.bind(this)}
            >
                <div className="qa-BaseTooltip-title" style={styles.title}>
                    <strong>{this.props.title ? this.props.title : ''}</strong>
                </div>
                <div>
                    {this.props.children}
                </div>
                <div className="qa-BaseTooltip-arrow" style={styles.arrow} ></div>
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
