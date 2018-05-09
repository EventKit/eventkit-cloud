import React, { Component, PropTypes } from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';
import Checked from 'material-ui/svg-icons/toggle/check-box';
import Unchecked from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Clear from 'material-ui/svg-icons/content/clear';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import ArrowUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import Indeterminate from '../../icons/IndeterminateIcon';
import { isViewportS } from '../../../utils/viewport';
import CustomTextField from '../../CustomTextField';
import CustomScrollbar from '../../CustomScrollbar';

export class AddMembersDialog extends Component {
    constructor(props) {
        super(props);
        this.getEnabledCheckbox = this.getEnabledCheckbox.bind(this);
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
        this.toggleSort = this.toggleSort.bind(this);
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            sort: 'name',
            search: '',
            selection: [],
            tab: 0,
            mobile: isViewportS(),
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    getEnabledCheckbox(group) {
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
        const disabled = [];
        const enabled = [];
        groups.forEach((group) => {
            const isEveryUserInGroup = users.every(user =>
                group.members.indexOf(user.user.username) > -1);
            if (isEveryUserInGroup) {
                disabled.push(group);
            } else {
                enabled.push(group);
            }
        });
        return [enabled, disabled];
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

    sortGroups(groups, sort) {
        console.log('sorting', sort);
        let modifier = 1;
        if (sort.includes('-')) {
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

    toggleSort() {
        const { sort } = this.state;
        if (sort.includes('-')) {
            this.setState({ sort: 'name' });
        } else {
            this.setState({ sort: '-name' });
        }
    }

    render() {
        const styles = {

            dialog: {
                width: 'calc(100% - 32px)',
                height: '100%',
                minWidth: '325px',
                maxWidth: '650px',
                transform: `translate(0px, ${this.state.mobile ? 16 : 64}px)`,
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
                padding: '12px 12px 12px 0px',
                fontSize: '14px',
            },
            arrow: {
                height: '28px',
                verticalAlign: 'top',
            },
            unassigned: {
                color: '#707274',
                display: 'flex',
                flex: '0 0 auto',
                width: 'auto',
                borderBottom: this.state.tab === 0 ? '2px solid #4598bf' : '2px #ddd solid',
            },
            assigned: {
                color: '#707274',
                display: 'flex',
                flex: '1 1 auto',
                width: 'auto',
                borderBottom: this.state.tab === 1 ? '2px solid #4598bf' : '2px #ddd solid',
            },
        };

        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }

        if (this.state.sort) {
            groups = this.sortGroups(groups, this.state.sort);
        }

        const [enabled, disabled] = this.getGroupSplit(groups, this.props.selectedUsers);

        const headerCheckbox = this.getHeaderCheckbox(enabled.length, this.state.selection.length);

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

        const sort = (
            <EnhancedButton
                onClick={this.toggleSort}
                style={{ padding: '0px 10px' }}
                
            >
                NAME
                {this.state.sort.includes('-') ?
                    <ArrowUp style={styles.arrow} />
                    :
                    <ArrowDown style={styles.arrow} />
                }
            </EnhancedButton>
        );

        const actions = [
            <RaisedButton
                className="qa-ShareBaseDialog-save"
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
                className="qa-ShareBaseDialog-cancel"
                style={{ margin: '0px', float: 'left' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                backgroundColor="#fff"
                disableTouchRipple
                label="CANCEL"
                onClick={this.handleClose}
            />,
        ];

        const title = (
            <div className="qa-ShareBaseDialog-title">
                <strong>EDIT GROUP ASSIGNMENTS</strong>
                <Clear style={styles.clear} onClick={this.handleClose} />
            </div>
        );

        return (
            <Dialog
                className="qa-AddMembersDialog-Dialog"
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
            >
                <p style={{ marginBottom: '20px' }}>
                    <strong>You may only assign members to existing groups here one time.</strong>
                     To edit a group member assignment, you must go to the desired group.
                     You may view user assigned groups below.
                </p>
                <Tabs
                    value={this.state.tab}
                    onChange={this.handleTabChange}
                    inkBarStyle={{ display: 'none', backgroundColor: '#4598bf' }}
                    tabItemContainerStyle={{ backgroundColor: '#fff' }}
                >
                    <Tab
                        label="UNASSIGNED"
                        value={0}
                        style={styles.unassigned}
                        buttonStyle={{ height: '36px', padding: '0px 32px' }}
                    >
                        {searchbar}
                        <div style={styles.header}>
                            <div style={{ flex: '1 1 auto' }}>
                                {sort}
                            </div>
                            <div style={{ flex: '0 0 auto', margin: '0px 10px' }}>{`(${this.state.selection.length}) ASSIGNED`}</div>
                            <div style={{ flex: '0 0 auto', justifyContent: 'flex-end', height: '28px' }}>
                                {headerCheckbox}
                            </div>
                        </div>
                        <CustomScrollbar
                            style={{ height: this.state.mobile ? window.innerHeight - 500 + 43 : window.innerHeight - 596 + 43 }}
                        >
                            {enabled.map(group => (
                                <div
                                    key={group.name}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        backgroundColor: 'whitesmoke',
                                        alignItems: 'center',
                                        padding: '12px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    <div style={{ flex: '1 1 auto', fontWeight: 800, color: '#000' }}>{group.name}</div>
                                    {this.getEnabledCheckbox(group)}
                                </div>
                            ))}
                        </CustomScrollbar>
                    </Tab>
                    <Tab
                        label="ASSIGNED"
                        value={1}
                        style={styles.assigned}
                        buttonStyle={{ height: '36px', padding: '0px 32px', alignItems: 'flex-start' }}
                    >
                        {searchbar}
                        <div style={styles.header}>
                            <div style={{ flex: '1 1 auto' }}>
                                {sort}
                            </div>
                            <div style={{ flex: '0 0 auto', margin: '0px 10px' }}>{`(${disabled.length}) ASSIGNED`}</div>
                            <div style={{ flex: '0 0 auto', justifyContent: 'flex-end', height: '28px' }}>
                                <Checked style={{ height: '28px', width: '28px', fill: '#9d9d9d' }} />
                            </div>
                        </div>
                        <CustomScrollbar
                            style={{ height: this.state.mobile ? window.innerHeight - 500 + 43 : window.innerHeight - 596 + 43 }}
                        >
                            {disabled.map(group => (
                                <div
                                    key={group.name}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        backgroundColor: 'whitesmoke',
                                        alignItems: 'center',
                                        padding: '12px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    <div style={{ flex: '1 1 auto', fontWeight: 800, color: '#000' }}>{group.name}</div>
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
