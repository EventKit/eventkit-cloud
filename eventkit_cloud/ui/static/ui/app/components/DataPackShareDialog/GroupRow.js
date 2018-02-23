import React, { Component, PropTypes } from 'react';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import GroupMemberRow from './GroupMemberRow';

export class GroupRow extends Component {
    constructor(props) {
        super(props);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleCheck = this.props.handleCheck.bind(this, this.props.group);
        this.state = {
            expanded: false,
        };
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
                position: 'relative',
                display: 'inline-block',
                width: '28px',
                height: '28px',
                float: 'right',
                cursor: 'pointer',
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

        return (
            <Card
                key={this.props.group.id}
                expanded={this.state.expanded}
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-GroupRow-Card"
            >
                <CardHeader
                    title={
                        <div style={{ display: 'flex' }}>
                            <div style={styles.groupText} className="qa-GroupRow-CardHeader-text">
                                <span style={styles.groupName}>
                                    {this.props.group.name}
                                </span>
                            </div>
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
                    {this.props.group.members.map((groupMember) => {
                        const member = this.props.members.find(propmember => propmember.username === groupMember);
                        if (!member) {
                            return null;
                        }
                        const isAdmin = this.props.group.administrators.includes(groupMember);
                        return (
                            <GroupMemberRow
                                key={member.username}
                                member={member}
                                isGroupAdmin={isAdmin}
                                isDataPackAdmin={false}
                                dropDownDisabled={!this.props.selected}
                                showAdminDropDown={this.props.canUpdateAdmin}
                                handleAdminChange={this.props.handleAdminChange}
                            />
                        );
                    })}
                </CardText>
            </Card>
        );
    }
}

GroupRow.defaultProps = {
    canUpdateAdmin: false,
    handleAdminChange: () => {},
};

GroupRow.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.bool.isRequired,
    handleCheck: PropTypes.func.isRequired,
    handleAdminChange: PropTypes.func,
    canUpdateAdmin: PropTypes.bool,
};

export default GroupRow;
