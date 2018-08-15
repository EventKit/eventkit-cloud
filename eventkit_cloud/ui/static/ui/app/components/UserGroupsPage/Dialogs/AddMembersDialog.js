import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Clear from '@material-ui/icons/Clear';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import Indeterminate from '../../icons/IndeterminateIcon';
import { isViewportS } from '../../../utils/viewport';
import CustomTextField from '../../CustomTextField';
import CustomScrollbar from '../../CustomScrollbar';

export class AddMembersDialog extends Component {
    constructor(props) {
        super(props);
        this.getUnassignedCheckbox = this.getUnassignedCheckbox.bind(this);
        this.getHeaderCheckbox = this.getHeaderCheckbox.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleTabChange = this.handleTabChange.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleUncheck = this.handleUncheck.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleDeselectAll = this.handleDeselectAll.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.toggleSortName = this.toggleSortName.bind(this);
        this.toggleSortSelected = this.toggleSortSelected.bind(this);
        this.infoPRef = this.infoPRef.bind(this);
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            // possible sort values: ['name', '-name', 'selected', '-selected'];
            sort: 'name',
            search: '',
            selection: [],
            tab: 0,
            mobile: isViewportS(),
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);

        // typically setState should not be called in componentDidMount since it will cause the component to
        // render twice. However this is necessary since we need to measure a element to determine the proper height
        // for another element.(Requires two render cycles)
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState(this.getInitialState());
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    getUnassignedCheckbox(group) {
        const checkbox = { height: '28px', width: '28px', cursor: 'pointer' };
        if (this.state.selection.indexOf(group) > -1) {
            return <Checked style={checkbox} onClick={() => { this.handleUncheck(group); }} />;
        }
        return <Unchecked style={checkbox} onClick={() => { this.handleCheck(group); }} />;
    }

    getHeaderCheckbox(groupCount, selectedCount) {
        const checkbox = { height: '28px', width: '28px', cursor: 'pointer' };
        if (groupCount === selectedCount) {
            return <Checked style={checkbox} onClick={this.handleDeselectAll} />;
        } else if (selectedCount > 0) {
            return <Indeterminate style={checkbox} onClick={this.handleSelectAll} />;
        }
        return <Unchecked style={checkbox} onClick={this.handleSelectAll} />;
    }

    getGroupSplit(groups, users) {
        const assigned = [];
        const unassigned = [];
        groups.forEach((group) => {
            const isEveryUserInGroup = users.every(user =>
                group.members.indexOf(user.user.username) > -1);
            if (isEveryUserInGroup) {
                assigned.push(group);
            } else {
                unassigned.push(group);
            }
        });
        return [unassigned, assigned];
    }

    handleSave() {
        this.setState(this.getInitialState());
        this.props.onSave(this.state.selection, this.props.selectedUsers);
    }

    handleClose() {
        this.setState(this.getInitialState());
        this.props.onClose();
    }

    handleTabChange(tab) {
        this.setState({ tab, search: '', sort: 'name' });
    }

    handleCheck(group) {
        const { selection } = this.state;
        selection.push(group);
        this.setState({ selection });
    }

    handleUncheck(group) {
        const { selection } = this.state;
        selection.splice(selection.indexOf(group), 1);
        this.setState({ selection });
    }

    handleSearchInput(e) {
        this.setState({ search: e.target.value });
    }

