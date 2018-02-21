import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import ShareBaseDialog from './ShareBaseDialog';
import GroupsBody from './GroupsBody';
import MembersBody from './MembersBody';

export class DataPackShareDialog extends Component {
    constructor(props) {
        super(props);
        this.handleSave = this.handleSave.bind(this);
        this.toggleView = this.toggleView.bind(this);
        this.state = {
            view: 'groups',
            groups: [...this.props.groups],
            members: [...this.props.members],
            selectedGroups: [...this.props.groups],
            selectedMembers: [...this.props.members],
        };
    }

    handleSave() {
        this.props.onSave();
    }

    toggleView(view) {
        if (view) {
            this.setState({ view });
        }
        if (this.state.view === 'groups') {
            this.setState({ view: 'members' });
        } else {
            this.setState({ view: 'groups' });
        }
    }

    render() {
        const styles = {
            fixedHeader: {
                position: 'sticky',
                top: 0,
                left: 0,
                backgroundColor: '#fff',
                zIndex: 15,
                padding: '0px 10px',
            },
            groupsButton: {
                flex: '1 1 auto',
                borderRadius: '0px',
                backgroundColor: this.state.view === 'groups' ? '#4598bf' : 'whitesmoke',
                boxShadow: 'none',
            },
            membersButton: {
                flex: '1 1 auto',
                borderRadius: '0px',
                backgroundColor: this.state.view === 'members' ? '#4598bf' : 'whitesmoke',
                boxShadow: 'none',
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

        return (
            <ShareBaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                handleSave={this.handleSave}
                className="qa-DataPackShareDialog"
            >
                <div style={styles.fixedHeader} className="qa-DataPackShareDialog-container">
                    <div
                        className="qa-DataPackShareDialog-headers"
                        style={{ display: 'flex', flexWrap: 'wrap' }}
                    >
                        <RaisedButton
                            label={`GROUPS (${this.state.selectedGroups.length})`}
                            style={styles.groupsButton}
                            labelColor={this.state.view === 'groups' ? '#fff' : '#4598bf'}
                            backgroundColor={this.state.view === 'groups' ? '#4598bf' : 'whitesmoke'}
                            onClick={this.toggleView}
                        />
                        <RaisedButton
                            label={`MEMBERS (${this.state.selectedMembers.length})`}
                            style={styles.membersButton}
                            labelColor={this.state.view === 'members' ? '#fff' : '#4598bf'}
                            backgroundColor={this.state.view === 'members' ? '#4598bf' : 'whitesmoke'}
                            onClick={this.toggleView}
                        />
                        <div
                            style={{
                                height: '2px',
                                width: '100%',
                                backgroundColor: '#4598bf',
                                flex: '0 0 auto',
                            }}
                        />
                    </div>
                </div>
                {this.state.view === 'groups' ?
                    <GroupsBody
                        groups={this.props.groups}
                        members={this.props.members}
                        selectedGroups={this.state.selectedGroups}
                        groupsText={this.props.groupsText}
                    />
                    :
                    <MembersBody
                        members={this.props.members}
                        selectedMembers={this.state.selectedMembers}
                        membersText={this.props.membersText}
                    />
                }
            </ShareBaseDialog>
        );
    }
}

DataPackShareDialog.defaultProps = {
    groupsText: '',
    membersText: '',
};

DataPackShareDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    members: PropTypes.arrayOf(PropTypes.object).isRequired,
    // selectedGroups: PropTypes.arrayOf(PropTypes.shape({
    //     id: PropTypes.string,
    //     name: PropTypes.string,
    //     members: PropTypes.arrayOf(PropTypes.string),
    //     administrators: PropTypes.arrayOf(PropTypes.string),
    // })).isRequired,
    // selectedMembers: PropTypes.arrayOf(PropTypes.object).isRequired,
    groupsText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    membersText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
};

export default DataPackShareDialog;
