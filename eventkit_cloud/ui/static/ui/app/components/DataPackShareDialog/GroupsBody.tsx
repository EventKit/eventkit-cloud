import * as React from 'react';
import {connect} from 'react-redux';
import {withTheme, Theme} from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import ButtonBase from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import CustomTextField from '../common/CustomTextField';
import GroupRow from './GroupRow';
import GroupsHeaderRow, {GroupOrder, SharedOrder} from './GroupsHeaderRow';
import GroupBodyTooltip from './ShareBodyTooltip';
import {getPermissionGroups} from '../../actions/groupActions';

export interface Props {
    job: Eventkit.Job;
    getPermissionGroups: (jobUid: any, params: {}, append: boolean) => void;
    nextPage: boolean;
    groups: Eventkit.Group[];
    view: 'groups' | 'members';
    selectedGroups: Eventkit.Permissions.Groups;
    groupsText: any;
    onUncheckAll: () => void;
    onCheckAll: () => void;
    onGroupCheck: (name: string) => void;
    onAdminCheck: (name: string) => void;
    canUpdateAdmin: boolean;
    handleShowShareInfo: () => void;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    search: string;
    groupOrder: GroupOrder;
    sharedOrder: SharedOrder;
    activeOrder: GroupOrder | SharedOrder;
    tooltip: {
        target: null | HTMLElement;
        admin: boolean;
    };
    page: number;
    loading: boolean;
}

export class GroupsBody extends React.Component<Props, State> {
    static defaultProps = {
        groupsText: '',
        canUpdateAdmin: false,
        handleShowShareInfo: () => { /* do nothing */
        },
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
        this.reverseGroupOrder = this.reverseGroupOrder.bind(this);
        this.reverseSharedOrder = this.reverseSharedOrder.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.state = {
            search: '',
            groupOrder: 'name',
            sharedOrder: 'shared',
            activeOrder: 'name',
            tooltip: {
                target: null,
                admin: false,
            },
            page: 1,
            loading: false,
        };
    }

