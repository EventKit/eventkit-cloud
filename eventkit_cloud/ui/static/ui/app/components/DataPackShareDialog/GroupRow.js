import React, { Component, PropTypes } from 'react';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import People from 'material-ui/svg-icons/social/people';
import PeopleOutline from 'material-ui/svg-icons/social/people-outline';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import AdminShare from '../icons/AdminShareIcon';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import Eye from 'material-ui/svg-icons/image/remove-red-eye';
import GroupMemberRow from './GroupMemberRow';

export class GroupRow extends Component {
    constructor(props) {
        super(props);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleCheck = this.props.handleCheck.bind(this, this.props.group);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onAdminMouseOut = this.onAdminMouseOut.bind(this);
        this.onAdminMouseOver = this.onAdminMouseOver.bind(this);
        this.state = {
            expanded: false,
        };
    }

    onAdminMouseOver() {
        if (this.props.selected) {
            this.props.handleAdminMouseOver(this.tooltip, this.props.admin);
        }
    }

    onAdminMouseOut() {
        this.props.handleAdminMouseOut();
    }

    onKeyDown(e) {
        const key = e.which || e.keyCode;
        if (key === 13) this.handleAdminCheck();
    }

    handleAdminCheck() {
        if (this.props.showAdmin && this.props.selected) {
            this.props.handleAdminCheck(this.props.group);
        }
    }

    toggleExpanded() {
        this.setState({ expanded: !this.state.expanded });
    }

    render() {
        const styles = {
            card: {
                backgroundColor: 'whitesmoke',
                margin: '0px 10px 10px',
                boxShadow: 'none',
            },
            groupText: {
                flex: '1 1 auto',
                justifyContent: 'flex-start',
                marginRight: '10px',
            },
            groupName: {
                color: '#000',
                fontSize: '16px',
                fontWeight: 'bold',
                flex: '0 1 auto',
                marginRight: '10px',
            },
            groupIcons: {
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'row-reverse',
            },
            expandIcon: {
                fill: '#4598bf',
                marginLeft: '15px',
                cursor: 'pointer',
            },
            checkIcon: {
                width: '28px',
                height: '28px',
                cursor: 'pointer',
            },
            adminCheckIcon: {
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                marginRight: '5px',
            },
            cardText: {
                backgroundColor: '#fff',
                color: '#707274',
                padding: '10px 16px 0px',
            },
        };

        // Assume group is not selected by default
        let groupIcon = <CheckBoxOutline style={styles.checkIcon} onClick={this.handleCheck} />;

        // Check if group is selected
        if (this.props.selected) {
            groupIcon = <CheckBox style={styles.checkIcon} onClick={this.handleCheck} />;
        }

        let adminButton = null;
        if (this.props.showAdmin) {
            if (!this.props.selected) {
                styles.adminCheckIcon.color = '#707274';
                styles.adminCheckIcon.opacity = 0.15;
                styles.adminCheckIcon.cursor = 'default';
            } else if (!this.props.admin) {
                styles.adminCheckIcon.opacity = 0.55;
            }

            adminButton = (
                <div ref={(input) => { this.tooltip = input; }} style={{ display: 'flex', alignItems: 'center' }}>
                    <AdminShare
                        className="qa-GroupRow-AdminShare"
                        onClick={this.handleAdminCheck}
                        onMouseOver={this.onAdminMouseOver}
                        onMouseOut={this.onAdminMouseOut}
                        onFocus={this.onAdminMouseOver}
                        onBlur={this.onAdminMouseOut}
                        style={styles.adminCheckIcon}
                    />
                </div>
            );
        }

        const groupMembers = [];
        this.props.group.members.forEach((groupMember) => {
            const member = this.props.members.find(propmember => propmember.user.username === groupMember);
            if (member) groupMembers.push(member);
        });
        groupMembers.sort((a, b) => {
            const aAdmin = this.props.group.administrators.includes(a.user.username);
            const bAdmin = this.props.group.administrators.includes(b.user.username);
            if (!aAdmin && bAdmin) return 1;
            if (aAdmin && !bAdmin) return -1;
            return 0;
        });

        const firstFour = groupMembers.splice(0, 4);

        return (
            <Card
                key={this.props.group.id}
                expanded={this.state.expanded}
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-GroupRow-Card"
            >
                <CardHeader
                    className="qa-GroupRow-CardHeader"
                    title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={styles.groupText} className="qa-GroupRow-CardHeader-text">
                                <span style={styles.groupName}>
                                    {this.props.group.name}
                                </span>
                            </div>
                            {adminButton}
                            <div style={styles.groupIcons} className="qa-GroupRow-CardHeader-icons">
                                {this.state.expanded ?
                                    <ArrowUp style={styles.expandIcon} onClick={this.toggleExpanded} />
                                    :
                                    <ArrowDown style={styles.expandIcon} onClick={this.toggleExpanded} />
                                }
                                {groupIcon}
                            </div>
                        </div>
                    }
                    style={{ padding: '12px' }}
                    textStyle={{ padding: '0px', width: '100%' }}
                />
                <CardText expandable style={styles.cardText}>
                    {firstFour.map((member) => {
                        const isAdmin = this.props.group.administrators.includes(member.user.username);
                        return (
                            <GroupMemberRow
                                key={member.user.username}
                                member={member}
                                isGroupAdmin={isAdmin}
                            />
                        );
                    })}
                    {groupMembers.length ?
                        <div style={{ lineHeight: '20px', paddingTop: '10px' }} className="qa-GroupRow-viewMore">
                            <Eye style={{ height: '20px', verticalAlign: 'text-top' }} />
                            <a href="/groups">View all on Members and Groups Page</a>
                        </div>
                        :
                        null
                    }
                </CardText>
            </Card>
        );
    }
}

GroupRow.defaultProps = {
    admin: false,
    showAdmin: false,
    handleAdminCheck: () => {},
    handleAdminMouseOver: () => {},
    handleAdminMouseOut: () => {},
};

GroupRow.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
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
    selected: PropTypes.bool.isRequired,
    handleCheck: PropTypes.func.isRequired,
    handleAdminCheck: PropTypes.func,
    handleAdminMouseOut: PropTypes.func,
    handleAdminMouseOver: PropTypes.func,
    showAdmin: PropTypes.bool,
    admin: PropTypes.bool,
};

export default GroupRow;
