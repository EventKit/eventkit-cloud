import { Component, Fragment } from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import ButtonBase from '@material-ui/core/ButtonBase';
import SocialGroup from '@material-ui/icons/Group';
import Check from '@material-ui/icons/Check';
import Lock from '@material-ui/icons/LockOutlined';
import 'react-day-picker/dist/style.css';
import DropDownMenu from '../common/DropDownMenu';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';
import {connect} from "react-redux";
import {Permissions} from "../../utils/permissions";
import {MatomoClickTracker} from "../MatomoHandler";

interface Props {
    permissions: Eventkit.Permissions;
    handlePermissionsChange: (permissions: Eventkit.Permissions) => void;
    adminPermissions: boolean;
    user: Eventkit.User;
    theme: Eventkit.Theme & Theme;
    job: Eventkit.Job;
    permissionState: Eventkit.Store.UpdatePermissions;
}

interface State {
    shareDialogOpen: boolean;
    dataPermissions: Eventkit.Permissions;
}

export class PermissionsData extends Component<Props, State> {
    private permissions: Permissions;

    constructor(props: Props) {
        super(props);
        this.handleShareDialogOpen = this.handleShareDialogOpen.bind(this);
        this.handleShareDialogClose = this.handleShareDialogClose.bind(this);
        this.handleShareDialogSave = this.handleShareDialogSave.bind(this);
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.permissions = new Permissions(this.props.permissions);
        this.state = {
            shareDialogOpen: false,
            dataPermissions: this.permissions.getPermissions(),
        };
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (!!this.state.shareDialogOpen) {
            if (prevProps.permissionState.updating && !this.props.permissionState.updating && !this.props.permissionState.error) {
                this.handleShareDialogClose();
            }
        }
    }

    private getGroupsText(count: number) {
        let groupText = '';
        if (count === 0) {
            groupText = 'No Groups';
        } else if (count === 1) {
            groupText = '1 Group';
        } else {
            groupText = `${count} Groups`;
        }
        return groupText;
    }

    private getMembersText(count: number) {
        let memberText = '';
        if (this.props.permissions.value === 'PUBLIC') {
            memberText = 'All Members';
        } else if (count === 0) {
            memberText = 'No Members';
        } else if (count === 1) {
            memberText = '1 Member';
        } else {
            memberText = `${count} Members`;
        }
        return memberText;
    }

    private handleShareDialogOpen() {
        this.setState({shareDialogOpen: true});
    }

    private handleShareDialogClose() {
        this.setState({shareDialogOpen: false});
    }

    private handleShareDialogSave(permissions: Eventkit.Permissions) {
        this.props.handlePermissionsChange({...permissions});
    }

    private handleDropDownChange(value: Eventkit.Permissions['value']) {
        // update the value in permissions
        // if new value is private, remove all but the logged in user
        const permissions = {...this.props.permissions, value};
        if (value === 'PRIVATE') {
            permissions.groups = {};
            if (permissions.members[this.props.user.user.username] === 'ADMIN') {
                permissions.members = {};
                permissions.members[this.props.user.user.username] = 'ADMIN';
            } else {
                permissions.members = {};
            }
        }
        this.props.handlePermissionsChange(permissions);
    }

    render() {
        const {colors} = this.props.theme.eventkit;

        const styles = {
            dropDown: {
                height: '24px',
                margin: '0px 5px 0px 0px',
                lineHeight: '24px',
                flex: '0 0 auto',
                color: colors.text_primary,
                backgroundColor: 'transparent',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
            },
            underline: {
                display: 'none',
                marginLeft: '0px',
            },
            checkIcon: {
                fill: colors.text_primary,
                height: '24px',
                verticalAlign: 'middle',
                marginLeft: '30px',
            },
            permissionsIcon: {
                fill: colors.text_primary,
                height: '24px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
            item: {
                color: colors.text_primary,
                fontSize: '14px',
                padding: '6px 16px',
            },
        };

        const checkIcon = <Check style={styles.checkIcon}/>;
        const privateIcon = <Lock style={styles.permissionsIcon}/>;
        const membersIcon = <SocialGroup style={styles.permissionsIcon}/>;
        const privateCheck = this.props.permissions.value === 'PRIVATE' ? checkIcon : null;
        const membersCheck = this.props.permissions.value !== 'PRIVATE' ? checkIcon : null;

        if (!this.props.adminPermissions) {
            if (this.props.permissions.value !== 'PRIVATE') {
                return <Fragment>{membersIcon} Shared</Fragment>;
            } else {
                return <Fragment>{privateIcon} Private</Fragment>;
            }
        } else {
            let membersAndGroups = null;
            if (this.props.permissions.value !== 'PRIVATE') {
                const groupCount = Object.keys(this.props.permissions.groups).length;
                const memberCount = Object.keys(this.props.permissions.members).length;

                const groupText = this.getGroupsText(groupCount);
                const memberText = this.getMembersText(memberCount);

                membersAndGroups = (
                    <MatomoClickTracker
                        eventAction="Open Dialog"
                        eventName={`Open Share Dialog ${this.props?.job?.name}`}
                        eventCategory="Status and Download"
                    >
                        <ButtonBase
                            className="qa-PermissionsData-MembersAndGroups-button"
                            key="membersAndGroupsButton"
                            onClick={this.handleShareDialogOpen}
                            style={{color: colors.primary, textDecoration: 'underline', padding: '0px 5px'}}
                            disabled={!this.props.adminPermissions}
                        >
                            {memberText} / {groupText}
                        </ButtonBase>
                    </MatomoClickTracker>
                );
            }

            return (
                <Fragment>
                    <DropDownMenu
                        key="permissionsMenu"
                        className="qa-PermissionsData-DropDownMenu-published"
                        value={this.props.permissions.value !== 'PRIVATE' ?
                            <span>{membersIcon} Shared</span>
                            :
                            <span>{privateIcon} Private</span>
                        }
                        style={styles.dropDown}
                        underlineStyle={styles.underline}
                    >
                        <MenuItem
                            key="private"
                            className="qa-PermissionsData-MenuItem-permissionPrivate"
                            style={styles.item}
                            onClick={() => this.handleDropDownChange('PRIVATE')}
                        >
                            <div>
                                {privateIcon}
                                Private
                                {privateCheck}
                            </div>
                        </MenuItem>
                        <MenuItem
                            key="members"
                            className="qa-PermissionsData-MenuItem-permissionMembers"
                            style={styles.item}
                            onClick={() => this.handleDropDownChange(this.props.permissions.value === 'PUBLIC' ? 'PUBLIC' : 'SHARED')}
                        >
                            <div>
                                {membersIcon}
                                Share
                                {membersCheck}
                            </div>
                        </MenuItem>
                    </DropDownMenu>
                    {membersAndGroups}
                    {this.state.shareDialogOpen &&
                    <DataPackShareDialog
                        show={this.state.shareDialogOpen}
                        user={this.props.user}
                        onClose={this.handleShareDialogClose}
                        onSave={this.handleShareDialogSave}
                        permissions={this.props.permissions}
                        groupsText="You may share view and edit rights with groups exclusively.
                            Group sharing is managed separately from member sharing"
                        membersText="You may share view and edit rights with members exclusively.
                            Member sharing is managed separately from group sharing"
                        canUpdateAdmin
                        warnPublic
                        job={this.props.job}
                    />
                    }
                </Fragment>
            );
        }
    }
}

const mapStateToProps = state => (
    {
        permissionState: state.updatePermission,
    }
);
export default withTheme(connect(mapStateToProps)(PermissionsData));
