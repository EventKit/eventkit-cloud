import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { verbs } from '../../utils/notificationUtils';

export class NotificationIcon extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const { notification } = this.props;
        const verb = notification.verb.toLowerCase();

        const styles = {
            icon: {
                marginRight: '10px',
                flex: '0 0 auto',
                ...this.props.iconStyle,
            },
        };

        let icon;
        switch (verb) {
            case verbs.runStarted:
                icon = (
                    <InfoIcon
                        className="qa-NotificationIcon"
                        style={{
                            ...styles.icon,
                            fill: colors.background_light,
                        }}
                    />
                );
                break;
            case verbs.runCompleted:
                icon = (
                    <CheckCircleIcon
                        className="qa-NotificationIcon"
                        style={{
                            ...styles.icon,
                            fill: colors.success,
                        }}
                    />
                );
                break;
            case verbs.addedToGroup:
            case verbs.setAsGroupAdmin:
                icon = (
                    <AddCircleIcon
                        className="qa-NotificationIcon"
                        style={{
                            ...styles.icon,
                            fill: colors.success,
                        }}
                    />
                );
                break;
            case verbs.runDeleted:
            case verbs.runExpiring:
            case verbs.removedFromGroup:
            case verbs.removedAsGroupAdmin:
                icon = (
                    <RemoveCircleIcon
                        className="qa-NotificationIcon"
                        style={{
                            ...styles.icon,
                            fill: colors.warning,
                        }}
                    />
                );
                break;
            case verbs.runCanceled:
                icon = (
                    <WarningIcon
                        className="qa-NotificationIcon"
                        style={{
                            ...styles.icon,
                            fill: colors.running,
                        }}
                    />
                );
                break;
            case verbs.runFailed:
                icon = (
                    <ErrorIcon
                        className="qa-NotificationIcon"
                        style={{
                            ...styles.icon,
                            fill: colors.warning,
                        }}
                    />
                );
                break;
            default:
                icon = null;
        }

        return icon;
    }
}

NotificationIcon.propTypes = {
    notification: PropTypes.shape({
        id: PropTypes.number,
        verb: PropTypes.string,
        actor: PropTypes.shape({
            details: PropTypes.object,
        }),
        action_object: PropTypes.shape({
            details: PropTypes.object,
        }),
    }).isRequired,
    iconStyle: PropTypes.object,
    theme: PropTypes.object.isRequired,
};

NotificationIcon.defaultProps = {
    iconStyle: {},
};

export default
@withTheme()
class Default extends NotificationIcon {}
