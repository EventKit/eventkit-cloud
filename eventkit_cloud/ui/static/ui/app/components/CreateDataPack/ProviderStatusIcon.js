import React, {PropTypes, Component} from 'react'
import AlertWarning from 'material-ui/svg-icons/alert/warning'
import AlertError from 'material-ui/svg-icons/alert/error'
import ActionDone from 'material-ui/svg-icons/action/done'
import ActionSchedule from 'material-ui/svg-icons/action/schedule'
import NotificationSyncProblem from 'material-ui/svg-icons/notification/sync-problem';
import BaseTooltip from '../BaseTooltip';

export class ProviderStatusIcon extends Component {

    constructor(props) {
        super(props);
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

    handleTooltipOpen(e) {
        this.setState({ tooltipOpen: true });
        return false;
    }

    handleTooltipClose(e) {
        this.setState({ tooltipOpen: false });
        return false;
    }

    render() {

        var style = {
            icon: {
                verticalAlign: 'top',
                marginTop: '-5px',
                pointerEvents: 'all'
            },
        };

        let statusStr = this.props.availability.status + " ";

        let StatusIcon;
        let title;
        let messagePrefix;
        switch (statusStr.slice(0, statusStr.indexOf("_"))) {
            case 'SUCCESS':
                style.icon['color'] = 'rgba(0, 192, 0, 0.87)';
                StatusIcon = ActionDone;
                title = "Success";
                messagePrefix = "No problems: ";
                break;
            case 'ERR':
                style.icon['color'] = 'rgba(192, 0, 0, 0.87)';
                StatusIcon = AlertError;
                title = "Almost Certain Failure";
                messagePrefix = "Availability unlikely: ";
                break;
            case 'WARN':
                style.icon['color'] = 'rgba(255, 162, 0, 0.87)';
                StatusIcon = AlertWarning;
                title = "Possible Failure";
                messagePrefix = "Availability compromised: ";
                break;
            case 'TIMEOUT':
                style.icon['color'] = 'rgba(73, 153, 189, 0.87)';
                StatusIcon = NotificationSyncProblem;
                title = "Timeout: Refresh";
                messagePrefix = "";
                break;
            case 'PENDING':
                style.icon['color'] = 'rgba(0, 0, 0, 0.87)';
                StatusIcon = ActionSchedule;
                title = "Checking Availability"
                messagePrefix = "";
            default:
                break;
        }

        let message = messagePrefix + this.props.availability.message;

        return (
            <div style={{ display: 'inline-block', position: 'absolute' }} >
                <StatusIcon
                    style={style.icon}
                    title={this.props.availability.message}
                    onTouchTap={this.onTouchTap.bind(this)}
                    onMouseOver={this.handleTooltipOpen.bind(this)}
                    onMouseOut={this.handleTooltipClose.bind(this)}
                    onTouchStart={this.handleTooltipOpen.bind(this)}
                    onTouchEnd={this.handleTooltipClose.bind(this)}
                />
                <BaseTooltip
                    show={this.state.tooltipOpen}
                    title={title}
                    onMouseOver={this.handleTooltipOpen.bind(this)}
                    onMouseOut={this.handleTooltipClose.bind(this)}
                >
                    <div>{message}</div>
                </BaseTooltip>
            </div>
        );
    }
}

ProviderStatusIcon.propTypes = {
    availability: PropTypes.object.isRequired,
}

export default ProviderStatusIcon;
