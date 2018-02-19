import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Divider from 'material-ui/Divider';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import ShareBaseDialog from './ShareBaseDialog';
import ShareDialogGroup from './ShareDialogGroup';

export class DataPackShareDialog extends Component {
    constructor(props) {
        super(props);
        props.run.users = ['JaneD', 'JohnD', 'JoeS', 'U1', 'U2']; // JUST FOR NOW WITH NO API
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.updateSelection = this.updateSelection.bind(this);
        this.toggleView = this.toggleView.bind(this);
        this.state = {
            view: 'groups',
            // set the intial selection state to the 'real' values from API
            originalSelection: this.props.run.users,
            currentSelection: this.props.run.users,
        };
    }

    handleDropDownChange(e, ix, value) {
        this.setState({ dropDownValue: value });
    }

    handleSave() {
        // TODO update with actual saving functionality
        const selectionsAreEqual = this.state.originalSelection.every(user => (
            this.state.currentSelection.includes(user)
        )) && this.state.originalSelection.length === this.state.currentSelection.length;

        if (this.state.dropDownValue === 'all') {
            // All users/groups can see this DataPack.
            // If previous setting was not 'all' we need to make api request
            if (this.state.originalSelection.length !== this.props.users.length) {
                console.log('all is selected and we need to make the api request');
            } else {
                console.log('all is selected but we dont need to update');
            }
        } else {
            // There is a custom selection of users who can see this DataPack.
            // If current selection is not the same as original we need to make api request.
            if (selectionsAreEqual) {
                console.log('custom is selected but we dont need to update');
            } else {
                console.log('custom is selected and we need to update');
            }
        }
        this.props.onSave();
    }

    updateSelection(newSelection) {
        this.setState({ currentSelection: newSelection });
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
            rowHeader: {
                fontSize: '12px',
                padding: '16px 36px 10px 10px',
                color: '#707274',
            },
        };

        let rowHeader = null;
        let groups = null;

        if (this.state.dropDownValue !== 'all') {
            rowHeader = (
                <div style={styles.rowHeader} className="qa-DataPackShareDialog-rowHeader">
                    <span>GROUP</span>
                    <span style={{ float: 'right' }}>SHARED</span>
                </div>
            );

            groups = (
                this.props.groups.filter(group => (group.administrators.includes(this.props.user.username))).map(group => (
                    <ShareDialogGroup
                        key={group.id}
                        group={group}
                        users={this.props.users}
                        selection={this.state.currentSelection}
                        updateSelection={this.updateSelection}
                        className="qa-DataPackShareDialog-ShareDialogGroup"
                    />
                ))
            );
        }

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
                        style={{ display: 'flex' }}
                    >
                        <RaisedButton
                            label={`GROUPS (${this.props.selectedGroups.length})`}
                            style={styles.groupsButton}
                            labelColor={this.state.view === 'groups' ? '#fff' : '#4598bf'}
                            backgroundColor={this.state.view === 'groups' ? '#4598bf' : 'whitesmoke'}
                            onClick={this.toggleView}
                        />
                        <RaisedButton
                            label={`MEMBERS (${this.props.selectedUsers.length})`}
                            style={styles.membersButton}
                            labelColor={this.state.view === 'members' ? '#fff' : '#4598bf'}
                            backgroundColor={this.state.view === 'members' ? '#4598bf' : 'whitesmoke'}
                            onClick={this.toggleView}
                        />
                    </div>
                    <div style={{ height: '2px', width: '100%', backgroundColor: '#4598bf' }} />
                    {rowHeader}
                </div>
                {groups}
            </ShareBaseDialog>
        );
    }
}

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
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedGroups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    selectedUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
    user: PropTypes.shape({
        username: PropTypes.string,
    }).isRequired,
    run: PropTypes.shape({
        job: PropTypes.shape({ uid: PropTypes.string }),
        users: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
};

export default DataPackShareDialog;
