import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import BaseDialog from '../BaseDialog';
import ShareDialogGroup from './ShareDialogGroup';

export class DataPackShareDialog extends Component {
    constructor(props) {
        super(props);
        props.run.users = ['JaneD', 'JohnD', 'JoeS', 'U1', 'U2']; // JUST FOR NOW WITH NO API
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.updateSelection = this.updateSelection.bind(this);
        this.state = {
            dropDownValue: this.props.run.users.length ? 'custom' : 'all',
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

    render() {
        const styles = {
            fixedHeader: {
                position: 'sticky',
                top: 0,
                left: 0,
                backgroundColor: '#fff',
                zIndex: 15,
                padding: '0px 6px',
            },
            rowHeader: {
                fontSize: '12px',
                padding: '16px 36px 10px 10px',
                color: '#707274',
            },
            dropDownIcon: {
                right: '0px',
                fill: '#4598bf',
                padding: '0px',
                width: '24px',
            },
        };

        const createActions = [
            <RaisedButton
                className="qa-DataPackShareDialog-save"
                style={{ margin: '0px' }}
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ borderRadius: '0px' }}
                backgroundColor="#4598bf"
                disableTouchRipple
                label="SAVE"
                primary={false}
                onClick={this.handleSave}
                disabled={false}
            />,
            <FlatButton
                className="qa-DataPackShareDialog-cancel"
                style={{ margin: '0px', float: 'left' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                backgroundColor="#fff"
                disableTouchRipple
                label="CANCEL"
                onClick={this.props.onClose}
            />,
        ];

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

        const allText = window.innerWidth < 576 ? 'All members and groups' : 'All members and groups can view / edit';
        const customText = window.innerWidth < 576 ? 'Customized permissions' : 'Customized view / edit permissions';

        return (
            <BaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                title="SHARE"
                actions={createActions}
                dialogStyle={{ maxWidth: '500px' }}
                className="qa-DataPackShareDialog"
            >
                <div style={styles.fixedHeader} className="qa-DataPackShareDialog-dropDownContainer">
                    <DropDownMenu
                        value={this.state.dropDownValue}
                        onChange={this.handleDropDownChange}
                        autoWidth={false}
                        style={{ width: '100%' }}
                        labelStyle={{ padding: '0px', color: '#4598bf', textOverflow: 'customoverflow' }}
                        iconStyle={styles.dropDownIcon}
                        underlineStyle={{ margin: '-1px 0px', borderTop: '1px solid #4598bf' }}
                        className="qa-DataPackShareDialog-DropDownMenu-share"
                    >
                        <MenuItem
                            value="all"
                            primaryText={allText}
                            className="qa-DataPackShareDialog-MenuItem-all"
                        />
                        <MenuItem
                            value="custom"
                            primaryText={customText}
                        />
                    </DropDownMenu>
                    {rowHeader}
                </div>
                {groups}
            </BaseDialog>
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
    user: PropTypes.shape({
        username: PropTypes.string,
    }).isRequired,
    run: PropTypes.shape({
        job: PropTypes.shape({ uid: PropTypes.string }),
        users: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
};

export default DataPackShareDialog;
