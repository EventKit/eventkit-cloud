import React, { Component, PropTypes } from 'react';
import {Tabs, Tab} from 'material-ui/Tabs';
import Checked from 'material-ui/svg-icons/toggle/check-box';
import Unchecked from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import Indeterminate from '../../icons/IndeterminateIcon';
import CustomTextField from '../../CustomTextField';
import ShareBaseDialog from '../../Dialog/ShareBaseDialog';

export class AddMembersDialog extends Component {
    constructor(props) {
        super(props);
        this.getGroupIcon = this.getGroupIcon.bind(this);
        this.getDisabledGroups = this.getDisabledGroups.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleUncheck = this.handleUncheck.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleDeselectAll = this.handleDeselectAll.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.state = {
            search: '',
            selection: [],
        };
    }

    getGroupIcon(group, disabledGroups) {
        const interactive = { height: '28px', width: '28px', cursor: 'pointer' };
        const disabled = disabledGroups.indexOf(group) > -1;
        if (disabled) {
            return <Checked style={{ height: '28px', width: '28px', fill: '#707274' }} />;
        }
        if (this.state.selection.indexOf(group) > -1) {
            return <Checked style={interactive} onClick={() => { this.handleUncheck(group); }} />;
        }
        return <Unchecked style={interactive} onClick={() => { this.handleCheck(group); }} />;
    }

    getDisabledGroups() {
        return this.props.groups.filter(group =>
            this.props.selectedUsers.every(user =>
                group.members.indexOf(user.user.username) > -1));
    }

    handleSave() {
        this.props.onSave(this.state.selection, this.props.selectedUsers);
    }

    handleCheck(group) {
        const { selection } = this.state;
        selection.push(group);
        this.setState({ selection });
    }

    handleUncheck(group) {
        const { selection } = this.state;
        selection.splice(selection.indexOf(group), 1);
        this.setState({ selection });
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value });
    }

    handleSelectAll() {
        const disabled = this.getDisabledGroups();
        const selection = this.props.groups.filter(group => disabled.indexOf(group) < 0);
        this.setState({ selection });
    }

    handleDeselectAll() {
        this.setState({ selection: [] });
    }

    searchGroups(groups, search) {
        const SEARCH = search.toUpperCase();
        return groups.filter(group => group.name.toUpperCase().includes(SEARCH));
    }

    render() {
        const styles = {
            textField: {
                fontSize: '14px',
                backgroundColor: 'whitesmoke',
                height: '36px',
                lineHeight: '36px',
                margin: '10px 0px',
            },
            characterLimit: {
                bottom: '0px',
                height: '100%',
                display: 'flex',
                transform: 'none',
                alignItems: 'center',
                fontSize: '14px',
            },
            headerIcon: {
                height: '28px',
                width: '28px',
            },
        };

        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }

        const groupLength = groups.length;

        const disabledGroups = this.getDisabledGroups();

        const disabledLength = disabledGroups.length;
        const selectedLength = this.state.selection.length;


        let headerIcon = <Unchecked style={styles.headerIcon} onClick={this.handleSelectAll} />;
        if (groupLength - disabledLength - selectedLength < 1) {
            headerIcon = <Checked style={styles.headerIcon} onClick={this.handleDeselectAll} />;
        } else if (selectedLength > 0) {
            headerIcon = <Indeterminate style={styles.headerIcon} onClick={this.handleSelectAll} />;
        }

        return (
            <ShareBaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                handleSave={this.handleSave}
                title="EDIT GROUP ASSIGNMENTS"
                submitButtonLabel="SAVE"
                className="qa-AddMembersDialog"
            >
                <CustomTextField
                    className="qa-AddMembersDialog-search"
                    fullWidth
                    maxLength={50}
                    hintText="Search"
                    onChange={this.handleSearchInput}
                    value={this.state.search}
                    inputStyle={{ paddingLeft: '16px' }}
                    style={styles.textField}
                    underlineShow={false}
                    hintStyle={{ paddingLeft: '16px', bottom: '0px', color: '#707274' }}
                    charsRemainingStyle={styles.characterLimit}
                />
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '12px 12px 12px 0px', fontSize: '15px' }}>
                    <div style={{ flex: '1 1 auto' }}>GROUPS</div>
                    <div style={{ flex: '0 0 auto', margin: '0px 10px' }}>{`(${disabledGroups.length + this.state.selection.length}) ASSIGNED`}</div>
                    <div style={{ flex: '0 0 auto', justifyContent: 'flex-end' }}>
                        {headerIcon}
                    </div>
                </div>
                {groups.map((group) => {
                    const icon = this.getGroupIcon(group, disabledGroups);
                    return (
                        <div
                            key={group.name}
                            style={{
                                display: 'flex',
                                width: '100%',
                                backgroundColor: 'whitesmoke',
                                alignItems: 'center',
                                padding: '12px',
                                marginBottom: '10px',
                            }}
                        >
                            <div style={{ flex: '1 1 auto', fontWeight: 800, color: '#000' }}>{group.name}</div>
                            {icon}
                        </div>
                    );
                })}
                <Tabs
                    inkBarStyle={{ backgroundColor: '#4598bf' }}
                    tabItemContainerStyle={{ backgroundColor: '#fff', borderBottom: '2px #ddd solid' }}
                >
                    <Tab
                        label="UNASSIGNED"
                        value="0"
                        style={{ color: '#707274' }}
                        buttonStyle={{ height: '36px' }}
                    >
                        <div>
                            UNASSIGNED GROUPS GO HERE
                        </div>
                    </Tab>
                    <Tab
                        label="ASSIGNED"
                        value="1"
                        style={{ color: '#707274' }}
                        buttonStyle={{ height: '36px' }}
                    >
                        <div>
                            ASSIGNED GROUPS GO HERE
                        </div>
                    </Tab>
                </Tabs>
            </ShareBaseDialog>
        );
    }
}

AddMembersDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    selectedUsers: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            last_login: PropTypes.string,
            date_joined: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
};

export default AddMembersDialog;
