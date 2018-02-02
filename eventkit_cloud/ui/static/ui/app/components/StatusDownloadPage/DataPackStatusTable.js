import React, { PropTypes, Component } from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import DatePicker from 'material-ui/DatePicker';
import SocialGroup from 'material-ui/svg-icons/social/group';
import Check from 'material-ui/svg-icons/navigation/check';
import Edit from 'material-ui/svg-icons/image/edit';
import Lock from 'material-ui/svg-icons/action/lock-outline';
import Public from 'material-ui/svg-icons/social/public';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import moment from 'moment';
import DataPackTableRow from './DataPackTableRow';
import GroupsDropDownMenu from '../UserGroupsPage/GroupsDropDownMenu';
import GroupsDropDownMenuItem from '../UserGroupsPage/GroupsDropDownMenuItem';

export class DataPackStatusTable extends Component {
    constructor(props) {
        super(props);
        this.handleGroupsOpen = this.handleGroupsOpen.bind(this);
        this.handleGroupsClose = this.handleGroupsClose.bind(this);
        this.state = {
            groupsOpen: false,
            anchor: null,
        };
    }

    handleGroupsOpen(e) {
        this.setState({ groupsOpen: true, anchor: e.currentTarget });
    }

    handleGroupsClose() {
        this.setState({ groupsOpen: false });
    }

