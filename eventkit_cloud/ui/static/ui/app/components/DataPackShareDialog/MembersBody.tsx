import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, Theme } from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import CustomTextField from '../CustomTextField';
import BaseDialog from '../Dialog/BaseDialog';
import MembersHeaderRow, { SharedOrder, MemberOrder } from './MembersHeaderRow';
import MemberRow from './MemberRow';
import MembersBodyTooltip from './ShareBodyTooltip';
import { getUsers } from '../../actions/usersActions';

export interface Props {
    public: boolean;
    getUsers: (args: any, append: boolean) => void;
    nextPage: boolean;
    userCount: number;
    users: Eventkit.User[];
    selectedMembers: Eventkit.Permissions['members'];
    membersText: any;
    onMemberCheck: (username: string) => void;
    onAdminCheck: (username: string) => void;
    onCheckCurrent: () => void;
    onCheckAll: () => void;
    onUncheckAll: () => void;
    canUpdateAdmin: boolean;
    handleShowShareInfo: () => void;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    search: string;
    memberOrder: MemberOrder;
    sharedOrder: SharedOrder;
    activeOrder: MemberOrder | SharedOrder;
    tooltip: {
        target: null | HTMLElement;
        admin: boolean;
    };
    page: number;
    checkAllConfirm: boolean;
    loading: boolean;
}

export class MembersBody extends React.Component<Props, State> {
    static defaultProps = {
        membersText: '',
        canUpdateAdmin: false,
        handleShowShareInfo: () => { /* do nothing */ },
    };

    private body: HTMLElement;
    constructor(props: Props) {
        super(props);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleCheckAll = this.handleCheckAll.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.handleAdminMouseOver = this.handleAdminMouseOver.bind(this);
        this.handleAdminMouseOut = this.handleAdminMouseOut.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
        this.reverseMemberOrder = this.reverseMemberOrder.bind(this);
        this.reverseSharedOrder = this.reverseSharedOrder.bind(this);
        this.handlePageCheckAll = this.handlePageCheckAll.bind(this);
        this.handleSystemCheckAll = this.handleSystemCheckAll.bind(this);
        this.closeConfirm = this.closeConfirm.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.state = {
            search: '',
            memberOrder: 'username',
            sharedOrder: 'shared',
            activeOrder: 'username',
            tooltip: {
                target: null,
                admin: false,
            },
            page: 1,
            checkAllConfirm: false,
            loading: false,
        };
    }

    componentDidMount() {
        window.addEventListener('wheel', this.handleScroll);
        this.getUsers({ page: this.state.page }, false);
    }

    componentWillUnmount() {
        window.removeEventListener('wheel', this.handleScroll);
    }

    private async getUsers(params = {}, append = true) {
        this.setState({ loading: true });
        await this.props.getUsers({
            page: this.state.page,
            exclude_self: 'true',
            ordering: this.state.memberOrder,
            search: this.state.search,
            ...params,
        }, append);
        this.setState({ loading: false });
    }

    private loadMore() {
        this.getUsers({ page: this.state.page + 1 });
        this.setState({ page: this.state.page + 1 });
    }

    private closeConfirm() {
        this.setState({ checkAllConfirm: false });
    }

    private handleUncheckAll() {
        this.props.onUncheckAll();
    }

    // open dialog to give user option to select visible members or all members in system
    private handleCheckAll() {
        this.setState({ checkAllConfirm: true });
    }

    // called if user chooses to select only visible members (SHARED)
    private handlePageCheckAll() {
        this.closeConfirm();
        this.props.onCheckCurrent();
    }

    // called if user chooses to select ALL members in system (PUBLIC)
    private handleSystemCheckAll() {
        this.closeConfirm();
        this.props.onCheckAll();
    }

    // called for selecting or unselecting a individual member
    private handleCheck(user: Eventkit.User) {
        this.props.onMemberCheck(user.user.username);
    }

