import * as React from 'react';
import axios from 'axios';
import { withStyles, withTheme, createStyles, Theme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import CheckBoxOutline from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBox from '@material-ui/icons/CheckBox';
import ArrowDown from '@material-ui/icons/KeyboardArrowDown';
import ArrowUp from '@material-ui/icons/KeyboardArrowUp';
import Eye from '@material-ui/icons/RemoveRedEye';
import AdminShare from '../icons/AdminShareIcon';
import GroupMemberRow from './GroupMemberRow';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    noData: {
        height: '25px',
        display: 'flex',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: theme.eventkit.colors.secondary,
        margin: '0px 10px 10px',
        boxShadow: 'none',
    },
    groupText: {
        flex: '1 1 auto',
        color: theme.eventkit.colors.black,
        fontSize: '16px',
        fontWeight: 'bold',
        marginRight: '10px',
        lineHeight: '28px',
        wordBreak: 'break-word',
    },
    groupIcons: {
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        flexDirection: 'row-reverse',
    },
    expandIcon: {
        marginLeft: '15px',
        cursor: 'pointer',
    },
    checkIcon: {
        width: '28px',
        height: '28px',
        cursor: 'pointer',
    },
    cardText: {
        backgroundColor: theme.eventkit.colors.white,
        color: theme.eventkit.colors.text_primary,
        padding: '10px 16px 0px',
    },
    viewContainer: {
        lineHeight: '20px',
        paddingTop: '10px',
        fontSize: '14px',
    },
    viewIcon: {
        height: '20px',
        verticalAlign: 'text-top',
    },
});

export interface Props {
    className?: string;
    group: Eventkit.Group;
    selected: boolean;
    handleCheck: (group: Eventkit.Group) => void;
    handleAdminCheck: (group: Eventkit.Group) => void;
    handleAdminMouseOut: () => void;
    handleAdminMouseOver: (tooltip: HTMLElement, admin: boolean) => void;
    showAdmin: boolean;
    admin: boolean;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export interface State {
    expanded: boolean;
    loadingMembers: boolean;
    members: Eventkit.UserData[];
    membersFetched: boolean;
}

export class GroupRow extends React.Component<Props, State> {
    static defaultProps = {
        admin: false,
        showAdmin: false,
        handleAdminCheck: () => { /* do nothing */ },
        handleAdminMouseOver: () => { /* do nothing */ },
        handleAdminMouseOut: () => { /* do nothing */ },
    };

    private handleCheck: () => void;
    private tooltip: HTMLElement;
    constructor(props: Props) {
        super(props);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleCheck = this.props.handleCheck.bind(this, this.props.group);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.getMembers = this.getMembers.bind(this);
        this.loadMembers = this.loadMembers.bind(this);
        this.onAdminMouseOut = this.onAdminMouseOut.bind(this);
        this.onAdminMouseOver = this.onAdminMouseOver.bind(this);
        this.state = {
            expanded: false,
            loadingMembers: false,
            members: [],
            membersFetched: false,
        };
    }

    private onAdminMouseOver() {
        if (this.props.selected) {
            this.props.handleAdminMouseOver(this.tooltip, this.props.admin);
        }
    }

    private onAdminMouseOut() {
        this.props.handleAdminMouseOut();
    }

    private onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
        const key = e.which || e.keyCode;
        if (key === 13) {
            this.handleAdminCheck();
        }
    }

    private async getMembers() {
        try {
            const response = await axios({
                url: `/api/groups/${this.props.group.id}/users`,
                method: 'GET',
                params: { limit: 4 },
            });
            return response.data.members;
        } catch (e) {
            console.warn(e);
            return [];
        }
    }

    private async loadMembers() {
        this.setState({ loadingMembers: true });
        const members = await this.getMembers();
        this.setState({ loadingMembers: false, members, membersFetched: true });
    }

    private handleAdminCheck() {
        if (this.props.showAdmin && this.props.selected) {
            this.props.handleAdminCheck(this.props.group);
        }
    }

    private toggleExpanded() {
        if (!this.state.membersFetched && !this.state.expanded) {
            this.loadMembers();
        }
        this.setState({ expanded: !this.state.expanded });
    }

    render() {
        const { classes } = this.props;
        const { colors } = this.props.theme.eventkit;

        // Assume group is not selected by default
        let groupIcon = <CheckBoxOutline className={classes.checkIcon} onClick={this.handleCheck} color="primary" />;

        // Check if group is selected
        if (this.props.selected) {
            groupIcon = <CheckBox className={classes.checkIcon} onClick={this.handleCheck} color="primary" />;
        }

        const adminStyle = {
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            marginRight: '15px',
            color: undefined,
            opacity: undefined,
        };
        if (this.props.showAdmin) {
            adminStyle.color = colors.text_primary;
            if (!this.props.selected) {
                adminStyle.opacity = 0.15;
                adminStyle.cursor = 'default';
            } else if (!this.props.admin) {
                adminStyle.opacity = 0.55;
            } else {
                adminStyle.color = colors.primary;
            }
        }

        return (
            <Card
                key={this.props.group.name}
                classes={{ root: classes.card }}
                className="qa-GroupRow-Card"
            >
                <CardHeader
                    className="qa-GroupRow-CardHeader"
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '15px' }}>
                            <div className={`qa-GroupRow-CardHeader-text ${classes.groupText}`}>
                                {this.props.group.name}
                            </div>
                            <div className={`qa-GroupRow-CardHeader-icons ${classes.groupIcons}`}>
                                {this.state.expanded ?
                                    <ArrowUp className={classes.expandIcon} onClick={this.toggleExpanded} color="primary" />
                                    :
                                    <ArrowDown className={classes.expandIcon} onClick={this.toggleExpanded} color="primary" />
                                }
                                {groupIcon}
                                {this.props.showAdmin && (
                                    <div ref={(input) => { this.tooltip = input; }} style={{ display: 'flex', alignItems: 'center' }}>
                                        <AdminShare
                                            className="qa-GroupRow-AdminShare"
                                            onClick={this.handleAdminCheck}
                                            onMouseOver={this.onAdminMouseOver}
                                            onMouseOut={this.onAdminMouseOut}
                                            onFocus={this.onAdminMouseOver}
                                            onBlur={this.onAdminMouseOut}
                                            onKeyDown={this.onKeyDown}
                                            style={adminStyle}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                    style={{ padding: '12px' }}
                />
                <Collapse in={this.state.expanded}>
                    <CardContent className={classes.cardText}>
                        {this.state.members.map(member => (
                            <GroupMemberRow
                                key={member.username}
                                member={member}
                            />
                        ))}
                        {this.state.members.length === 4 ?
                            <div className={`qa-GroupRow-viewMore ${classes.viewContainer}`}>
                                <Eye className={classes.viewIcon} color="primary" />
                                <a href={`/groups?groups=${this.props.group.id}`}>View all on Members and Groups Page</a>
                            </div>
                            :
                            null
                        }
                        {this.state.loadingMembers && <div className={classes.noData}><CircularProgress size={20} /></div>}
                        {this.state.membersFetched && !this.state.members.length && <div className={classes.noData}>No Members</div>}
                    </CardContent>
                </Collapse>
            </Card>
        );
    }
}

export default withTheme()(withStyles(jss)(GroupRow));
