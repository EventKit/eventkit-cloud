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
        switch (status) {
            case 'SUCCESS':
                return (<ActionDone title={message} />);
            case 'ERR_CONNECTION':
            case 'ERR_UNAUTHORIZED':
                return (<AlertError title={message} />);
            case 'WARN_UNAVAILABLE':
            case 'WARN_UNKNOWN_FORMAT':
            case 'WARN_LAYER_NOT_AVAILABLE':
            case 'WARN_NO_INTERSECT':
                return (<AlertWarning title={message} />);
            case 'PENDING':
            default:
                return (<ActionSchedule title={message} />);
        }
    }
}

ProviderStatusIcon.propTypes = {
    availability: PropTypes.string.isRequired,
}

export default ProviderStatusIcon;
