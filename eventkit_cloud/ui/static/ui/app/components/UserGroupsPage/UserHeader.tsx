import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Person from '@material-ui/icons/Person';
import Sort from '@material-ui/icons/Sort';
import DropDown from '@material-ui/icons/ArrowDropDown';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import IconMenu from '../common/IconMenu';
import ConfirmDialog from '../Dialog/ConfirmDialog';

export interface Props {
    className?: string;
    selected: boolean;
    onSelect: (selected: boolean) => void;
    orderingValue: string;
    handleOrderingChange: (order: string) => void;
    handleAddUsers: (users: Eventkit.User[]) => void;
    handleRemoveUsers: (users: Eventkit.User[]) => void;
    handleAdminRights: (users: Eventkit.User[]) => void;
    selectedUsers: Eventkit.User[];
    selectedGroup: Eventkit.Group;
    handleNewGroup: (users: Eventkit.User[]) => void;
    showRemoveButton: boolean;
    showAdminButton: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    showAdminConfirm: boolean;
}

export class UserHeader extends React.Component<Props, State> {
    static defaultProps = {
        handleRemoveUsers: () => { console.warn('No remove users handler supplied'); },
        handleAdminRights: () => { console.warn('No admin rights handler supplied'); },
        selectedGroup: null,
        showRemoveButton: false,
        showAdminButton: false,
    };

    private select: () => void;
    private deselect: () => void;
    constructor(props: Props) {
        super(props);
        this.handleAddUsersClick = this.handleAddUsersClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleRemoveUsersClick = this.handleRemoveUsersClick.bind(this);
        this.handleOpenAdminConfirm = this.handleOpenAdminConfirm.bind(this);
        this.handleCloseAdminConfirm = this.handleCloseAdminConfirm.bind(this);
        this.handleConfirmAdminAction = this.handleConfirmAdminAction.bind(this);
        this.select = this.props.onSelect.bind(this, true);
        this.deselect = this.props.onSelect.bind(this, false);
        this.state = {
            showAdminConfirm: false,
        };
    }

    private handleAddUsersClick() {
        this.props.handleAddUsers(this.props.selectedUsers);
    }

    private handleNewGroupClick() {
        this.props.handleNewGroup(this.props.selectedUsers);
    }

    private handleRemoveUsersClick() {
        this.props.handleRemoveUsers(this.props.selectedUsers);
    }

    private handleOpenAdminConfirm() {
        this.setState({ showAdminConfirm: true });
    }

    private handleCloseAdminConfirm() {
        this.setState({ showAdminConfirm: false });
    }

    private handleConfirmAdminAction() {
        this.handleCloseAdminConfirm();
        this.props.handleAdminRights(this.props.selectedUsers);
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            header: {
                color: colors.text_primary,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                height: '56px',
            },
            item: {
                fontSize: '14px',
            },
        };

        const checkbox = this.props.selected ?
            <Checked onClick={this.deselect} className="qa-UserHeader-checkbox" color="primary" />
            :
            <Unchecked onClick={this.select} className="qa-UserHeader-checkbox" color="primary" />;

        let removeButton = null;
        if (this.props.showRemoveButton) {
            removeButton = (
                <MenuItem
                    key="remove"
                    style={{ ...styles.item, color: colors.warning }}
                    onClick={this.handleRemoveUsersClick}
                    className="qa-UserHeader-MenuItem-remove"
                >
                    Remove User(s)
                </MenuItem>
            );
        }

        let confirmationText = 'Are you sure you want to proceed with this action?';
        let adminButton = null;
        if (this.props.showAdminButton) {
            let adminLabel = '';
            if (this.props.selectedGroup) {
                const allAdmins = this.props.selectedUsers.every(user =>
                    this.props.selectedGroup.administrators.indexOf(user.user.username) > -1);
                if (allAdmins) {
                    adminLabel = 'Remove Admin Rights';
                } else {
                    adminLabel = 'Grant Admin Rights';
                }
                confirmationText = `Are you sure you want to ${
                    adminLabel.toLowerCase()
                } for the (${
                    this.props.selectedUsers.length
                }) selected members?`;
            }

            adminButton = (
                <MenuItem
                    key="makeAdminMenuItem"
                    style={styles.item}
                    onClick={this.handleOpenAdminConfirm}
                    className="qa-UserHeader-MenuItem-makeAdmin"
                >
                    {adminLabel}
                </MenuItem>
            );
        }