    render() {
        const styles = {
            textField: {
                fontSize: '14px',
                height: '36px',
                width: '0px',
                display: 'inlineBlock',
            },
            dropDown: {
                height: '24px',
                marginLeft: '5px',
                lineHeight: '24px',
                flex: '0 0 auto',
            },
            icon: {
                height: '24px',
                width: '24px',
                padding: '0px',
                fill: '#4498c0',
                position: 'relative',
                top: '0px',
                right: '0px',
                verticalAlign: 'top',
            },
            label: {
                lineHeight: '24px',
                height: '24px',
                color: '#8b9396',
                paddingLeft: '0px',
                fontSize: '14px',
                fontWeight: 'normal',
                paddingRight: '0px',
                display: 'inline-block',
            },
            list: {
                paddingTop: '10px',
                paddingBottom: '10px',
                display: 'inlineBlock',
            },
            underline: {
                display: 'none',
                marginLeft: '0px',
            },
            tableRowInfoIcon: {
                marginLeft: '10px',
                height: '18px',
                width: '18px',
                cursor: 'pointer',
                display: 'inlineBlock',
                fill: '#4598bf',
                verticalAlign: 'middle',
            },
            permissionsIcon: {
                fill: '#8b9396',
                height: '24px',
                verticalAlign: 'middle',
            },
            groups: {
                borderBottom: '1px solid #B4B7B8',
                display: 'flex',
                cursor: 'pointer',
                outline: 'none',
            },
        };

        const checkIcon = <Check style={styles.permissionsIcon} />;
        const permissionsIcons = {
            private: <Lock style={styles.permissionsIcon} />,
            public: <Public style={styles.permissionsIcon} />,
            group: <SocialGroup style={styles.permissionsIcon} />,
            privateCheck: this.props.permission === 'private' ? checkIcon : null,
            publicCheck: this.props.permission === 'public' ? checkIcon : null,
            groupCheck: this.props.permission === 'group' ? checkIcon : null,
        };

        let groupsDropdown = null;
        let groupsDropdownButton = null;
        if (this.props.permission === 'group') {
            console.log('groups time');
            groupsDropdown = (
                <GroupsDropDownMenu
                    key="groupsMenu"
                    open={this.state.groupsOpen}
                    anchorEl={this.state.anchor}
                    onClose={this.handleGroupsClose}
                    width={200}
                >
                    <GroupsDropDownMenuItem
                        group={{ id: '1', name: 'janedoe' }}
                        onClick={() => { console.log('click'); }}
                        selected
                    />
                </GroupsDropDownMenu>
            );
            groupsDropdownButton = (
                <div style={{ position: 'relative', margin: '0px 5px' }} key="groupsButton">
                    <div
                        tabIndex={0}
                        role="button"
                        onKeyPress={this.handleGroupsOpen}
                        style={styles.groups}
                        onClick={this.handleGroupsOpen}
                        className="qa-PermissionsFilter-groups-button"
                    >
                        <div
                            style={{ flex: '1 1 auto', fontWeight: 700, color: 'grey' }}
                            className="qa-PermissionsFilter-groups-selection"
                        >
                            text
                        </div>
                        <ArrowDown
                            style={{ fill: '#4598bf', flex: '0 0 auto', height: '24px' }}
                            className="qa-PermissionsFilter-groups-ArrowDown"
                        />
                    </div>
                </div>
            );
        }

        return (
            <div style={{ marginLeft: '-5px', marginTop: '-5px' }}>
                <DataPackTableRow
                    title="Export"
                    data={this.props.status}
                    titleStyle={{ backgroundColor: this.props.statusColor }}
                    dataStyle={{
                        backgroundColor: this.props.statusColor,
                        color: this.props.statusFontColor,
                    }}
                />
                <DataPackTableRow
                    title="Expiration"
                    data={
                        <div>
                            {moment(this.props.expiration).format('YYYY-MM-DD')}
                            <DatePicker
                                ref={(instance) => { this.dp = instance; }}
                                style={{ height: '0px', display: '-webkit-inline-box', width: '0px' }}
                                autoOk
                                minDate={this.props.minDate}
                                maxDate={this.props.maxDate}
                                id="datePicker"
                                onChange={this.props.handleExpirationChange}
                                textFieldStyle={styles.textField}
                                underlineStyle={{ display: 'none' }}
                            />
                            <Edit
                                onClick={() => { this.dp.focus(); }}
                                style={styles.tableRowInfoIcon}
                            />
                        </div>
                    }
                />
                <DataPackTableRow
                    title="Permissions"
                    data={[
                        <DropDownMenu
                            key="permissionsMenu"
                            className="qa-DataPackStatusTable-DropDownMenu-published"
                            value={this.props.permission}
                            onChange={this.props.handlePermissionsChange}
                            style={styles.dropDown}
                            labelStyle={styles.label}
                            iconStyle={styles.icon}
                            listStyle={styles.list}
                            selectedMenuItemStyle={{ color: '#8b9396' }}
                            underlineStyle={styles.underline}
                        >
                            <MenuItem
                                value="private"
                                className="qa-DataPackStatusTable-MenuItem-permissionPrivate"
                                rightIcon={permissionsIcons.privateCheck}
                                primaryText={
                                    <div>
                                        {permissionsIcons.private}
                                        &nbsp;&nbsp;
                                        Private
                                    </div>
                                }
                                style={{ color: '#8b9396' }}
                            />
                            <MenuItem
                                value="public"
                                className="qa-DataPackStatusTable-MenuItem-permissionPublic"
                                rightIcon={permissionsIcons.publicCheck}
                                primaryText={
                                    <div>
                                        {permissionsIcons.public}
                                        &nbsp;&nbsp;
                                        Public
                                    </div>
                                }
                                style={{ color: '#8b9396' }}
                            />
                            <MenuItem
                                value="group"
                                className="qa-DataPackStatusTable-MenuItem-permissionGroup"
                                rightIcon={permissionsIcons.groupCheck}
                                primaryText={
                                    <div>
                                        {permissionsIcons.group}
                                        &nbsp;&nbsp;
                                        Group Share
                                    </div>
                                }
                                style={{ color: '#8b9396' }}
                            />
                        </DropDownMenu>,
                        groupsDropdownButton,
                        groupsDropdown,
                    ]}
                />
            </div>
        );
    }
}

DataPackStatusTable.defaultProps = {
    permission: '',
    minDate: null,
    maxDate: null,
    statusColor: null,
    statusFontColor: null,
};

DataPackStatusTable.propTypes = {
    status: PropTypes.string.isRequired,
    expiration: PropTypes.string.isRequired,
    permission: PropTypes.string,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    handleExpirationChange: PropTypes.func.isRequired,
    handlePermissionsChange: PropTypes.func.isRequired,
    statusColor: PropTypes.string,
    statusFontColor: PropTypes.string,
};

export default DataPackStatusTable;