    handleSelectAll() {
        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }
        const selection = this.getGroupSplit(groups, this.props.selectedUsers)[0];
        this.setState({ selection });
    }

    handleDeselectAll() {
        this.setState({ selection: [] });
    }

    handleResize() {
        if (this.state.mobile !== isViewportS()) {
            this.setState({ mobile: !this.state.mobile });
        }
    }

    searchGroups(groups, search) {
        const SEARCH = search.toUpperCase();
        return groups.filter(group => group.name.toUpperCase().includes(SEARCH));
    }

    sortGroupNames(groups, sort) {
        let modifier = 1;
        if (sort === '-name') {
            modifier = -1;
        }
        return groups.sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();
            if (nameA < nameB) return -1 * modifier;
            if (nameA > nameB) return 1 * modifier;
            return 0;
        });
    }

    sortGroupSelected(groups, sort, selection) {
        let modifier = 1;
        if (sort === '-selected') {
            modifier = -1;
        }
        return groups.sort((a, b) => {
            const aSelected = !!selection.find(s => s.id === a.id);
            const bSelected = !!selection.find(s => s.id === b.id);
            if (aSelected && !bSelected) return -1 * modifier;
            if (!aSelected && bSelected) return 1 * modifier;
            return 0;
        });
    }

    toggleSortName() {
        const { sort } = this.state;
        if (sort === 'name') {
            this.setState({ sort: '-name' });
        } else {
            this.setState({ sort: 'name' });
        }
    }

    toggleSortSelected() {
        const { sort } = this.state;
        if (sort === 'selected') {
            this.setState({ sort: '-selected' });
        } else {
            this.setState({ sort: 'selected' });
        }
    }

    infoPRef(element) {
        if (this.infoP === element) {
            return;
        }

        this.infoP = element;
        this.setState(this.getInitialState());
    }

    render() {
        const styles = {
            dialog: {
                width: 'calc(100% - 32px)',
                height: '100%',
                minWidth: '325px',
                maxWidth: '650px',
            },
            title: {
                padding: '25px',
                fontWeight: 'none',
                fontSize: '18px',
            },
            body: {
                padding: '0px 25px',
                maxHeight: '100%',
            },
            actions: {
                padding: '25px',
            },
            clear: {
                float: 'right',
                fill: '#4598bf',
                cursor: 'pointer',
            },
            label: {
                color: 'whitesmoke',
                fontWeight: 'bold',
            },
            button: {
                backgroundColor: '#4598bf',
                borderRadius: '0px',
            },
            textField: {
                fontSize: '14px',
                backgroundColor: 'whitesmoke',
                height: '36px',
                lineHeight: '36px',
                margin: '15px 0px 5px',
            },
            characterLimit: {
                bottom: '0px',
                height: '100%',
                display: 'flex',
                transform: 'none',
                alignItems: 'center',
                fontSize: '14px',
            },
            header: {
                display: 'flex',
                width: '100%',
                lineHeight: '28px',
                alignItems: 'center',
                padding: '12px 48px 8px 0px',
                fontSize: '14px',
            },
            arrow: {
                height: '28px',
                width: '28px',
                verticalAlign: 'top',
            },
            unassignedTab: {
                color: '#707274',
                maxWidth: '175px',
                flex: '1 1 auto',
                borderBottom: this.state.tab === 0 ?
                    '2px solid #4598bf' : '2px #ddd solid',
            },
            assignedTab: {
                color: '#707274',
                maxWidth: '175px',
                flex: '1 1 auto',
                borderBottom: this.state.tab === 1 ?
                    '2px solid #4598bf' : '2px #ddd solid',
            },
            tabButton: {
                height: '36px',
                padding: '0px 32px',
            },
            row: {
                display: 'flex',
                width: '100%',
                backgroundColor: 'whitesmoke',
                alignItems: 'center',
                padding: '12px 48px 12px 24px',
                marginBottom: '10px',
            },
            name: {
                flex: '1 1 auto',
                fontWeight: 800,
                color: '#000',
            },
        };

        if (this.state.mobile) {
            styles.dialog.transform = 'translate(0px, 16px)';
        }

        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }
        groups = this.sortGroupNames(groups, this.state.sort);

        if (this.state.sort.includes('selected')) {
            groups = this.sortGroupSelected(groups, this.state.sort, this.state.selection);
        }

        const [unassigned, assigned] = this.getGroupSplit(groups, this.props.selectedUsers);

        const searchbar = (
            <CustomTextField
                className="qa-AddMembersDialog-search"
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
        );

        const sortName = label => (
            <EnhancedButton
                onClick={this.toggleSortName}
                style={{
                    padding: '0px 10px',
                    color: this.state.sort.includes('name') ? '#4598bf' : 'inherit',
                }}
                className="qa-AddMembersDialog-sortName"
            >
                {label}
                {this.state.sort === '-name' ?
                    <ArrowUp style={styles.arrow} />
                    :
                    <ArrowDown style={styles.arrow} />
                }
            </EnhancedButton>
        );

        const sortSelected = (
            <EnhancedButton
                onClick={this.toggleSortSelected}
                style={{
                    padding: '0px 10px',
                    color: this.state.sort.includes('selected') ? '#4598bf' : 'inherit',
                }}
                className="qa-AddMembersDialog-sortSelected"
            >
                {this.state.sort === '-selected' ?
                    <ArrowUp style={styles.arrow} />
                    :
                    <ArrowDown style={styles.arrow} />
                }
                {`(${this.state.selection.length}) SELECTED`}
            </EnhancedButton>
        );

        const actions = [
            <RaisedButton
                className="qa-AddMembersDialog-save"
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
                className="qa-AddMembersDialog-cancel"
                style={{ margin: '0px', float: 'left' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                backgroundColor="#fff"
                disableTouchRipple
                label="CANCEL"
                onClick={this.handleClose}
            />,
        ];

        const title = (
            <div className="qa-AddMembersDialog-title">
                <strong>ADD TO EXISTING GROUPS</strong>
                <Clear style={styles.clear} onClick={this.handleClose} />
            </div>
        );

        // calculate the height for our scrollbars //
        // the dialog has a max height slightly smaller than window height
        const reducedHeight = this.state.mobile ? 60 : 135;
        const titleHeight = 82;
        const tabHeight = 40;
        const searchHeight = 56;
        const sortHeight = 48;
        let infoHeight = 0;
        // we need to get the info paragraph height since it change change with screen size
        if (this.infoP) {
            infoHeight = this.infoP.clientHeight;
        }
        const footerHeight = 86;

        // subract the sum of heights from our total window height to get the needed scrollbar height
        const scrollbarHeight = window.innerHeight - (
            reducedHeight + titleHeight + tabHeight + searchHeight + infoHeight + sortHeight + footerHeight + 18
        );

        return (
            <Dialog
                className="qa-AddMembersDialog"
                contentStyle={styles.dialog}
                bodyStyle={styles.body}
                actions={actions}
                style={{ paddingTop: '0px' }}
                modal
                open={this.props.show}
                onRequestClose={this.handleClose}
                title={title}
                titleStyle={styles.title}
                actionsContainerStyle={styles.actions}
                autoDetectWindowHeight={false}
                repositionOnUpdate={false}
                ref={(input) => { this.dialog = input; }}
            >
                <p
                    ref={this.infoPRef}
                    style={{ marginBottom: '20px' }}
                    className="qa-AddMembersDialog-description"
                >
                    <strong>You can add selected members to the groups listed in the &apos;AVAILABLE GROUPS&apos; tab.</strong>
                    &nbsp;For additional reference, groups that already contain those selected members are listed in
                    the &apos;ALREADY IN GROUPS&apos; tab.
                    &nbsp;To make further edits, go to the individual group on the Members and Groups page.
                </p>
                <Tabs
                    value={this.state.tab}
                    onChange={this.handleTabChange}
                    inkBarStyle={{ backgroundColor: '#ddd', width: '100%', left: '0%' }}
                    tabItemContainerStyle={{ backgroundColor: '#fff' }}
                    className="qa-AddMembersDialog-Tabs"
                >
                    <Tab
                        label="AVAILABLE GROUPS"
                        value={0}
                        style={styles.unassignedTab}
                        buttonStyle={styles.tabButton}
                        className="qa-AddMembersDialog-Tab-unassigned"
                    >
                        {searchbar}
                        <div style={styles.header} className="qa-AddMembersDialog-unassignedHeader">
                            <div style={{ flex: '1 1 auto' }}>
                                {sortName('NAME')}
                            </div>
                            {sortSelected}
                            <div style={{ flex: '0 0 auto', justifyContent: 'flex-end', height: '28px' }}>
                                {this.getHeaderCheckbox(unassigned.length, this.state.selection.length)}
                            </div>
                        </div>
                        <CustomScrollbar
                            style={{ height: scrollbarHeight }}
                        >
                            {unassigned.map(group => (
                                <div
                                    key={group.name}
                                    style={styles.row}
                                    className="qa-AddMembersDialog-unassignedRow"
                                >
                                    <div style={styles.name}>{group.name}</div>
                                    {this.getUnassignedCheckbox(group)}
                                </div>
                            ))}
                        </CustomScrollbar>
                    </Tab>
                    <Tab
                        label="ALREADY IN GROUPS"
                        value={1}
                        style={styles.assignedTab}
                        buttonStyle={styles.tabButton}
                        className="qa-AddMembersDialog-Tab-assigned"
                    >
                        {searchbar}
                        <div style={styles.header} className="qa-AddMembersDialog-assignedHeader">
                            <div style={{ flex: '1 1 auto' }}>
                                {sortName(`GROUP ASSIGNMENTS (${assigned.length})`)}
                            </div>
                            <div style={{ flex: '0 0 auto', justifyContent: 'flex-end', height: '28px' }}>
                                <span style={{ marginRight: '-24px' }}>(View Only)</span>
                            </div>
                        </div>
                        <CustomScrollbar
                            style={{ height: scrollbarHeight }}
                        >
                            {assigned.map(group => (
                                <div
                                    className="qa-AddMembersDialog-assignedRow"
                                    key={group.name}
                                    style={styles.row}
                                >
                                    <div style={styles.name}>{group.name}</div>
                                    <Checked style={{ height: '28px', width: '28px', fill: '#9d9d9d' }} />
                                </div>
                            ))}
                        </CustomScrollbar>
                    </Tab>
                </Tabs>
            </Dialog>
        );
    }
}

AddMembersDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    selectedUsers: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            last_login: PropTypes.string,
            date_joined: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
};

export default AddMembersDialog;
