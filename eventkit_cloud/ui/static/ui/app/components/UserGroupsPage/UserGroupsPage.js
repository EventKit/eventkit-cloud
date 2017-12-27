import React, { Component, PropTypes } from 'react';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';
import DropDownMenu from 'material-ui/DropDownMenu';
import IconMenu from 'material-ui/IconMenu';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import MoreHorizIcon from 'material-ui/svg-icons/navigation/more-horiz';
import IndeterminateIcon from 'material-ui/svg-icons/toggle/indeterminate-check-box';
import NavigationMenu from 'material-ui/svg-icons/navigation/menu';
import CustomScrollbar from '../CustomScrollbar';

export class UserGroupsPage extends Component {
    constructor(props) {
        super(props);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleIndividualSelect = this.handleIndividualSelect.bind(this);
        this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.state = {
            drawerOpen: !(window.innerWidth < 768),
            selected: [],
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            sort: 1,
        };
    }

    componentDidMount() {
        
    }

    toggleDrawer() {
        this.setState({ drawerOpen: !this.state.drawerOpen });
    }

    handleSelectAll(selected) {
        if (selected === 'all') {
            // if all are selected we need to set selected state to an array containing all table indices
            const allIndices = Array.from(new Array(this.state.values.length), (val, ix) => ix);
            this.setState({ selected: allIndices });
        } else {
            // if all are deselected we need to set selected to an empty array
            this.setState({ selected: [] });
        }
    }

    handleIndividualSelect(selected) {
        // update the state with all selected indices
        this.setState({ selected });
    }

    handleSearchKeyDown(event) {
        if (event.key === 'Enter') {
            const text = event.target.value || '';
            console.log(text);
        }
    }

    handleSearchChange(event, value) {
        const text = value || '';
        console.log(text);
    }

    handleSortChange(e, ix, val) {
        this.setState({ sort: val });
    }