    // called for selecting or unselecting admin permissions for a member
    private handleAdminCheck(user: Eventkit.User) {
        this.props.onAdminCheck(user.user.username);
    }

    // show the admin button tooltip
    private handleAdminMouseOver(target: HTMLElement, admin: boolean) {
        this.setState({ tooltip: { target, admin } });
    }

    // hide the admin button tooltip
    private handleAdminMouseOut() {
        this.setState({ tooltip: { target: null, admin: false } });
    }

    // if user scrolls up we hide any existing tooltip
    private handleScroll() {
        if (this.state.tooltip.target !== null) {
            this.handleAdminMouseOut();
        }
    }

    // check if user hits enter then make user search
    private async handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            const text = (event.target as HTMLInputElement).value || '';
            if (text) {
                this.setState({ page: 1 });
                this.getUsers({
                    page: 1,
                    search: text,
                }, false);
            }
        }
    }

    // commit text to search state, if search is empty make a getUser request
    private handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.state.search && !e.target.value) {
            this.getUsers({ page: 1 }, false);
            this.setState({ search: e.target.value, page: 1 });
        } else {
            this.setState({ search: e.target.value });
        }
    }

    private reverseMemberOrder(v: MemberOrder) {
        this.getUsers({ page: 1, ordering: v }, false);
        this.setState({ memberOrder: v, activeOrder: v, page: 1 });
    }

    private reverseSharedOrder(v: SharedOrder) {
        this.setState({ sharedOrder: v, activeOrder: v });
    }

    private sortByShared(members: Eventkit.User[], selectedMembers: Eventkit.Permissions['members'], descending: boolean) {
        if (descending === true) {
            members.sort((a, b) => {
                const aSelected = a.user.username in selectedMembers;
                const bSelected = b.user.username in selectedMembers;
                if (aSelected && !bSelected) {
                    return -1;
                }
                if (!aSelected && bSelected) {
                    return 1;
                }
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const aSelected = a.user.username in selectedMembers;
                const bSelected = b.user.username in selectedMembers;
                if (!aSelected && bSelected) {
                    return -1;
                }
                if (aSelected && !bSelected) {
                    return 1;
                }
                return 0;
            });
        }
        return members;
    }

    private sortByAdmin(members: Eventkit.User[], selectedMembers: Eventkit.Permissions['members'], descending: boolean) {
        if (descending === true) {
            members.sort((a, b) => {
                const aAdmin = selectedMembers[a.user.username] === 'ADMIN';
                const bAdmin = selectedMembers[b.user.username] === 'ADMIN';
                if (aAdmin && !bAdmin) {
                    return -1;
                }
                if (!aAdmin && bAdmin) {
                    return 1;
                }
                return 0;
            });
        } else {
            members.sort((a, b) => {
                const aAdmin = selectedMembers[a.user.username] === 'ADMIN';
                const bAdmin = selectedMembers[b.user.username] === 'ADMIN';
                if (!aAdmin && bAdmin) {
                    return -1;
                }
                if (aAdmin && !bAdmin) {
                    return 1;
                }
                return 0;
            });
        }
        return members;
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            fixedHeader: {
                position: 'sticky' as 'sticky',
                top: 38,
                left: 0,
                backgroundColor: colors.white,
                zIndex: 15,
                padding: '0px 10px',
            },
            textField: {
                backgroundColor: colors.secondary,
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
                flexWrap: 'wrap' as 'wrap',
                padding: '10px 0px',
                lineHeight: '20px',
            },
            shareInfoButton: {
                color: colors.primary,
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
                textAlign: 'right' as 'right',
            },
        };

        let { users } = this.props;
        if (this.state.activeOrder.includes('shared')) {
            if (this.state.activeOrder.includes('admin')) {
                users = this.sortByAdmin([...users], this.props.selectedMembers, !this.state.sharedOrder.includes('-admin'));
            } else {
                users = this.sortByShared([...users], this.props.selectedMembers, !this.state.sharedOrder.includes('-'));
            }
        }

        const visibleCount = users.filter(m => m.user.username in this.props.selectedMembers).length;
        const selectedCount = Object.keys(this.props.selectedMembers).length;
        const adminCount = Object.keys(this.props.selectedMembers).filter(m => this.props.selectedMembers[m] === 'ADMIN').length;

        let shareInfo = null;
        if (this.props.canUpdateAdmin) {
            const total = this.props.public ? this.props.userCount : selectedCount;
            shareInfo = (
                <div style={styles.shareInfo} className="qa-MembersBody-shareInfo">
                    <ButtonBase
                        className="qa-MembersBody-shareInfo-button"
                        onClick={this.props.handleShowShareInfo}
                        style={styles.shareInfoButton}
                    >
                        <InfoIcon style={styles.shareInfoIcon} className="qa-MembersBody-shareInfo-icon" />
                        Sharing Rights
                    </ButtonBase>
                    <span style={styles.shareInfoText} className="qa-MembersBody-shareInfo-text">
                        Shared: {total - adminCount} Members plus {adminCount} Admins
                    </span>
                </div>
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
                        placeholder="Search"
                        onChange={this.handleSearchInput}
                        onKeyDown={this.handleSearchKeyDown}
                        value={this.state.search}
                        style={styles.textField}
                        InputProps={{ style: { paddingLeft: '16px', lineHeight: '36px', fontSize: '14px' }, disableUnderline: true }}
                        charsRemainingStyle={styles.characterLimit}
                    />
                    {shareInfo}
                    <MembersHeaderRow
                        className="qa-MembersBody-MembersHeaderRow"
                        public={this.props.public}
                        memberCount={users.length}
                        selectedCount={visibleCount}
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
                {!this.state.loading ?
                    users.map((member) => {
                        const selected = this.props.selectedMembers[member.user.username] || this.props.public;
                        const admin = this.props.selectedMembers[member.user.username] === 'ADMIN';
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
                    })
                    :
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '50px auto' }}>
                        <CircularProgress />
                    </div>
                }
                <MembersBodyTooltip
                    className="qa-MembersBody-MembersBodyTooltip"
                    open={Boolean(this.state.tooltip.target)}
                    target={this.state.tooltip.target}
                    body={this.body}
                    text={this.state.tooltip.admin ? 'Remove administrative rights from member' : 'Share administrative rights with member'}
                    textContainerStyle={{ justifyContent: 'flex-end' }}
                />
                {!this.state.loading && (
                    <Button
                        onClick={this.loadMore}
                        variant="text"
                        color="primary"
                        fullWidth
                        disabled={!this.props.nextPage}
                    >
                        Load More
                    </Button>
                )}
                <BaseDialog
                    show={this.state.checkAllConfirm}
                    onClose={this.closeConfirm}
                    title="SHARE WITH ALL MEMBERS"
                    overlayStyle={{ zIndex: 1501 }}
                    actions={[
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.closeConfirm}
                            key="cancel"
                        >
                            Cancel
                        </Button>,
                    ]}
                >
                    <p>
                        By selecting all, you can select just the currently displayed members
                            or you can select all members in the system.
                    </p>
                    <Button
                        variant="text"
                        color="primary"
                        fullWidth
                        onClick={this.handlePageCheckAll}
                    >
                        SELECT ONLY VISIBLE MEMBERS
                    </Button>
                    <Button
                        variant="text"
                        color="primary"
                        fullWidth
                        onClick={this.handleSystemCheckAll}
                    >
                        SELECT ALL MEMBERS IN SYSTEM
                    </Button>
                </BaseDialog>
            </div>
        );
    }
}

const mapStateToProps = state => (
    {
        users: state.users.users,
        nextPage: state.users.nextPage,
        userCount: state.users.total - 1,
    }
);

const mapDispatchToProps = dispatch => (
    {
        getUsers: (params, append) => (
            dispatch(getUsers(params, append))
        ),
    }
);

export default withTheme()(connect(mapStateToProps, mapDispatchToProps)(MembersBody));
