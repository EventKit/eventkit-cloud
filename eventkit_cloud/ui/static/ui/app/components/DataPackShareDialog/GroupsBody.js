import React, { Component, PropTypes } from 'react';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import InfoIcon from 'material-ui/svg-icons/action/info-outline';
import CustomTextField from '../CustomTextField';
import GroupRow from './GroupRow';
import GroupsHeaderRow from './GroupsHeaderRow';
import GroupBodyTooltip from './ShareBodyTooltip';


export class GroupsBody extends Component {
    constructor(props) {
        super(props);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleCheckAll = this.handleCheckAll.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.handleAdminMouseOver = this.handleAdminMouseOver.bind(this);
        this.handleAdminMouseOut = this.handleAdminMouseOut.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.reverseGroupOrder = this.reverseGroupOrder.bind(this);
        this.reverseSharedOrder = this.reverseSharedOrder.bind(this);
        this.state = {
            search: '',
            groupOrder: 'group',
            sharedOrder: 'shared',
            activeOrder: 'group',
            tooltip: {
                target: null,
                admin: false,
            },
        };
    }

    componentDidMount() {
        window.addEventListener('wheel', this.handleScroll);
    }

    componentWillUnmount() {
        window.removeEventListener('wheel', this.handleScroll);
    }

    handleUncheckAll() {
        if (this.state.search) {
            const groups = [...this.props.groups];
            const shownGroupNames = this.searchGroups(groups, this.state.search).map(g => g.name);
            const selectedGroups = { ...this.props.selectedGroups };
            shownGroupNames.forEach((name) => {
                selectedGroups[name] = null;
                delete selectedGroups[name];
            });
            this.props.onGroupsUpdate(selectedGroups);
        } else {
            this.props.onGroupsUpdate({});
        }
    }

    handleCheckAll() {
        if (this.state.search) {
            const groups = this.searchGroups(this.props.groups, this.state.search);
            const selectedGroups = { ...this.props.selectedGroups };
            groups.forEach((group) => { selectedGroups[group.name] = 'READ'; });
            this.props.onGroupsUpdate(selectedGroups);
        } else {
            const selectedGroups = {};
            this.props.groups.forEach((group) => { selectedGroups[group.name] = 'READ'; });
            this.props.onGroupsUpdate(selectedGroups);
        }
    }

    handleCheck(group) {
        const permissions = this.props.selectedGroups[group.name];
        const newSelection = { ...this.props.selectedGroups };
        if (permissions) {
            // we need to remove from the selection
            newSelection[group.name] = null;
            delete newSelection[group.name];
        } else {
            // we need to add to the selection
            newSelection[group.name] = 'READ';
        }
        this.props.onGroupsUpdate(newSelection);
    }

    handleAdminCheck(group) {
        const permissions = this.props.selectedGroups[group.name];
        const newSelection = { ...this.props.selectedGroups };
        if (permissions && permissions === 'ADMIN') {
            // we need to demote the group from admin status
            newSelection[group.name] = 'READ';
        } else {
            // we need to make the group an admin
            newSelection[group.name] = 'ADMIN';
        }
        this.props.onGroupsUpdate(newSelection);
    }

    handleAdminMouseOver(target, admin) {
        this.setState({ tooltip: { target, admin } });
    }

    handleAdminMouseOut() {
        this.setState({ tooltip: { target: null, admin: false } });
    }

