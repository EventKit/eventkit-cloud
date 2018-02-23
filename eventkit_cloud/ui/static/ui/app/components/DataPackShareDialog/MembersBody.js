import React, { Component, PropTypes } from 'react';
import CustomTextField from '../CustomTextField';
import MembersHeaderRow from './MembersHeaderRow';
import MemberRow from './MemberRow';

export class MembersBody extends Component {
    constructor(props) {
        super(props);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleCheckAll = this.handleCheckAll.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.reverseMemberOrder = this.reverseMemberOrder.bind(this);
        this.reverseSharedOrder = this.reverseSharedOrder.bind(this);
        this.state = {
            search: '',
            memberOrder: 1,
            sharedOrder: 1,
            activeOrder: 'member',
        };
    }

    handleUncheckAll() {
        if (this.state.search) {
            const members = [...this.props.members];
            const shownUsernames = this.searchMembers(members, this.state.search).map(m => m.username);
            const selectedMembers = { ...this.props.selectedMembers };
            shownUsernames.forEach((name) => {
                selectedMembers[name] = null;
                delete selectedMembers[name];
            });
            this.props.onMembersUpdate(selectedMembers);
        } else {
            this.props.onMembersUpdate({});
        }
    }

    handleCheckAll() {
        if (this.state.search) {
            const members = this.searchMembers(this.props.members, this.state.search);
            const selectedMembers = { ...this.props.selectedMembers };
            members.forEach((m) => { selectedMembers[m.username] = ['READ']; });
            this.props.onMembersUpdate(selectedMembers);
        } else {
            const selectedMembers = {};
            this.props.members.forEach((m) => { selectedMembers[m.username] = ['READ']; });
            this.props.onMembersUpdate(selectedMembers);
        }
    }

    handleCheck(member) {
        const permission = this.props.selectedMembers[member.username];
        if (permission) {
            // we need to remove from the selection
            const selectedMembers = { ...this.props.selectedMembers };
            selectedMembers[member.username] = null;
            delete selectedMembers[member.username];
            this.props.onMembersUpdate(selectedMembers);
        } else {
            // we need to add to the selection
            const selectedMembers = { ...this.props.selectedMembers };
            selectedMembers[member.username] = ['READ'];
            this.props.onMembersUpdate(selectedMembers);
        }
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value }, this.props.update);
    }

    reverseMemberOrder() {
        if (this.state.activeOrder !== 'member') {
            this.setState({ activeOrder: 'member' });
        } else {
            this.setState({ memberOrder: this.state.memberOrder * -1 });
        }
    }

    reverseSharedOrder() {
        if (this.state.activeOrder !== 'shared') {
            this.setState({ activeOrder: 'shared' });
        } else {
            this.setState({ sharedOrder: this.state.sharedOrder * -1 });
        }
    }

    searchMembers(members, search) {
        const SEARCH = search.toUpperCase();
        return members.filter((member) => {
            if (member.username.toUpperCase().includes(SEARCH)) return true;
            if (member.email.toUpperCase().includes(SEARCH)) return true;
            return false;
        });
    }

    sortByMember(members, order) {
        if (order === 1) {
            members.sort((a, b) => {
                const A = a.username.toUpperCase();
                const B = b.username.toUpperCase();
                if (A < B) return -1;
                if (A > B) return 1;
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const A = a.username.toUpperCase();
                const B = b.username.toUpperCase();
                if (A > B) return -1;
                if (A < B) return 1;
                return 0;
            });
        }
        return members;
    }

    sortByShared(members, selectedMembers, order) {
        if (order === 1) {
            members.sort((a, b) => {
                const aSelected = a.username in selectedMembers;
                const bSelected = b.username in selectedMembers;
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const aSelected = a.username in selectedMembers;
                const bSelected = b.username in selectedMembers;
                if (!aSelected && bSelected) return -1;
                if (aSelected && !bSelected) return 1;
                return 0;
            });
        }
        return members;
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

        let { members } = this.props;
        if (this.state.search) {
            members = this.searchMembers(members, this.state.search);
        }

        if (this.state.activeOrder === 'shared') {
            members = this.sortByShared(members, this.props.selectedMembers, this.state.sharedOrder);
        } else {
            members = this.sortByMember(members, this.state.memberOrder);
        }

        const selectedCount = members.filter(m => m.username in this.props.selectedMembers).length;

        return (
            <div>
                <div style={styles.fixedHeader}>
                    <div style={{ fontSize: '14px', padding: '10px 0px' }} className="qa-MembersBody-membersText">
                        {this.props.membersText}
                    </div>
                    <CustomTextField
                        className="qa-MembersBody-search"
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
                    <MembersHeaderRow
                        memberCount={members.length}
                        selectedCount={selectedCount}
                        onMemberClick={this.reverseMemberOrder}
                        onSharedClick={this.reverseSharedOrder}
                        activeOrder={this.state.activeOrder}
                        memberOrder={this.state.memberOrder}
                        sharedOrder={this.state.sharedOrder}
                        handleCheckAll={this.handleCheckAll}
                        handleUncheckAll={this.handleUncheckAll}
                    />
                </div>
                {members.map(member => (
                    <MemberRow
                        key={member.username}
                        member={member}
                        selected={member.username in this.props.selectedMembers}
                        handleCheck={this.handleCheck}
                        className="qa-MembersBody-MemberRow"
                    />
                ))}
            </div>
        );
    }
}

MembersBody.defaultProps = {
    membersText: '',
};

MembersBody.propTypes = {
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedMembers: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
    membersText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    update: PropTypes.func.isRequired,
    onMembersUpdate: PropTypes.func.isRequired,
};

export default MembersBody;