        return (
            <div
                style={styles.header}
                className="qa-UserHeader"
            >
                <div
                    style={{
                        display: 'flex',
                        flex: '0 0 auto',
                        paddingLeft: '24px',
                        alignItems: 'center',
                    }}
                >
                    {checkbox}
                </div>
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
                        <strong className="qa-UserHeader-selectedCount">
                            {this.props.selectedUsers.length} Selected
                        </strong>

                        { this.props.selectedUsers.length ?
                            <IconMenu
                                style={{ marginLeft: '10px', width: '48px', backgroundColor: 'transparent' }}
                                className="qa-UserHeader-options"
                                color="primary"
                                icon={
                                    <div style={{ display: 'flex' }}>
                                        <Person />
                                        <DropDown />
                                    </div>
                                }
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                            >
                                <MenuItem
                                    key="edit"
                                    style={styles.item}
                                    onClick={this.handleAddUsersClick}
                                    className="qa-UserHeader-MenuItem-editGroups"
                                >
                                    Add to Existing Group
                                </MenuItem>
                                <MenuItem
                                    key="new"
                                    style={styles.item}
                                    onClick={this.handleNewGroupClick}
                                    className="qa-UserHeader-MenuItem-newGroup"
                                >
                                    Add to New Group
                                </MenuItem>
                                {adminButton}
                                {removeButton}
                            </IconMenu>
                            :
                            null
                        }
                    </div>
                    <IconMenu
                        style={{ width: '48px', backgroundColor: 'transparent' }}
                        icon={
                            <div style={{ display: 'flex' }}>
                                <Sort /><DropDown />
                            </div>
                        }
                        color="primary"
                        className="qa-UserHeader-sort"
                    >
                        <MenuItem
                            key="username"
                            value="username"
                            style={styles.item}
                            onClick={() => this.props.handleOrderingChange('username')}
                            selected={this.props.orderingValue === 'username'}
                            className="qa-UserHeader-MenuItem-sortAZ"
                        >
                            Username A-Z
                        </MenuItem>
                        <MenuItem
                            key="-username"
                            value="-username"
                            style={styles.item}
                            onClick={() => this.props.handleOrderingChange('-username')}
                            selected={this.props.orderingValue === '-username'}
                            className="qa-UserHeader-MenuItem-sortZA"
                        >
                            Username Z-A
                        </MenuItem>
                        <MenuItem
                            key="-date_joined"
                            value="-date_joined"
                            style={styles.item}
                            onClick={() => this.props.handleOrderingChange('-date_joined')}
                            selected={this.props.orderingValue === '-date_joined'}
                            className="qa-UserHeader-MenuItem-sortNewest"
                        >
                            Newest
                        </MenuItem>
                        <MenuItem
                            key="date_joined"
                            value="date_joined"
                            style={styles.item}
                            onClick={() => this.props.handleOrderingChange('date_joined')}
                            selected={this.props.orderingValue === 'date_joined'}
                            className="qa-UserHeader-MenuItem-sortOldest"
                        >
                            Oldest
                        </MenuItem>
                        <MenuItem
                            key="admin"
                            value="admin"
                            style={styles.item}
                            onClick={() => this.props.handleOrderingChange('admin')}
                            selected={this.props.orderingValue === 'admin'}
                            className="qa-UserHeader-MenuItem-sortAdmin"
                        >
                            Administrator
                        </MenuItem>
                    </IconMenu>
                </div>
                <ConfirmDialog
                    show={this.state.showAdminConfirm}
                    title="Are you sure?"
                    onCancel={this.handleCloseAdminConfirm}
                    onConfirm={this.handleConfirmAdminAction}
                    isDestructive
                >
                    {confirmationText}
                </ConfirmDialog>
            </div>
        );
    }
}

export default withTheme()(UserHeader);
