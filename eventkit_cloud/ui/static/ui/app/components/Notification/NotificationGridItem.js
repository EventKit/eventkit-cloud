import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import withTheme from '@mui/styles/withTheme';
import moment from 'moment';
import Paper from '@mui/material/Paper';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import NotificationMessage from './NotificationMessage';
import NotificationIcon from './NotificationIcon';
import NotificationMenu from './NotificationMenu';
import useMediaQuery from '@mui/material/useMediaQuery';

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

export class NotificationGridItem extends Component {
    constructor(props) {
        super(props);
        this.handleView = this.handleView.bind(this);
    }

    handleView() {
        // Allow the parent component the opportunity to stop or handle navigation.
        const path = getNotificationViewPath(this.props.notification);
        if (this.props.onView(this.props.notification, path)) {
            this.props.history.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;

        const styles = {
            root: {
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                fontSize: useMediaQuery(this.props.theme.breakpoints.up('sm')) ? '18px' : '14px',
                color: colors.text_primary,
                transition: 'background-color 0.25s',
                backgroundColor: (this.props.notification.unread) ? colors.selected_primary : colors.white,
                ...this.props.paperStyle,
            },
            content: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            icon: {
                flex: '0 0 auto',
                marginRight: '10px',
            },
            date: {
                margin: '0 10px',
                fontSize: useMediaQuery(this.props.theme.breakpoints.up('sm')) ? '12px' : '10px',
                display: 'flex',
                alignItems: 'center',
                flex: '0 0 auto',
            },
            iconMenu: {
                padding: '0',
                width: '24px',
                height: '24px',
                verticalAlign: 'middle',
            },
            menuItem: {
                fontSize: !useMediaQuery(this.props.theme.breakpoints.up('md')) ? 10 : 12,
            },
        };

        return (
            <div className="qa-NotificationGridItem" style={this.props.style}>
                <Paper style={styles.root}>
                    <NotificationIcon notification={this.props.notification} />
                    <NotificationMessage
                        notification={this.props.notification}
                        onLinkClick={this.handleView}
                    />
                    <div style={{ flex: '1' }} />
                    <div
                        className="qa-NotificationGridItem-Date"
                        style={styles.date}
                    >
                        {moment(this.props.notification.timestamp).fromNow()}
                    </div>
                    <NotificationMenu
                        notification={this.props.notification}
                        history={this.props.history}
                        onMarkAsRead={this.props.onMarkAsRead}
                        onMarkAsUnread={this.props.onMarkAsUnread}
                        onRemove={this.props.onRemove}
                        onView={this.handleView}
                    />
                </Paper>
            </div>
        );
    }
}

NotificationGridItem.propTypes = {
    style: PropTypes.object,
    paperStyle: PropTypes.object,
    notification: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    markNotificationsAsRead: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationGridItem.defaultProps = {
    style: {},
    paperStyle: {},
    onMarkAsRead: () => true,
    onMarkAsUnread: () => true,
    onRemove: () => true,
    onView: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: (notification) => dispatch(markNotificationsAsRead(notification)),
        markNotificationsAsUnread: (notification) => dispatch(markNotificationsAsUnread(notification)),
        removeNotifications: (notification) => dispatch(removeNotifications(notification)),
    };
}

export default withWidth()(withTheme(connect(null, mapDispatchToProps)(NotificationGridItem)));
