import React, { PropTypes, Component } from 'react';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import AlertError from 'material-ui/svg-icons/alert/error';
import ActionDone from 'material-ui/svg-icons/action/done';
import CircularProgress from 'material-ui/CircularProgress';
import BaseTooltip from '../BaseTooltip';

export class ProviderStatusIcon extends Component {
    constructor(props) {
        super(props);
        this.onTouchTap = this.onTouchTap.bind(this);
        this.handleTooltipClose = this.handleTooltipClose.bind(this);
        this.handleTooltipOpen = this.handleTooltipOpen.bind(this);
        this.state = {
            tooltipOpen: false,
        };
    }

    onTouchTap(e) {
        if (typeof this.props.onTouchTap === 'function') {
            this.props.onTouchTap(e);
        }
        this.handleTooltipOpen(e);
    }

    handleTooltipOpen() {
        this.setState({ tooltipOpen: true });
        return false;
    }

    handleTooltipClose() {
        this.setState({ tooltipOpen: false });
        return false;
    }

    render() {
        const style = {
            base: {
                display: 'inline-block',
                position: 'absolute',
                ...this.props.baseStyle,
            },
            icon: {
                verticalAlign: 'top',
                marginTop: '-5px',
                pointerEvents: 'all',
                ...this.props.iconStyle,
            },
        };

        const avail = this.props.availability.status ?
            this.props.availability :
            { status: 'PENDING', type: 'PENDING', message: "This data provider's availability is being checked." };

        let StatusIcon;
        let title;
        let messagePrefix;
        let otherProps = {};
        switch (avail.status.toUpperCase()) {
            case 'SUCCESS':
                style.icon.color = 'rgba(0, 192, 0, 0.87)';
                StatusIcon = ActionDone;
                title = 'Success';
                messagePrefix = 'No problems: ';
                break;
            case 'FATAL':
                style.icon.color = 'rgba(128, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = 'Cannot Select';
                messagePrefix = '';
                break;
            case 'ERR':
                style.icon.color = 'rgba(192, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = 'Almost Certain Failure';
                messagePrefix = 'Availability unlikely: ';
                break;
            case 'WARN':
                style.icon.color = 'rgba(255, 162, 0, 0.87)';
                StatusIcon = AlertWarning;
                title = 'Possible Failure';
                messagePrefix = 'Availability compromised: ';
                break;
            case 'PENDING':
            default:
                style.icon.color = 'rgba(0, 0, 0, 0.87)';
                StatusIcon = CircularProgress;
                title = 'Checking Availability';
                messagePrefix = '';
                otherProps = { thickness: 2 };
                break;
        }

        const message = messagePrefix + avail.message;
        const tooltipOffset = window.innerWidth < 777 ? `${(777 - window.innerWidth) / 3}px` : '0px';

        return (
            <div style={style.base} className="qa-ProviderStatusIcon" >
                <StatusIcon
                    style={style.icon}
                    title={this.props.availability.message}
                    onTouchTap={this.onTouchTap}
                    onMouseOver={this.handleTooltipOpen}
                    onMouseOut={this.handleTooltipClose}
                    onTouchStart={this.handleTooltipOpen}
                    onTouchEnd={this.handleTooltipClose}
                    onFocus={this.handleTooltipOpen}
                    onBlur={this.handleTooltipClose}
                    size={20}
                    color={style.icon.color}
                    {...otherProps}
                />
                <BaseTooltip
                    show={this.state.tooltipOpen}
                    title={title}
                    tooltipStyle={{
                        bottom: '36px',
                        left: `calc(-157px - ${tooltipOffset})`,
                        ...this.props.tooltipStyle,
                    }}
                    arrowStyle={{
                        left: `calc(50% + ${tooltipOffset})`,
                        ...this.props.arrowStyle,
                    }}
                    onMouseOver={this.handleTooltipOpen}
                    onMouseOut={this.handleTooltipClose}
                    onTouchTap={this.onTouchTap}
                    onFocus={this.handleTooltipOpen}
                    onBlur={this.handleTooltipClose}
                >
                    <div>{message}</div>
                </BaseTooltip>
            </div>
        );
    }
}

ProviderStatusIcon.defaultProps = {
    availability: {},
    onTouchTap: undefined,
    baseStyle: {},
    iconStyle: {},
    tooltipStyle: {},
    arrowStyle: {},
};

ProviderStatusIcon.propTypes = {
    availability: PropTypes.object,
    onTouchTap: PropTypes.func,
    baseStyle: PropTypes.object,
    iconStyle: PropTypes.object,
    tooltipStyle: PropTypes.object,
    arrowStyle: PropTypes.object,
};

export default ProviderStatusIcon;
