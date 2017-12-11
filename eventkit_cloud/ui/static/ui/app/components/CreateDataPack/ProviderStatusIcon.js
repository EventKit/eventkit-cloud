import React, {PropTypes, Component} from 'react'
import AlertWarning from 'material-ui/svg-icons/alert/warning'
import AlertError from 'material-ui/svg-icons/alert/error'
import ActionDone from 'material-ui/svg-icons/action/done'
import ActionSchedule from 'material-ui/svg-icons/action/schedule'

export class ProviderStatusIcon extends Component {

    render() {
        let status, message = null;
        if (this.props.availability) {
            status = this.props.availability.status;
            message = this.props.availability.message;
        }
        var style = {'vertical-align': 'top', 'margin-top': '-5px'}

        switch (status) {
            case 'SUCCESS':
                style['color'] = 'rgba(0, 192, 0, 0.87)'
                return (<ActionDone style={style} title={message} />);
            case 'ERR_CONNECTION':
            case 'ERR_UNAUTHORIZED':
                style['color'] = 'rgba(192, 0, 0, 0.87)'
                return (<AlertError style={style} title={message} />);
            case 'WARN_UNAVAILABLE':
            case 'WARN_UNKNOWN_FORMAT':
            case 'WARN_LAYER_NOT_AVAILABLE':
            case 'WARN_NO_INTERSECT':
                style['color'] = 'rgba(255, 162, 0, 0.87)'
                return (<AlertWarning style={style} title={message} />);
            case 'PENDING':
            default:
                return (<ActionSchedule style={style} title={message} />);
        }
    }
}

ProviderStatusIcon.propTypes = {
    availability: PropTypes.object,
}

export default ProviderStatusIcon;
