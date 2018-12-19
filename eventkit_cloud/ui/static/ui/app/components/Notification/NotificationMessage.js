import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import { Link } from 'react-router';
import { verbs, getNotificationViewPath, requiresActionObjDetails, requiresActorDetails } from '../../utils/notificationUtils';

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
            text: {
                ...this.props.textStyle,
                whiteSpace: 'nowrap',
                fontSize: '14px',
            },
            link: {
                ...this.props.textStyle,
                ...this.props.linkStyle,
                color: colors.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
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
            ||
            (requiresActionObjDetails.includes(verb) && (!notification.action_object || !notification.action_object.details))
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
                key={`${notification.id}-Link`}
                className="qa-NotificationMessage-Link"
                to={viewPath}
                href={viewPath}
                style={styles.link}
                onClick={this.handleLinkClick}
                title={data}
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
    textStyle: PropTypes.object,
    linkStyle: PropTypes.object,
    onLinkClick: PropTypes.func,
    theme: PropTypes.object.isRequired,
};

NotificationMessage.defaultProps = {
    textStyle: {},
    linkStyle: {},
    onLinkClick: () => (true),
};

export default
@withTheme()
class Default extends NotificationMessage {}
