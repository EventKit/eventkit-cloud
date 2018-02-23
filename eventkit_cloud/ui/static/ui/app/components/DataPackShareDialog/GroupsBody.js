import React, { Component, PropTypes } from 'react';
import CustomTextField from '../CustomTextField';
import GroupRow from './GroupRow';
import GroupsHeaderRow from './GroupsHeaderRow';

export class GroupsBody extends Component {
    constructor(props) {
        super(props);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleCheckAll = this.handleCheckAll.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.reverseGroupOrder = this.reverseGroupOrder.bind(this);
        this.reverseSharedOrder = this.reverseSharedOrder.bind(this);
        this.state = {
            search: '',
            groupOrder: 1,
            sharedOrder: 1,
            activeOrder: 'group',
        };
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
            groups.forEach((group) => { selectedGroups[group.name] = ['READ']; });
            this.props.onGroupsUpdate(selectedGroups);
        } else {
            const selectedGroups = {};
            this.props.groups.forEach((group) => { selectedGroups[group.name] = ['READ']; });
            this.props.onGroupsUpdate(selectedGroups);
        }
    }

    handleCheck(group) {
        const permissions = this.props.selectedGroups[group.name];
        if (permissions) {
            // we need to remove from the selection
            const newSelection = { ...this.props.selectedGroups };
            newSelection[group.name] = null;
            delete newSelection[group.name];
            this.props.onGroupsUpdate(newSelection);
        } else {
            // we need to add to the selection
            const newSelection = { ...this.props.selectedGroups };
            newSelection[group.name] = ['READ'];
            this.props.onGroupsUpdate(newSelection);
        }
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value }, this.props.update);
    }

    reverseGroupOrder() {
        if (this.state.activeOrder !== 'group') {
            this.setState({ activeOrder: 'group' });
        } else {
            this.setState({ groupOrder: this.state.groupOrder * -1 });
        }
    }

    reverseSharedOrder() {
        if (this.state.activeOrder !== 'shared') {
            this.setState({ activeOrder: 'shared' });
        } else {
            this.setState({ sharedOrder: this.state.sharedOrder * -1 });
        }
    }

    searchGroups(groups, search) {
        const SEARCH = search.toUpperCase();
        return groups.filter(group => group.name.toUpperCase().includes(SEARCH));
    }

    sortByGroup(groups, order) {
        if (order === 1) {
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

    sortByShared(groups, selectedGroups, order) {
        if (order === 1) {
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
        };

        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }

        if (this.state.activeOrder === 'shared') {
            groups = this.sortByShared(groups, this.props.selectedGroups, this.state.sharedOrder);
        } else {
            groups = this.sortByGroup(groups, this.state.groupOrder);
        }

        const selectedCount = groups.filter(group => group.name in this.props.selectedGroups).length;

        return (
            <div>
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
                    <GroupsHeaderRow
                        groupCount={groups.length}
                        selectedCount={selectedCount}
                        onGroupClick={this.reverseGroupOrder}
                        onSharedClick={this.reverseSharedOrder}
                        activeOrder={this.state.activeOrder}
                        groupOrder={this.state.groupOrder}
                        sharedOrder={this.state.sharedOrder}
                        handleCheckAll={this.handleCheckAll}
                        handleUncheckAll={this.handleUncheckAll}
                    />
                </div>
                {groups.map(group => (
                    <GroupRow
                        key={group.id}
                        group={group}
                        members={this.props.members}
                        selected={group.name in this.props.selectedGroups}
                        handleCheck={this.handleCheck}
                        canUpdateAdmin={this.props.canUpdateAdmin}
                        handleAdminChange={member => console.log(member)}
                        className="qa-GroupsBody-GroupRow"
                    />
                ))}
            </div>
        );
    }
}

GroupsBody.defaultProps = {
    groupsText: '',
    canUpdateAdmin: false,
};

GroupsBody.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedGroups: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
    groupsText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    update: PropTypes.func.isRequired,
    onGroupsUpdate: PropTypes.func.isRequired,
    canUpdateAdmin: PropTypes.bool,
};

export default GroupsBody;