    handleScroll() {
        if (this.state.tooltip.target !== null) {
            this.handleAdminMouseOut();
        }
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value });
    }

    reverseGroupOrder(v) {
        this.setState({ groupOrder: v, activeOrder: v });
    }

    reverseSharedOrder(v) {
        this.setState({ sharedOrder: v, activeOrder: v });
    }

    searchGroups(groups, search) {
        const SEARCH = search.toUpperCase();
        return groups.filter(group => group.name.toUpperCase().includes(SEARCH));
    }

    sortByGroup(groups, descending) {
        if (descending === true) {
            groups.sort((a, b) => {
                const A = a.name.toUpperCase();
                const B = b.name.toUpperCase();
                if (A < B) return -1;
                if (A > B) return 1;
                return 0;
            });
        } else {
            groups.sort((a, b) => {
                const A = a.name.toUpperCase();
                const B = b.name.toUpperCase();
                if (A > B) return -1;
                if (A < B) return 1;
                return 0;
            });
        }
        return groups;
    }

    sortByShared(groups, selectedGroups, descending) {
        if (descending === true) {
            groups.sort((a, b) => {
                const aSelected = a.name in selectedGroups;
                const bSelected = b.name in selectedGroups;
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
        } else {
            groups.sort((a, b) => {
                const aSelected = a.name in selectedGroups;
                const bSelected = b.name in selectedGroups;
                if (!aSelected && bSelected) return -1;
                if (aSelected && !bSelected) return 1;
                return 0;
            });
        }
        return groups;
    }

    sortByAdmin(groups, selectedGroups, descending) {
        if (descending === true) {
            groups.sort((a, b) => {
                const aAdmin = selectedGroups[a.name] === 'ADMIN';
                const bAdmin = selectedGroups[b.name] === 'ADMIN';
                if (aAdmin && !bAdmin) return -1;
                if (!aAdmin && bAdmin) return 1;
                return 0;
            });
        } else {
            groups.sort((a, b) => {
                const aAdmin = selectedGroups[a.name] === 'ADMIN';
                const bAdmin = selectedGroups[b.name] === 'ADMIN';
                if (!aAdmin && bAdmin) return -1;
                if (aAdmin && !bAdmin) return 1;
                return 0;
            });
        }
        return groups;
    }

    render() {
        const styles = {
            fixedHeader: {
                position: 'sticky',
                top: 38,
                left: 0,
                backgroundColor: '#fff',
                zIndex: 15,
                padding: '0px 10px',
            },
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
            shareInfo: {
                display: 'flex',
                flexWrap: 'wrap',
                padding: '10px 0px',
                lineHeight: '20px',
            },
            shareInfoButton: {
                color: '#4598bf',
                fontSize: '13px',
                flex: '0 0 auto',
            },
            shareInfoIcon: {
                height: '18px',
                width: '18px',
                verticalAlign: 'bottom',
                marginRight: '5px',
            },
            shareInfoText: {
                fontSize: '13px',
                flex: '1 0 auto',
                textAlign: 'right',
            },
        };

        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }

        if (this.state.activeOrder.includes('group')) {
            groups = this.sortByGroup([...groups], !this.state.groupOrder.includes('-'));
        } else if (this.state.activeOrder.includes('shared')) {
            if (this.state.activeOrder.includes('admin')) {
                groups = this.sortByAdmin([...groups], this.props.selectedGroups, !this.state.sharedOrder.includes('-admin'));
            } else {
                groups = this.sortByShared([...groups], this.props.selectedGroups, !this.state.sharedOrder.includes('-'));
            }
        }

        const selectedGroups = groups.filter(group => group.name in this.props.selectedGroups);
        const selectedCount = selectedGroups.length;
        const adminCount = selectedGroups.filter(group => this.props.selectedGroups[group.name] === 'ADMIN').length;

        let shareInfo = null;
        if (this.props.canUpdateAdmin) {
            shareInfo = (
                <div style={styles.shareInfo} className="qa-GroupsBody-shareInfo">
                    <EnhancedButton
                        className="qa-GroupsBody-shareInfo-button"
                        onClick={this.props.handleShowShareInfo}
                        style={styles.shareInfoButton}
                    >
                        <InfoIcon style={styles.shareInfoIcon} className="qa-GroupsBody-shareInfo-icon" />
                        Sharing Rights
                    </EnhancedButton>
                    <span style={styles.shareInfoText} className="qa-GroupsBody-shareInfo-text">
                        Shared: {selectedCount - adminCount} Groups plus {adminCount} Admin Groups
                    </span>
                </div>
            );
        }

        let tooltip = null;
        if (this.state.tooltip.target !== null) {
            tooltip = (
                <GroupBodyTooltip
                    className="qa-GroupsBody-GroupBodyTooltip"
                    target={this.state.tooltip.target}
                    body={this.body}
                    text={this.state.tooltip.admin ? 'Remove administrative rights from group administrators' : 'Share administrative rights with group administrators'}
                />
            );
        }

        return (
            <div style={{ position: 'relative' }} ref={(input) => { this.body = input; }}>
                <div style={styles.fixedHeader}>
                    <div style={{ fontSize: '14px', padding: '10px 0px' }} className="qa-GroupsBody-groupsText">
                        {this.props.groupsText}
                    </div>
                    <CustomTextField
                        className="qa-GroupsBody-search"
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
                    {shareInfo}
                    <GroupsHeaderRow
                        className="qa-GroupsBody-GroupsHeaderRow"
                        groupCount={groups.length}
                        selectedCount={selectedCount}
                        onGroupClick={this.reverseGroupOrder}
                        onSharedClick={this.reverseSharedOrder}
                        groupOrder={this.state.groupOrder}
                        sharedOrder={this.state.sharedOrder}
                        activeOrder={this.state.activeOrder}
                        handleCheckAll={this.handleCheckAll}
                        handleUncheckAll={this.handleUncheckAll}
                        canUpdateAdmin={this.props.canUpdateAdmin}
                    />
                </div>
                {groups.map((group) => {
                    const selected = this.props.selectedGroups[group.name];
                    const admin = selected === 'ADMIN';
                    return (
                        <GroupRow
                            key={group.name}
                            group={group}
                            members={this.props.members}
                            selected={!!selected}
                            admin={admin}
                            showAdmin={this.props.canUpdateAdmin}
                            handleCheck={this.handleCheck}
                            handleAdminCheck={this.handleAdminCheck}
                            handleAdminMouseOut={this.handleAdminMouseOut}
                            handleAdminMouseOver={this.handleAdminMouseOver}
                            className="qa-GroupsBody-GroupRow"
                        />
                    );
                })}
                {tooltip}
            </div>
        );
    }
}

GroupsBody.defaultProps = {
    groupsText: '',
    canUpdateAdmin: false,
    handleShowShareInfo: () => {},
};

GroupsBody.propTypes = {
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
    selectedGroups: PropTypes.objectOf(PropTypes.string).isRequired,
    groupsText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    onGroupsUpdate: PropTypes.func.isRequired,
    canUpdateAdmin: PropTypes.bool,
    handleShowShareInfo: PropTypes.func,
};

export default GroupsBody;
