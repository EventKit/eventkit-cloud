import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import ButtonBase from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Clear from '@material-ui/icons/Clear';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import Indeterminate from '../../icons/IndeterminateIcon';
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
        };
    }

    componentDidMount() {
        // typically setState should not be called in componentDidMount since it will cause the component to
        // render twice. However this is necessary since we need to measure a element to determine the proper height
        // for another element.(Requires two render cycles)
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState(this.getInitialState());
    }

    getUnassignedCheckbox(group) {
        const checkbox = { height: '28px', width: '28px', cursor: 'pointer' };
        if (this.state.selection.indexOf(group) > -1) {
            return <Checked style={checkbox} onClick={() => { this.handleUncheck(group); }} color="primary" />;
        }
        return <Unchecked style={checkbox} onClick={() => { this.handleCheck(group); }} color="primary" />;
    }

    getHeaderCheckbox(groupCount, selectedCount) {
        const checkbox = {
            height: '28px',
            width: '28px',
            cursor: 'pointer',
            fill: '#4598bf',
        };
        if (groupCount === selectedCount) {
            return <Checked style={checkbox} onClick={this.handleDeselectAll} color="primary" />;
        } else if (selectedCount > 0) {
            return <Indeterminate style={checkbox} onClick={this.handleSelectAll} color="primary" />;
        }
        return <Unchecked style={checkbox} onClick={this.handleSelectAll} color="primary" />;
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

    handleTabChange(e, tab) {
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
                height: 'calc(100% - 32px)',
                minWidth: '325px',
                maxWidth: '650px',
                maxHeight: '100%',
                margin: 'auto',
            },
            title: {
                lineHeight: '32px',
                fontSize: '18px',
            },
            actions: {
                margin: '20px 24px 24px',
                justifyContent: 'space-between',
            },
            clear: {
                float: 'right',
                fill: '#4598bf',
                cursor: 'pointer',
            },
            textField: {
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
                fontSize: '14px',
                maxWidth: '175px',
                flex: '1 1 auto',
                minHeight: '36px',
                height: '36px',
            },
            assignedTab: {
                color: '#707274',
                fontSize: '14px',
                maxWidth: '175px',
                flex: '1 1 auto',
                minHeight: '36px',
                height: '36px',
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
            tabIndicator: {
                left: 0,
                width: '100%',
                backgroundColor: '#e5e5e5',
                zIndex: -2,
            },
        };

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
                placeholder="Search"
                onChange={this.handleSearchInput}
                value={this.state.search}
                style={styles.textField}
                InputProps={{ style: { paddingLeft: '16px', lineHeight: '36px', fontSize: '14px' }, disableUnderline: true }}
                charsRemainingStyle={styles.characterLimit}
            />
        );

        const sortName = label => (
            <ButtonBase
                onClick={this.toggleSortName}
                style={{
                    padding: '0px 10px',
                    color: this.state.sort.includes('name') ? '#4598bf' : '#707274',
                }}
                className="qa-AddMembersDialog-sortName"
            >
                {label}
                {this.state.sort === '-name' ?
                    <ArrowUp style={styles.arrow} />
                    :
                    <ArrowDown style={styles.arrow} />
                }
            </ButtonBase>
        );

        const sortSelected = (
            <ButtonBase
                onClick={this.toggleSortSelected}
                style={{
                    padding: '0px 10px',
                    color: this.state.sort.includes('selected') ? '#4598bf' : '#707274',
                }}
                className="qa-AddMembersDialog-sortSelected"
            >
                {this.state.sort === '-selected' ?
                    <ArrowUp style={styles.arrow} />
                    :
                    <ArrowDown style={styles.arrow} />
                }
                {`(${this.state.selection.length}) SELECTED`}
            </ButtonBase>
        );

        const actions = [
            <Button
                className="qa-AddMembersDialog-cancel"
                onClick={this.handleClose}
                variant="flat"
                color="primary"
            >
                CANCEL
            </Button>,
            <Button
                className="qa-AddMembersDialog-save"
                onClick={this.handleSave}
                variant="contained"
                color="primary"
            >
                SAVE
            </Button>,
        ];

        // calculate the height for our scrollbars
        // the dialog has a max height slightly smaller than window height
        const margin = 32;
        const titleHeight = 76;
        const tabHeight = 36;
        const searchHeight = 56;
        const sortHeight = 49;
        let infoHeight = 20;
        // we need to get the info paragraph height since it change change with screen size
        if (this.infoP) {
            infoHeight += this.infoP.clientHeight;
        }
        const footerHeight = 80;

        // subract the sum of heights from our total window height to get the needed scrollbar height
        const scrollbarHeight = window.innerHeight - (
            margin + titleHeight + tabHeight + searchHeight + infoHeight + sortHeight + footerHeight + 20
        );

        const { classes } = this.props;

        return (
            <Dialog
                className="qa-AddMembersDialog"
                PaperProps={{ style: styles.dialog }}
                open={this.props.show}
                onClose={this.handleClose}
                title="ADD TO EXISTING GROUPS"
                style={{ zIndex: 1501 }}
                maxWidth={false}
                ref={(input) => { this.dialog = input; }}
            >
                <DialogTitle disableTypography style={styles.title}>
                    <div className="qa-AddMembersDialog-title">
                        <strong>ADD TO EXISTING GROUPS</strong>
                        <Clear style={styles.clear} color="primary" onClick={this.props.onClose} />
                    </div>
                </DialogTitle>
                <DialogContent style={{ padding: '0px 24px' }}>
                    <p
                        ref={this.infoPRef}
                        style={{ marginBottom: '20px', color: '#707274' }}
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
                        style={{ height: '36px', minHeight: '36px' }}
                        TabIndicatorProps={{ style: styles.tabIndicator }}
                        className="qa-AddMembersDialog-Tabs"
                    >
                        <Tab
                            label="AVAILABLE GROUPS"
                            value={0}
                            style={styles.unassignedTab}
                            className="qa-AddMembersDialog-Tab-unassigned"
                            classes={{ label: classes.label, labelContainer: classes.labelContainer, selected: classes.selected }}
                        />
                        <Tab
                            label="ALREADY IN GROUPS"
                            value={1}
                            style={styles.assignedTab}
                            className="qa-AddMembersDialog-Tab-assigned"
                            classes={{ label: classes.label, labelContainer: classes.labelContainer, selected: classes.selected }}
                        />
                    </Tabs>
                    {searchbar}
                    {this.state.tab === 0 ?
                        <React.Fragment>
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
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <div style={styles.header} className="qa-AddMembersDialog-assignedHeader">
                                <div style={{ flex: '1 1 auto' }}>
                                    {sortName(`GROUP ASSIGNMENTS (${assigned.length})`)}
                                </div>
                                <div style={{ flex: '0 0 auto', justifyContent: 'flex-end', height: '28px' }}>
                                    <span style={{ marginRight: '-24px', color: '#707274' }}>(View Only)</span>
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
                        </React.Fragment>
                    }
                </DialogContent>
                <DialogActions style={styles.actions}>{actions}</DialogActions>
            </Dialog>
        );
    }
}

const jss = {
    label: {
        fontSize: '14px',
    },
    labelContainer: {
        padding: '6px 0px',
    },
    selected: {
        borderBottom: '2px solid #4598bf',
        transition: 'border-bottom 200ms',
    },
};

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
    classes: PropTypes.object.isRequired,
};

export default withStyles(jss)(AddMembersDialog);
