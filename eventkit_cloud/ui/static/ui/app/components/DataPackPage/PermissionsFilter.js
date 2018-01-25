import React, { PropTypes, Component } from 'react';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import Lock from 'material-ui/svg-icons/action/lock';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPublic from 'material-ui/svg-icons/social/public';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import GroupsDropDownMenu from '../../components/UserGroupsPage/GroupsDropDownMenu';
import GroupsDropDownMenuItem from '../../components/UserGroupsPage/GroupsDropDownMenuItem';

export class PermissionsFilter extends Component {
    constructor(props) {
        super(props);
        this.handleGroupsOpen = this.handleGroupsOpen.bind(this);
        this.handleGroupsClose = this.handleGroupsClose.bind(this);
        this.state = {
            open: false,
            popoverAnchor: null,
        };
    }

    handleGroupsOpen(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ open: true, popoverAnchor: e.currentTarget });
    }

    handleGroupsClose() {
        this.setState({ open: false });
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

        const selectedCount = this.props.selectedGroups.length ?
            this.props.selectedGroups.length === this.props.groups.length ?
                'All'
                :
                this.props.selectedGroups.length
            :
            'No';
        let selectionText = `${selectedCount} Groups`;
        if (selectedCount === 1) {
            selectionText = selectionText.slice(0, -1);
        }

        const checkIcon = (<CheckCircle style={{ fill: '#4598bf' }} />);

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
                    onChange={this.props.onChange}
                    valueSelected={this.props.valueSelected}
                    style={{ width: '100%' }}
                >
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-private"
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="private"
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
                        className="qa-PermissionsFilter-RadioButton-public"
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="public"
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Public (everyone)
                                </div>
                                <SocialPublic style={styles.icon} />
                            </div>
                        }
                    />
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-group"
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="group"
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Group Shared (only)
                                </div>
                                <SocialGroup style={styles.icon} />
                            </div>
                        }
                    />
                </RadioButtonGroup>
                {this.props.valueSelected === 'group' ?
                    
                    <div style={{ position: 'relative', margin: '0px 5px' }}>
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
                                {selectionText}
                            </div>
                            <ArrowDown
                                style={{ fill: '#4598bf', flex: '0 0 auto', height: '36px' }}
                                className="qa-PermissionsFilter-groups-ArrowDown"
                            />
                        </div>
                    </div>
                    :
                    null
                }
                <GroupsDropDownMenu
                    open={this.state.open}
                    anchorEl={this.state.popoverAnchor}
                    onClose={this.handleGroupsClose}
                    width={220}
                    className="qa-UserTableRowColumn-GroupsDropDownMenu"
                >
                    {this.props.groups.map(group => (
                        <GroupsDropDownMenuItem
                            key={group.id}
                            group={group}
                            onClick={this.props.onGroupSelect}
                            selected={this.props.selectedGroups.includes(group.id)}
                        />
                    ))}
                </GroupsDropDownMenu>
            </div>
        );
    }
}

PermissionsFilter.propTypes = {
    valueSelected: PropTypes.oneOf(['public', 'private', 'group']).isRequired,
    selectedGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
    onGroupSelect: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
};

export default PermissionsFilter;
