import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import {
    verbs, getNotificationViewPath, requiresActionObjDetails, requiresActorDetails,
} from '../../utils/notificationUtils';

export class NotificationMessage extends Component {
    constructor(props) {
        super(props);
        this.handleLinkClick = this.handleLinkClick.bind(this);
    }

    handleLinkClick(e) {
        if (!this.props.onLinkClick()) {
            e.preventDefault();
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const { notification } = this.props;
        const verb = notification.verb.toLowerCase();

        const styles = {
            link: {
                ...this.props.textStyle,
                ...this.props.linkStyle,
                color: colors.primary,
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            text: {
                ...this.props.textStyle,
                fontSize: '14px',
                whiteSpace: 'nowrap',
            },
        };

        styles.name = {
            ...styles.text,
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        };

        if (
            (requiresActorDetails.includes(verb) && (!notification.actor || !notification.actor.details))
            || (requiresActionObjDetails.includes(verb) && (!notification.action_object || !notification.action_object.details))
        ) {
            return (
                <React.Fragment>
                    <span
                        key={`${notification.id}-error`}
                        style={{ ...styles.text, color: colors.warning, whiteSpace: 'normal' }}
                        className="qa-NotificationMessage-error"
                    >
                        Uh oh! Sorry, this notification&apos;s details are no longer available.
                    </span>
                </React.Fragment>
            );
        }

        const viewPath = getNotificationViewPath(notification);
        let data = '';
        let text = '';
        let order = 1;

        switch (verb) {
            case verbs.runStarted: {
                data = notification.actor.details.job.name;
                text = '\xa0has started processing.';
                break;
            }
            case verbs.runCanceled: {
                data = notification.actor.details.job.name;
                text = '\xa0has been canceled.';
                break;
            }
            case verbs.runCompleted: {
                data = notification.actor.details.job.name;
                text = '\xa0is complete.';
                break;
            }
            case verbs.runFailed: {
                data = notification.actor.details.job.name;
                text = '\xa0failed to complete.';
                break;
            }
            case verbs.runDeleted: {
                data = notification.actor.details.job.name;
                text = '\xa0has been deleted.';
                break;
            }
            case verbs.addedToGroup: {
                data = notification.action_object.details.name;
                text = "You've been added to\xa0";
                order = -1;
                break;
            }
            case verbs.removedFromGroup: {
                data = notification.action_object.details.name;
                text = "You've been removed from\xa0";
                order = -1;
                break;
            }
            case verbs.setAsGroupAdmin: {
                data = notification.action_object.details.name;
                text = "You've been set as an admin of\xa0";
                order = -1;
                break;
            }
            case verbs.removedAsGroupAdmin: {
                data = notification.action_object.details.name;
                text = "You've been removed as an admin of\xa0";
                order = -1;
                break;
            }
            default: {
                console.warn(`Unsupported notification verb '${verb}'`, notification);
                return null;
            }
        }

        const linkEl = (
            <Link
                className="qa-NotificationMessage-Link"
                href={viewPath}
                key={`${notification.id}-Link`}
                onClick={this.handleLinkClick}
                style={styles.link}
                title={data}
                to={viewPath}
            >
                {data}
            </Link>
        );

        const spanEl = (
            <span
                key={`${notification.id}-span`}
                className="qa-NotificationMessage-Text"
                style={styles.text}
            >
                {text}
            </span>
        );

        return (
            <React.Fragment>
                {order === 1 ? linkEl : null }
                {spanEl}
                {order === -1 ? linkEl : null }
            </React.Fragment>
        );
    }
}

NotificationMessage.propTypes = {
    linkStyle: PropTypes.object,
    notification: PropTypes.shape({
        action_object: PropTypes.shape({
            details: PropTypes.object,
        }),
        actor: PropTypes.shape({
            details: PropTypes.object,
        }),
        id: PropTypes.number,
        verb: PropTypes.string,
    }).isRequired,
    onLinkClick: PropTypes.func,
    textStyle: PropTypes.object,
    theme: PropTypes.object.isRequired,
};

NotificationMessage.defaultProps = {
    linkStyle: {},
    onLinkClick: () => (true),
    textStyle: {},
};

export default
@withTheme()
class Default extends NotificationMessage {}
