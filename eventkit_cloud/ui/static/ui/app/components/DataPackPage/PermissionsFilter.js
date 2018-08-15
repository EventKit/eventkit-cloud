import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import Lock from '@material-ui/icons/LockOutlined';
import SocialGroup from '@material-ui/icons/Group';
import CheckCircle from '@material-ui/icons/CheckCircle';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class PermissionsFilter extends Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
        this.state = {
            open: false,
        };
    }

    handleOpen(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ open: true });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleSave(permissions) {
        this.props.onChange({ ...permissions });
        this.handleClose();
    }

    handleSelection(e, v) {
        // Dont do anything if the value is already selected
        if (v === this.props.permissions.value) {
            return;
        }
        // If this is a new selection we need to handle it
        // if the selection is not PRIVATE, we make it PUBLIC by default
        if (v !== 'PRIVATE') {
            const permissions = {
                value: 'PUBLIC',
                groups: {},
                members: {},
            };
            this.props.groups.forEach((group) => {
                permissions.groups[group.name] = 'READ';
            });
            this.props.members.forEach((member) => {
                permissions.members[member.user.username] = 'READ';
            });
            this.props.onChange({ ...permissions });
        } else {
            // If the selection IS PRIVATE we can just make the update
            this.props.onChange({ value: v });
        }
    }

    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
                marginBottom: '10px',
            },
            radioIcon: {
                fill: 'grey',
                marginRight: '5px',
            },
            radioLabel: {
                color: 'grey',
                width: '100%',
                marginBottom: '0px',
            },
            icon: {
                fill: 'grey',
                height: '26px',
                flex: '0 0 auto',
            },
            groups: {
                borderBottom: '1px solid #B4B7B8',
                display: 'flex',
                cursor: 'pointer',
                outline: 'none',
            },
            sharedButton: {
                color: '#4598bf',
                textDecoration: 'underline',
                padding: '0px 5px',
                width: '100%',
            },
        };

        const checkIcon = (<CheckCircle style={{ fill: '#4598bf' }} />);

        let sharedButton = null;
        // SHARED and PUBLIC are internal, to the user they are both 'SHARED'
        if (this.props.permissions.value === 'SHARED' || this.props.permissions.value === 'PUBLIC') {
            const groupCount = Object.keys(this.props.permissions.groups).length;
            const memberCount = Object.keys(this.props.permissions.members).length;

            let groupText = '';
            if (groupCount === 0) {
                groupText = 'No Groups';
            } else if (groupCount === this.props.groups.length) {
                groupText = 'All Groups';
            } else if (groupCount === 1) {
                groupText = '1 Group';
            } else {
                groupText = `${groupCount} Groups`;
            }

            let memberText = '';
            if (memberCount === 0) {
                memberText = 'No Members';
            } else if (memberCount === this.props.members.length) {
                memberText = 'All Members';
            } else if (memberCount === 1) {
                memberText = '1 Member';
            } else {
                memberText = `${memberCount} Members`;
            }

            sharedButton = (
                <EnhancedButton
                    className="qa-PermissionsFilter-MembersAndGroups-button"
                    onClick={this.handleOpen}
                    style={styles.sharedButton}
                >
                    {memberText} / {groupText}
                </EnhancedButton>
            );
        }

        return (
            <div style={styles.drawerSection}>
                <p
                    className="qa-PermissionsFilter-p"
                    style={{ width: '100%', margin: '0px', lineHeight: '36px' }}
                >
                    <strong>Permissions</strong>
                </p>
                <RadioButtonGroup
                    className="qa-PermissionsFilter-RadioButtonGroup"
                    name="permissions"
                    onChange={this.handleSelection}
                    valueSelected={this.props.permissions.value}
                    style={{ width: '100%' }}
                >
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-private"
                        style={{ width: '100%', marginBottom: '10px' }}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="PRIVATE"
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Private (only me)
                                </div>
                                <Lock style={styles.icon} />
                            </div>
                        }
                    />
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-group"
                        style={{ width: '100%' }}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        // The value can be either since they are show to the user in the same way
                        // PUBLIC and SHARED are distinct only for interal use
                        value={this.props.permissions.value === 'SHARED' ? 'SHARED' : 'PUBLIC'}
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Shared
                                </div>
                                <SocialGroup style={styles.icon} />
                            </div>
                        }
                    />
                </RadioButtonGroup>
                {sharedButton}
                <DataPackShareDialog
                    show={this.state.open}
                    onClose={this.handleClose}
                    onSave={this.handleSave}
                    groups={this.props.groups}
                    members={this.props.members}
                    permissions={this.props.permissions}
                    groupsText="You may filter DataPacks by shared groups exclusively.
                     Group filtering is managed seperately from member filtering."
                    membersText="You may filter DataPacks by shared members exclusively.
                     Member filtering is managed seperately from group filtering."
                    title="FILTER SHARED DATAPACKS"
                    submitButtonLabel="SET DATAPACK FILTER"
                />
            </div>
        );
    }
}

PermissionsFilter.propTypes = {
    permissions: PropTypes.shape({
        value: PropTypes.oneOf(['PRIVATE', 'PUBLIC', 'SHARED', '']),
        groups: PropTypes.objectOf(PropTypes.string),
        members: PropTypes.objectOf(PropTypes.string),
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    members: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            date_joined: PropTypes.string,
            last_login: PropTypes.string,
        }),
        accepted_licenses: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
};

export default PermissionsFilter;
