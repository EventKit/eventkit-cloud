import React, { Component, PropTypes } from 'react';
import MenuItem from 'material-ui/MenuItem';
import CheckIcon from 'material-ui/svg-icons/navigation/check';

export class GroupsDropDownMenuItem extends Component {
    render() {
        const styles = {
            menuItem: {
                fontSize: '14px',
                overflow: 'hidden',
                color: '#707274',
            },
            menuItemInner: {
                padding: '0px',
                margin: '0px 22px 0px 16px',
                height: '48px',
                display: 'flex',
            },
            menuItemText: {
                flex: '1 1 auto',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'inline-block',
            },
            checkIcon: {
                margin: '12px 0px 12px 12px',
                fill: '#707274',
                flex: '0 0 auto',
            },
        };


        return (
            <MenuItem
                key={this.props.group.id}
                style={styles.menuItem}
                innerDivStyle={styles.menuItemInner}
                onTouchTap={() => { this.props.onClick(this.props.group); }}
                className="qa-GroupsDropDownMenuItem-MenuItem"
            >
                <div
                    style={styles.menuItemText}
                    className="qa-GroupsDropDownMenuItem-groupName"
                >
                    {this.props.group.name}
                </div>
                { this.props.selected ?
                    <CheckIcon
                        style={styles.checkIcon}
                        className="qa-GroupsDropDownMenuItem-CheckIcon"
                    />
                    :
                    null
                }
            </MenuItem>
        );
    }
}

GroupsDropDownMenuItem.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    onClick: PropTypes.func.isRequired,
    selected: PropTypes.bool.isRequired,
};

export default GroupsDropDownMenuItem;
