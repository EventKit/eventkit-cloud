import React, { Component, PropTypes } from 'react';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import InfoIcon from 'material-ui/svg-icons/action/info-outline';
import CustomTextField from '../CustomTextField';
import MembersHeaderRow from './MembersHeaderRow';
import MemberRow from './MemberRow';
import MembersBodyTooltip from './ShareBodyTooltip';


export class MembersBody extends Component {
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
        this.reverseMemberOrder = this.reverseMemberOrder.bind(this);
        this.reverseSharedOrder = this.reverseSharedOrder.bind(this);
        this.state = {
            search: '',
            memberOrder: 'member',
            sharedOrder: 'shared',
            activeOrder: 'member',
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
            const members = [...this.props.members];
            const shownUsernames = this.searchMembers(members, this.state.search).map(m => m.user.username);
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
            members.forEach((m) => { selectedMembers[m.user.username] = 'READ'; });
            this.props.onMembersUpdate(selectedMembers);
        } else {
            const selectedMembers = {};
            this.props.members.forEach((m) => { selectedMembers[m.user.username] = 'READ'; });
            this.props.onMembersUpdate(selectedMembers);
        }
    }

    handleCheck(member) {
        const permission = this.props.selectedMembers[member.user.username];
        if (permission) {
            // we need to remove from the selection
            const selectedMembers = { ...this.props.selectedMembers };
            selectedMembers[member.user.username] = null;
            delete selectedMembers[member.user.username];
            this.props.onMembersUpdate(selectedMembers);
        } else {
            // we need to add to the selection
            const selectedMembers = { ...this.props.selectedMembers };
            selectedMembers[member.user.username] = 'READ';
            this.props.onMembersUpdate(selectedMembers);
        }
    }

    handleAdminCheck(member) {
        const permission = this.props.selectedMembers[member.user.username];
        if (permission && permission === 'ADMIN') {
            // we need to demote this member from admin status
            const selectedMembers = { ...this.props.selectedMembers };
            selectedMembers[member.user.username] = 'READ';
            this.props.onMembersUpdate(selectedMembers);
        } else {
            // we need to make this member an admin
            const selectedMembers = { ...this.props.selectedMembers };
            selectedMembers[member.user.username] = 'ADMIN';
            this.props.onMembersUpdate(selectedMembers);
        }
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

    reverseMemberOrder(v) {
        this.setState({ memberOrder: v, activeOrder: v });
    }

    reverseSharedOrder(v) {
        this.setState({ sharedOrder: v, activeOrder: v });
    }

    searchMembers(members, search) {
        const SEARCH = search.toUpperCase();
        return members.filter((member) => {
            if (member.user.username.toUpperCase().includes(SEARCH)) return true;
            if (member.user.email.toUpperCase().includes(SEARCH)) return true;
            return false;
        });
    }

    sortByMember(members, descending) {
        if (descending === true) {
            members.sort((a, b) => {
                const A = a.user.username.toUpperCase();
                const B = b.user.username.toUpperCase();
                if (A < B) return -1;
                if (A > B) return 1;
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const A = a.user.username.toUpperCase();
                const B = b.user.username.toUpperCase();
                if (A > B) return -1;
                if (A < B) return 1;
                return 0;
            });
        }
        return members;
    }

    sortByShared(members, selectedMembers, descending) {
        if (descending === true) {
            members.sort((a, b) => {
                const aSelected = a.user.username in selectedMembers;
                const bSelected = b.user.username in selectedMembers;
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const aSelected = a.user.username in selectedMembers;
                const bSelected = b.user.username in selectedMembers;
                if (!aSelected && bSelected) return -1;
                if (aSelected && !bSelected) return 1;
                return 0;
            });
        }
        return members;
    }

    sortByAdmin(members, selectedMembers, descending) {
        if (descending === true) {
            members.sort((a, b) => {
                const aAdmin = selectedMembers[a.user.username] === 'ADMIN';
                const bAdmin = selectedMembers[b.user.username] === 'ADMIN';
                if (aAdmin && !bAdmin) return -1;
                if (!aAdmin && bAdmin) return 1;
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const aAdmin = selectedMembers[a.user.username] === 'ADMIN';
                const bAdmin = selectedMembers[b.user.username] === 'ADMIN';
                if (!aAdmin && bAdmin) return -1;
                if (aAdmin && !bAdmin) return 1;
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

        let { members } = this.props;
        if (this.state.search) {
            members = this.searchMembers(members, this.state.search);
        }

        if (this.state.activeOrder.includes('member')) {
            members = this.sortByMember([...members], !this.state.memberOrder.includes('-'));
        } else if (this.state.activeOrder.includes('shared')) {
            if (this.state.activeOrder.includes('admin')) {
                members = this.sortByAdmin([...members], this.props.selectedMembers, !this.state.sharedOrder.includes('-admin'));
            } else {
                members = this.sortByShared([...members], this.props.selectedMembers, !this.state.sharedOrder.includes('-'));
            }
        }

        const selectedMembers = members.filter(m => m.user.username in this.props.selectedMembers);
        const selectedCount = selectedMembers.length;
        const adminCount = selectedMembers.filter(m => this.props.selectedMembers[m.user.username] === 'ADMIN').length;

        let shareInfo = null;
        if (this.props.canUpdateAdmin) {
            shareInfo = (
                <div style={styles.shareInfo} className="qa-MembersBody-shareInfo">
                    <EnhancedButton
                        className="qa-MembersBody-shareInfo-button"
                        onClick={this.props.handleShowShareInfo}
                        style={styles.shareInfoButton}
                    >
                        <InfoIcon style={styles.shareInfoIcon} className="qa-MembersBody-shareInfo-icon" />
                        Sharing Rights
                    </EnhancedButton>
                    <span style={styles.shareInfoText} className="qa-MembersBody-shareInfo-text">
                        Shared: {selectedCount - adminCount} Members plus {adminCount} Admins
                    </span>
                </div>
            );
        }
        
        let tooltip = null;
        if (this.state.tooltip.target !== null) {
            tooltip = (
                <MembersBodyTooltip
                    className="qa-MembersBody-MembersBodyTooltip"
                    target={this.state.tooltip.target}
                    body={this.body}
                    text={this.state.tooltip.admin ? 'Remove administrative rights from member' : 'Share administrative rights with member'}
                    textContainerStyle={{ justifyContent: 'flex-end' }}
                />
            );
        }

        return (
            <div style={{ position: 'relative' }} ref={(input) => { this.body = input; }}>
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
                    {shareInfo}
                    <MembersHeaderRow
                        className="qa-MembersBody-MembersHeaderRow"
                        memberCount={members.length}
                        selectedCount={selectedCount}
                        onMemberClick={this.reverseMemberOrder}
                        onSharedClick={this.reverseSharedOrder}
                        activeOrder={this.state.activeOrder}
                        memberOrder={this.state.memberOrder}
                        sharedOrder={this.state.sharedOrder}
                        handleCheckAll={this.handleCheckAll}
                        handleUncheckAll={this.handleUncheckAll}
                        canUpdateAdmin={this.props.canUpdateAdmin}
                    />
                </div>
                {members.map((member) => {
                    const selected = this.props.selectedMembers[member.user.username];
                    const admin = selected === 'ADMIN';
                    return (
                        <MemberRow
                            key={member.user.username}
                            showAdmin={this.props.canUpdateAdmin}
                            member={member}
                            selected={!!selected}
                            admin={admin}
                            handleCheck={this.handleCheck}
                            handleAdminCheck={this.handleAdminCheck}
                            handleAdminMouseOut={this.handleAdminMouseOut}
                            handleAdminMouseOver={this.handleAdminMouseOver}
                            className="qa-MembersBody-MemberRow"
                        />
                    );
                })}
                {tooltip}
            </div>
        );
    }
}

MembersBody.defaultProps = {
    membersText: '',
    canUpdateAdmin: false,
    handleShowShareInfo: () => {},
};

MembersBody.propTypes = {
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
    selectedMembers: PropTypes.objectOf(PropTypes.string).isRequired,
    membersText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    onMembersUpdate: PropTypes.func.isRequired,
    canUpdateAdmin: PropTypes.bool,
    handleShowShareInfo: PropTypes.func,
};

export default MembersBody;
