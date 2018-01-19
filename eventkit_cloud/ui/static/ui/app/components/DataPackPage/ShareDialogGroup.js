import React, { Component, PropTypes } from 'react';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import IndeterminateIcon from '../../components/IndeterminateIcon';

export class ShareDialogGroup extends Component {
    constructor(props) {
        super(props);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleCheckAll = this.handleCheckAll.bind(this);
        this.handleCheckedClick = this.handleCheckedClick.bind(this);
        this.handleUncheckedClick = this.handleUncheckedClick.bind(this);
        this.state = {
            expanded: false,
        };
    }

    toggleExpanded() {
        this.setState({ expanded: !this.state.expanded });
    }

    handleUncheckAll() {
        this.props.updateSelection([]);
    }

    handleCheckAll() {
        const newSelection = [...this.props.group.members];
        this.props.updateSelection(newSelection);
    }

    handleCheckedClick(username) {
        const newSelection = [...this.props.selection];
        newSelection.splice(newSelection.indexOf(username), 1);
        this.props.updateSelection(newSelection);
    }

    handleUncheckedClick(username) {
        const newSelection = [...this.props.selection];
        newSelection.push(username);
        this.props.updateSelection(newSelection);
    }

    render() {
        const styles = {
            card: {
                backgroundColor: 'whitesmoke',
                marginBottom: '10px',
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
            groupSelect: {
                fontSize: '14px',
                color: '#707274',
                flex: '0 0 auto',
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

        // Assume no members of group are shared to start
        let groupIcon = <CheckBoxOutline style={styles.checkIcon} onClick={this.handleCheckAll} />;

        // All of the selected users, accross all groups
        const selectedTotal = this.props.selection.length;
        // All of the users in this group
        const inGroupTotal = this.props.group.members.length;
        // All of the users in this group and in the selected users
        const selectedInGroupTotal = this.props.selection.filter(selection => (
            this.props.group.members.includes(selection)
        )).length;

        if (selectedTotal) {
            // if some users are selected we need to check if they are in this group
            if (inGroupTotal === selectedInGroupTotal) {
                // if all of the group are in the selection show the checked icon
                groupIcon = <CheckBox style={styles.checkIcon} onClick={this.handleUncheckAll} />;
            } else if (selectedInGroupTotal > 0) {
                // If only some of the group are in the selection show the indeterminate icon
                groupIcon = <IndeterminateIcon style={styles.checkIcon} onClick={this.handleUncheckAll} />;
            }
        }

        return (
            <Card
                key={this.props.group.id}
                expanded={this.state.expanded}
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
            >
                <CardHeader
                    title={
                        <div style={{ display: 'flex' }}>
                            <div style={styles.groupText}>
                                <span style={styles.groupName}>
                                    {this.props.group.name}
                                </span>
                                <span style={styles.groupSelect}>
                                    Shared with {selectedInGroupTotal} of {inGroupTotal}
                                </span>
                            </div>
                            <div style={styles.groupIcons}>
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
                    {this.props.group.members.map((member) => {
                        const user = this.props.users.find(propUser => propUser.username === member);
                        return (
                            <div key={user.username} style={{ padding: '6px 34px 0px 0px' }}>
                                <div style={{ display: 'inline-block' }}>
                                    <div><strong>{user.name}</strong></div>
                                    <div>{user.email}</div>
                                </div>
                                { this.props.selection.includes(member) ?
                                    <CheckBox
                                        style={styles.checkIcon}
                                        onClick={() => { this.handleCheckedClick(member); }}
                                    />
                                    :
                                    <CheckBoxOutline
                                        style={styles.checkIcon}
                                        onClick={() => { this.handleUncheckedClick(member); }}
                                    />
                                }
                            </div>
                        );
                    })}
                </CardText>
            </Card>
        );
    }
}

ShareDialogGroup.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
    updateSelection: PropTypes.func.isRequired,
};

export default ShareDialogGroup;