    componentDidMount() {
        window.addEventListener('wheel', this.handleScroll);
        if (this.props.job) {
            const jobUid = this.props.job.uid;
            this.getPermissionGroups(jobUid, this.getPermissions(), this.getGroupOrder(), {page: this.state.page}, false);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('wheel', this.handleScroll);
    }

    private getPermissions() {
        let permissions;
        const selectedGroups = this.props.selectedGroups;
        if (Object.values(selectedGroups).find(value => value === 'ADMIN')) {
            permissions = 'admin_shared';
        } else {
            permissions = 'shared';
        }
        return permissions;
    }

    private getGroupOrder() {
        let name;
        if (this.state.groupOrder === 'name') {
            name = 'name';
        } else {
            name = '-name';
        }
        return name;
    }

    private async getPermissionGroups(jobUid, permissions, groupOrder, params: {}, append = true) {
        this.setState({loading: true});
        if (this.state.search) {
            params['search'] = this.state.search;
        }
        await this.props.getPermissionGroups(
            jobUid,
            {
                prepend_self: 'true',
                ordering: `${permissions},${groupOrder}`,
                page: this.state.page,
                ...params,
            },
            append
        );
        this.setState({loading: false});
    }

    private loadMore() {
        const jobUid = this.props.job.uid;
        this.getPermissionGroups(jobUid, this.getPermissions(), this.getGroupOrder(), {page: this.state.page + 1});
        this.setState({page: this.state.page + 1});
    }

    private handleUncheckAll() {
        this.props.onUncheckAll();
    }

    private handleCheckAll() {
        this.props.onCheckAll();
    }

    private handleCheck(group: Eventkit.Group) {
        this.props.onGroupCheck(group.name);
    }

    private handleAdminCheck(group: Eventkit.Group) {
        this.props.onAdminCheck(group.name);
    }

    private handleAdminMouseOver(target: HTMLElement, admin: boolean) {
        this.setState({tooltip: {target, admin}});
    }

    private handleAdminMouseOut() {
        this.setState({tooltip: {target: null, admin: false}});
    }

    private handleScroll() {
        if (this.state.tooltip.target !== null) {
            this.handleAdminMouseOut();
        }
    }

    // check if user hits enter then make group search
    private async handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            const text = (event.target as HTMLInputElement).value || '';
            if (text) {
                this.setState({page: 1});
                this.getPermissionGroups(
                    this.props.job.uid,
                    this.getPermissions(),
                    this.getGroupOrder(),
                    {page: 1, search: text},
                    false
                );
            }
        }
    }

    // commit text to search state, if search is empty make a getGroups request
    private handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (this.state.search && !e.target.value) {
            this.getPermissionGroups(
                this.props.job.uid,
                this.getPermissions(),
                this.getGroupOrder(),
                {page: 1, search: e.target.value},
                false
            );
            this.setState({search: e.target.value, page: 1});
        } else {
            this.setState({search: e.target.value});
        }
    }

    private reverseGroupOrder(v: GroupOrder) {
        this.getPermissionGroups(
            this.props.job.uid,
            this.getPermissions(),
            v,
            {page: 1},
            false
        );
        this.setState({groupOrder: v, activeOrder: v, page: 1});
    }

    private reverseSharedOrder(v: SharedOrder) {
        this.getPermissionGroups(
            this.props.job.uid,
            v,
            this.getGroupOrder(),
            {page: 1},
            false
        );
        this.setState({sharedOrder: v, activeOrder: v});
    }

    render() {
        const {colors} = this.props.theme.eventkit;

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

        const {groups} = this.props;
        const selectedCount = Object.keys(this.props.selectedGroups).length;
        const adminCount = Object.keys(this.props.groups).filter(group => this.props.selectedGroups[group] === 'ADMIN').length;

        let shareInfo = null;
        if (this.props.canUpdateAdmin) {
            shareInfo = (
                <div style={styles.shareInfo} className="qa-GroupsBody-shareInfo">
                    <ButtonBase
                        className="qa-GroupsBody-shareInfo-button"
                        onClick={this.props.handleShowShareInfo}
                        style={styles.shareInfoButton}
                    >
                        <InfoIcon style={styles.shareInfoIcon} className="qa-GroupsBody-shareInfo-icon"/>
                        Sharing Rights
                    </ButtonBase>
                    <span style={styles.shareInfoText} className="qa-GroupsBody-shareInfo-text">
                        Shared: {selectedCount - adminCount} Groups plus {adminCount} Admin Groups
                    </span>
                </div>
            );
        }

        return (
            <div style={{position: 'relative'}} ref={(input) => {
                this.body = input;
            }}>
                <div style={styles.fixedHeader}>
                    <div style={{fontSize: '14px', padding: '10px 0px'}} className="qa-GroupsBody-groupsText">
                        {this.props.groupsText}
                    </div>
                    <CustomTextField
                        className="qa-GroupsBody-search"
                        fullWidth
                        maxLength={50}
                        placeholder="Search"
                        onChange={this.handleSearchInput}
                        onKeyDown={this.handleSearchKeyDown}
                        value={this.state.search}
                        InputProps={{
                            style: {paddingLeft: '16px', lineHeight: '36px', fontSize: '14px'},
                            disableUnderline: true
                        }}
                        style={styles.textField}
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
                {!this.state.loading ?
                    groups.map((group) => {
                        const selected = this.props.selectedGroups[group.name];
                        const admin = selected === 'ADMIN';
                        return (
                            <GroupRow
                                view={this.props.view}
                                key={group.name}
                                group={group}
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
                    })
                    :
                    <div style={{display: 'flex', justifyContent: 'center', margin: '50px auto'}}>
                        <CircularProgress/>
                    </div>
                }
                <GroupBodyTooltip
                    className="qa-GroupsBody-GroupBodyTooltip"
                    open={Boolean(this.state.tooltip.target)}
                    target={this.state.tooltip.target}
                    body={this.body}
                    text={this.state.tooltip.admin ?
                        'Remove administrative rights from group administrators'
                        :
                        'Share administrative rights with group administrators'
                    }
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
            </div>
        );
    }
}

const mapStateToProps = state => (
    {
        groups: state.groups.groups,
        nextPage: state.groups.nextPage,
    }
);

const mapDispatchToProps = dispatch => (
    {
        getPermissionGroups: (jobUid, params, append) => (
            dispatch(getPermissionGroups(jobUid, params, append))
        ),
    }
);

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(GroupsBody));
