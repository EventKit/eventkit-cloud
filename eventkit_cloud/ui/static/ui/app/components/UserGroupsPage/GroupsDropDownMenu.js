import React, { Component, PropTypes } from 'react';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import CircularProgress from 'material-ui/CircularProgress';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import CustomScrollbar from '../CustomScrollbar';

export class GroupsDropDownMenu extends Component {
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
            },
            menuItemText: {
                maxWidth: '236px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'inline-block',
            },
            loadingBackground: {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.05)',
                zIndex: 1001,
            },
            loading: {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            },
        };

        const { groups } = this.props;

        return (
            <Popover
                style={{ overflowY: 'hidden', margin: '0px 10px' }}
                open={this.props.open}
                anchorEl={this.props.anchorEl}
                anchorOrigin={this.props.anchorOrigin}
                targetOrigin={this.props.targetOrigin}
                onRequestClose={this.props.onClose}
                className="qa-GroupsDropDownMenu-Popover"
            >
                {this.props.groupsLoading ?
                    <div style={styles.loadingBackground}>
                        <CircularProgress color="#4598bf" style={styles.loading} className="qa-GroupsDropDownMenu-loading" />
                    </div>
                    :
                    null
                }
                <Menu
                    autoWidth={false}
                    style={{ width: '320px' }}
                    listStyle={{ paddingTop: '0px', paddingBottom: '0px', width: '320px' }}
                    className="qa-GroupsDropDownMenu-Menu"
                >
                    <CustomScrollbar
                        autoHeight
                        autoHeightMax={300}
                        style={{ maxWidth: '320px' }}
                        className="qa-GroupsDropDownMenu-CustomScrollbar"
                    >
                        <div>
                            {groups.map(group => (
                                <MenuItem
                                    key={`${group.id}`}
                                    style={styles.menuItem}
                                    innerDivStyle={styles.menuItemInner}
                                    onTouchTap={() => { this.props.onMenuItemClick(group); }}
                                    className="qa-GroupsDropDownMenu-MenuItem-group"
                                >
                                    <div
                                        style={{ ...styles.menuItemText, maxWidth: this.props.selectedGroups.includes(group.id) ? '236px' : '284px' }}
                                        className="qa-GroupsDropDownMenu-groupName"
                                    >
                                        {group.name}
                                    </div>
                                    { this.props.selectedGroups.includes(group.id) ?
                                        <CheckIcon style={{ margin: 12, fill: '#707274' }} className="qa-GroupsDropDownMenu-CheckIcon" />
                                        :
                                        null
                                    }
                                </MenuItem>
                            ))}
                            <Divider className="qa-GroupsDropDownMenu-Divider" />
                            <MenuItem
                                style={styles.menuItem}
                                innerDivStyle={styles.menuItemInner}
                                onTouchTap={this.props.onNewGroupClick}
                                className="qa-GroupsDropDownMenu-MenuItem-newGroup"
                            >
                                <span>Share with New Group</span>
                            </MenuItem>
                        </div>
                    </CustomScrollbar>
                </Menu>
            </Popover>
        );
    }
}

GroupsDropDownMenu.defaultProps = {
    anchorEl: null,
    anchorOrigin: { horizontal: 'right', vertical: 'top' },
    targetOrigin: { horizontal: 'right', vertical: 'top' },
};

GroupsDropDownMenu.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onMenuItemClick: PropTypes.func.isRequired,
    onNewGroupClick: PropTypes.func.isRequired,
    selectedGroups: PropTypes.arrayOf(PropTypes.number).isRequired,
    groupsLoading: PropTypes.bool.isRequired,
    anchorEl: PropTypes.object,
    anchorOrigin: PropTypes.shape({
        horizontal: PropTypes.string,
        vertical: PropTypes.string,
    }),
    targetOrigin: PropTypes.shape({
        horizontal: PropTypes.string,
        vertical: PropTypes.string,
    }),
};

export default GroupsDropDownMenu;
