import React, { PropTypes } from 'react';
import { IconButton, IconMenu, MenuItem } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';

export class NotificationMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleViewClick = this.handleViewClick.bind(this);
        this.handleMarkAsReadClick = this.handleMarkAsReadClick.bind(this);
        this.handleMarkAsUnreadClick = this.handleMarkAsUnreadClick.bind(this);
        this.handleRemoveClick = this.handleRemoveClick.bind(this);
        this.state = {
            // This is a slight hack to prevent some glitchy behavior in the notifications dropdown. Without it, clicking
            // the "View" menu item will cause the dropdown to immediately close as the menu item stays for a moment to
            // show its ripple effect. This trick also just makes the menu feel a little more responsive.
            forceClose: false,
        };
    }

    componentDidUpdate() {
        if (this.state.forceClose) {
            this.setState({ forceClose: false });
        }
    }

    handleViewClick(e) {
        e.stopPropagation();
        this.props.onView(this.props.notification);
        this.setState({ forceClose: true });
    }

    handleMarkAsReadClick(e) {
        e.stopPropagation();
        this.props.onMarkAsRead(this.props.notification);
        this.setState({ forceClose: true });
    }

    handleMarkAsUnreadClick(e) {
        e.stopPropagation();
        this.props.onMarkAsUnread(this.props.notification);
        this.setState({ forceClose: true });
    }

    handleRemoveClick(e) {
        e.stopPropagation();
        this.props.onRemove(this.props.notification);
        this.setState({ forceClose: true });
    }

    render() {
        let styles = {
            menuButton: {
                padding: '0',
                width: '20px',
                height: 'auto',
                verticalAlign: 'middle',
            },
            menuButtonIcon: {
                color: '#4598bf',
            },
        };

        return (
            <IconMenu
                style={this.props.style}
                iconButtonElement={
                    <IconButton
                        style={styles.menuButton}
                        iconStyle={styles.menuButtonIcon}
                    >
                        {this.props.icon}
                    </IconButton>}
                anchorOrigin={this.props.anchorOrigin}
                targetOrigin={this.props.targetOrigin}
                open={this.state.forceClose ? false : undefined}
            >
                {this.props.onView ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="View"
                        leftIcon={<OpenInNewIcon />}
                        onClick={this.handleViewClick}
                    />
                    :
                    null
                }
                {this.props.onMarkAsRead ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Read"
                        leftIcon={<FlagIcon />}
                        onClick={this.handleMarkAsReadClick}
                    />
                    :
                    null
                }
                {this.props.onMarkAsUnread ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Unread"
                        leftIcon={<FlagIcon />}
                        onClick={this.handleMarkAsUnreadClick}
                    />
                    :
                    null
                }
                {this.props.onRemove ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Remove"
                        leftIcon={<CloseIcon />}
                        onClick={this.handleRemoveClick}
                    />
                    :
                    null
                }
            </IconMenu>
        );
    }
}

NotificationMenu.propTypes = {
    style: PropTypes.object,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    icon: PropTypes.element,
    anchorOrigin: PropTypes.object,
    targetOrigin: PropTypes.object,
};

NotificationMenu.defaultProps = {
    icon: <MoreVertIcon />,
    anchorOrigin: { horizontal: 'right', vertical: 'top' },
    targetOrigin: { horizontal: 'right', vertical: 'top' },
};