    render() {
        const mobile = window.innerWidth < 768;
        const bodyWidth = this.state.drawerOpen && !mobile ? 'calc(100% - 250px)' : '100%';
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                padding: '0px 10px 0px 30px',
            },
            headerTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px',
            },
            button: {
                margin: '0px',
                minWidth: '50px',
                height: '35px',
                borderRadius: '0px',
            },
            label: {
                fontSize: '12px',
                paddingLeft: '20px',
                paddingRight: '20px',
                lineHeight: '35px',
            },
            body: {
                position: 'relative',
                left: 0,
                height: window.innerHeight - 130,
                width: bodyWidth,
                overflowY: 'hidden',
            },
            bodyContent: {
                // padding: '0px 34px 30px',
                paddingBottom: '30px',
                maxWidth: '1000px',
                margin: 'auto',
                position: 'relative',
            },
            drawer: {
                backgroundColor: '#fff',
                top: '130px',
                height: window.innerHeight - 130,
                overflowY: 'hidden',
                overflowX: 'hidden',
            },
            drawerButton: {
                fill: 'white',
                height: '35px',
                marginLeft: '15px',
                cursor: 'pointer',
            },
            fixedHeader: {
                width: 'inherit',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 3,
                paddingTop: 20,
                backgroundColor: '#fff',
            },
            container: {
                color: 'white',
                height: '36px',
                width: 'calc(100% - 48px)',
                backgroundColor: '#eee',
                lineHeight: '36px',
                margin: '0px 24px 10px',
            },
            hint: {
                color: '#5a5a5a',
                height: '36px',
                lineHeight: 'inherit',
                bottom: '0px',
                paddingLeft: '10px',
            },
            input: {
                color: '#707274',
                paddingLeft: '10px',
            },
            underline: {
                borderBottom: '1px solid #4498c0',
                bottom: '0px',
            },
            underlineFocus: {
                borderBottom: '2px solid #4498c0',
                bottom: '0px',
            },
            tableRow: {
                height: '56px',
            },
            tableRowColumn: {
                color: '#707274',
                fontSize: '14px',
            },
        };

        this.context.muiTheme.checkbox.boxColor = '#4598bf';
        this.context.muiTheme.checkbox.checkedColor = '#4598bf';
        this.context.muiTheme.tableRow.selectedColor = 'initial';

        const rows = [];
        for (let i = 0; i < 20; i++) {
            rows.push(
                <TableRow key={`key-number-${i}`} style={styles.tableRow} selected={this.state.selected.includes(i)}>
                    <TableRowColumn style={styles.tableRowColumn}>
                        <div>
                            <div style={{ display: 'inline-block' }}>
                                <div>
                                    <strong>{i} Luke Rees</strong>
                                </div>
                                <div>
                                    luke.rees@rgi-corp.com
                                </div>
                            </div>
                            <IconMenu
                                style={{ width: 24, height: '40px', margin: '0px 12px', float: 'right' }}
                                iconButtonElement={
                                    <IconButton
                                        style={{ padding: '0px', height: '40px', width: 24 }}
                                        iconStyle={{ color: '#4598bf' }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                }
                                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                            >
                                <MenuItem primaryText="Do this" style={{ fontSize: '14px' }} />
                                <MenuItem primaryText="Do that" style={{ fontSize: '14px' }} />
                                <MenuItem primaryText="Do something else" style={{ fontSize: '14px' }} />
                            </IconMenu>
                        </div>
                    </TableRowColumn>
                </TableRow>);
        }

        return (
            <div style={{ backgroundColor: 'white' }}>
                <AppBar
                    className="qa-UserGroupsPage-AppBar"
                    title="Members and Groups"
                    style={styles.header}
                    titleStyle={styles.headerTitle}
                    showMenuIconButton={false}
                >
                    <RaisedButton
                        className={'qa-UserGroupsPage-RaisedButton-create'}
                        label={"Create Group"}
                        primary={true}
                        labelStyle={styles.label}
                        style={styles.button}
                        buttonStyle={{ borderRadius: '0px', backgroundColor: '#4598bf' }}
                        overlayStyle={{ borderRadius: '0px' }}
                    />
                    <NavigationMenu
                        style={styles.drawerButton}
                        onClick={this.toggleDrawer}
                    />
                </AppBar>
                <div style={styles.body}>
                    <CustomScrollbar style={{ height: window.innerHeight - 130, width: '100%' }}>
                        <div style={styles.bodyContent} className="qa-UserGroupsPage-bodyContent">
                            <div style={styles.fixedHeader}>
                                <TextField
                                    className={'qa-UserGroupsPage-TextField'}
                                    style={styles.container}
                                    hintText={'Search Users'}
                                    hintStyle={styles.hint}
                                    inputStyle={styles.input}
                                    onChange={this.handleSearchChange}
                                    underlineStyle={styles.underline}
                                    underlineFocusStyle={styles.underlineFocus}
                                    onKeyDown={this.handleSearchKeyDown}
                                />
                                <Table
                                    selectable
                                    multiSelectable
                                    onRowSelection={this.handleSelectAll}
                                    allRowsSelected={this.state.selected.length === this.state.values.length}
                                >
                                    <TableHeader
                                        style={{ zIndex: 2 }}
                                        displaySelectAll
                                        adjustForCheckbox
                                        enableSelectAll
                                    >
                                        <TableRow>
                                            <TableHeaderColumn colSpan="1" style={{ color: '#707274', fontSize: '14px' }}>
                                                <div>
                                                    <strong>{this.state.selected.length} Selected</strong>
                                                    <IconMenu
                                                        style={{ width: 24, height: '100%', margin: '0px 12px' }}
                                                        iconButtonElement={
                                                            <IconButton
                                                                style={{ padding: '0px', height: 24, width: 24, verticalAlign: 'middle' }}
                                                                iconStyle={{ color: '#4598bf' }}
                                                            >
                                                                <MoreHorizIcon />
                                                            </IconButton>
                                                        }
                                                        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                                                        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                                                    >
                                                        <MenuItem primaryText="Do this" style={{ fontSize: '14px' }} />
                                                        <MenuItem primaryText="Do that" style={{ fontSize: '14px' }} />
                                                        <MenuItem primaryText="Do something else" style={{ fontSize: '14px' }} />
                                                    </IconMenu>
                                                    <DropDownMenu
                                                        value={this.state.sort}
                                                        onChange={this.handleSortChange}
                                                        style={{ height: '24px', fontSize: '14px', margin: '0px 12px', float: 'right' }}
                                                        labelStyle={{ height: '24px', lineHeight: '24px', padding: '0px', display: 'inline-block', color: '#4598bf' }}
                                                        iconStyle={{ padding: '0px', height: '24px', width: '24px', position: 'relative', right: '0', top: '0px', border: 'none', fill: '#4598bf' }}
                                                        underlineStyle={{ display: 'none' }}
                                                        menuItemStyle={{ color: '#707274' }}
                                                        selectedMenuItemStyle={{ color: '#4598bf' }}
                                                        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                                                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                                                    >
                                                        <MenuItem value={1} primaryText="Sort By" />
                                                        <MenuItem value={2} primaryText="Or This One" />
                                                        <MenuItem value={3} primaryText="Another" />
                                                        <MenuItem value={4} primaryText="Last One" />
                                                    </DropDownMenu>
                                                </div>
                                            </TableHeaderColumn>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>
                            <Table
                                selectable
                                multiSelectable
                                onRowSelection={this.handleIndividualSelect}
                                style={{ borderBottom: '1px solid rgb(224, 224, 224)' }}
                            >
                                <TableBody
                                    displayRowCheckbox
                                    showRowHover
                                    deselectOnClickaway={false}
                                >
                                    {rows}
                                </TableBody>
                            </Table>
                        </div>
                    </CustomScrollbar>
                </div>
                <Drawer
                    width={250}
                    openSecondary
                    open={this.state.drawerOpen}
                    containerStyle={styles.drawer}
                >
                    <CustomScrollbar >
                        <Menu desktop>
                            <MenuItem primaryText="All Members (200)" style={{ color: '#4598bf' }} />
                            <MenuItem primaryText="New" style={{ color: '#4598bf' }} />
                            <MenuItem primaryText="Not Grouped" style={{ color: '#4598bf' }} />
                            <MenuItem primaryText="Most Shared" style={{ color: '#4598bf' }} />
                            <span style={{ padding: '20px 24px 5px', color: '#707274', display: 'block' }}>
                                <strong>MY GROUPS</strong>
                            </span>
                            <MenuItem primaryText="Group 1 (10)" style={{ color: '#4598bf' }} />
                            <MenuItem primaryText="Group 2 (20)" style={{ color: '#4598bf' }} />
                            <MenuItem primaryText="Group 3 (10)" style={{ color: '#4598bf' }} />
                            <Divider style={{ marginTop: '20px' }} />
                            <span style={{ padding: '10px 24px 5px', color: '#707274', display: 'block' }}>
                                <strong>SHARED WITH ME</strong>
                            </span>
                            <MenuItem
                                primaryText="Group 1"
                                style={{ color: '#707274', opacity: '0.7' }}
                                disabled
                                rightIcon={<IndeterminateIcon style={{ fill: 'ce4427', width: '17px' }} />}
                            />
                            <MenuItem primaryText="Group 2" style={{ color: '#707274' }} disabled />
                            <MenuItem primaryText="EVENTKIT" style={{ color: '#707274' }} disabled />
                        </Menu>
                    </CustomScrollbar>
                </Drawer>
            </div>
        );
    }
}

UserGroupsPage.contextTypes = {
    muiTheme: PropTypes.object,
};

export default UserGroupsPage;
