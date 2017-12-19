import React, {PropTypes, Component} from 'react'
import AlertWarning from 'material-ui/svg-icons/alert/warning'
import AlertError from 'material-ui/svg-icons/alert/error'
import ActionDone from 'material-ui/svg-icons/action/done'
import ActionSchedule from 'material-ui/svg-icons/action/schedule'
import BaseDialog from '../BaseDialog';

export class ProviderStatusIcon extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dialogOpen: false,
        };
    }

    handleTouchTap(e) {
        if (typeof this.props.onTouchTap === 'function') {
            this.props.onTouchTap(e);
        }
        this.handleDialogOpen(e);
    }

    handleDialogOpen(e) {
        this.setState({ dialogOpen: true });
        return false;
    }

    handleDialogClose(e) {
        this.setState({ dialogOpen: false });
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

        var StatusIcon = ActionSchedule;
        let statusStr = this.props.availability.status + " ";
        switch (statusStr.slice(0, statusStr.indexOf("_"))) {
            case 'SUCCESS':
                style.icon['color'] = 'rgba(0, 192, 0, 0.87)'
                StatusIcon = ActionDone;
                break;
            case 'ERR':
                style.icon['color'] = 'rgba(192, 0, 0, 0.87)'
                StatusIcon = AlertError;
                break;
            case 'WARN':
                style.icon['color'] = 'rgba(255, 162, 0, 0.87)'
                StatusIcon = AlertWarning;
                break;
            default:
                break;
        }

        return (
            <div style={{ display: 'inline-block' }} >
                <StatusIcon style={style.icon} title={this.props.availability.message} onTouchTap={this.handleTouchTap.bind(this)} />
                <BaseDialog
                    show={this.state.dialogOpen}
                    title="Data Provider Availability"
                    onClose={this.handleDialogClose.bind(this)}
                >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{this.props.availability.message}</div>
                </BaseDialog>
            </div>
        );
    }
}

ProviderStatusIcon.propTypes = {
    availability: PropTypes.object.isRequired,
}

export default ProviderStatusIcon;
