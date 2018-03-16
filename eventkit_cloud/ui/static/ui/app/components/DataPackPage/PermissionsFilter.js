import React, { PropTypes, Component } from 'react';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import Lock from 'material-ui/svg-icons/action/lock';
import SocialGroup from 'material-ui/svg-icons/social/group';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';
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
        // if filtering by shared, add all members and groups by default
        if (v === 'SHARED') {
            const permissions = {
                value: v,
                groups: {},
                members: {},
            };
            this.props.groups.forEach((group) => {
                permissions.groups[group.id] = 'READ';
            });
            this.props.members.forEach((member) => {
                permissions.members[member.user.username] = 'READ';
            });
            this.props.onChange({ ...permissions });
        } else {
            this.props.onChange({ value: v });
        }
    }

    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
                lineHeight: '36px',
            },
            radioButton: {
                width: '100%',
                marginBottom: '5px',
            },
            radioIcon: {
                fill: 'grey',
                marginRight: '5px',
            },
            radioLabel: {
                color: 'grey',
                width: '100%',
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
        };

        const checkIcon = (<CheckCircle style={{ fill: '#4598bf' }} />);

        let dialog = null;
        let sharedButton = null;
        if (this.props.permissions.value === 'SHARED') {
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
                memberText = '1 Members';
            } else {
                memberText = `${memberCount} Members`;
            }

            sharedButton = (
                <EnhancedButton
                    onClick={this.handleOpen}
                    style={{ color: '#4598bf', textDecoration: 'underline', padding: '0px 5px' }}
                >
                    {memberText} / {groupText}
                </EnhancedButton>
            );

            if (this.state.open) {
                dialog = (
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
                );
            }
        }

        return (
            <div style={styles.drawerSection}>
                <p
                    className="qa-PermissionsFilter-p"
                    style={{ width: '100%', margin: '0px' }}
                >
                    <strong >Permissions</strong>
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
                        style={styles.radioButton}
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
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="SHARED"
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
                {dialog}
            </div>
        );
    }
}

PermissionsFilter.propTypes = {
    permissions: PropTypes.shape({
        value: PropTypes.oneOf(['PRIVATE', 'PUBLIC', 'SHARED']),
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
