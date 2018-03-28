import React, { PropTypes } from 'react';
import { IconButton, IconMenu, MenuItem } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

export class NotificationMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let styles = {
            menuButton: {
                padding: '0',
                width: '20px',
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
            >
                {!!this.props.onView ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="View"
                        onClick={() => this.props.onView(this.props.notification)}
                    />
                    :
                    null
                }
                {!!this.props.onMarkAsRead ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Read"
                        onClick={() => this.props.onMarkAsUnread(this.props.notification)}
                    />
                    :
                    null
                }
                {!!this.props.onMarkAsUnread ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Unread"
                        onClick={() => this.props.onMarkAsRead(this.props.notification)}
                    />
                    :
                    null
                }
                {!!this.props.onRemove ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Remove"
                        onClick={() => this.props.onRemove(this.props.notification)}
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
