import * as React from 'react';
import { withStyles, Theme, withTheme, createStyles } from '@material-ui/core/styles';
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

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    label: {
        fontSize: '14px',
    },
    labelContainer: {
        padding: '6px 0px',
    },
    selected: {
        borderBottom: `2px solid ${theme.eventkit.colors.primary}`,
        transition: 'border-bottom 200ms',
    },
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
        fill: theme.eventkit.colors.primary,
        cursor: 'pointer',
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
        color: theme.eventkit.colors.text_primary,
        fontSize: '14px',
        maxWidth: '175px',
        flex: '1 1 auto',
        minHeight: '36px',
        height: '36px',
    },
    assignedTab: {
        color: theme.eventkit.colors.text_primary,
        fontSize: '14px',
        maxWidth: '175px',
        flex: '1 1 auto',
        minHeight: '36px',
        height: '36px',
    },
    row: {
        display: 'flex',
        width: '100%',
        backgroundColor: theme.eventkit.colors.secondary,
        alignItems: 'center',
        padding: '12px 48px 12px 24px',
        marginBottom: '10px',
    },
    name: {
        flex: '1 1 auto',
        fontWeight: 800,
        color: theme.eventkit.colors.black,
    },
    tabIndicator: {
        left: 0,
        width: '100%',
        backgroundColor: theme.eventkit.colors.secondary,
        zIndex: -2,
    },
});

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
    onSave: (groups: Eventkit.Group[], users: Eventkit.User[]) => void;
    groups: Eventkit.Group[];
    selectedUsers: Eventkit.User[];
    classes: { [className: string]: string };
    theme: Eventkit.Theme & Theme;
}

export interface State {
    sort: string;
    search: string;
    selection: Eventkit.Group[];
    tab: number;
}

export class AddMembersDialog extends React.Component<Props, State> {
    private infoP: HTMLElement;
    constructor(props: Props) {
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

    private getUnassignedCheckbox(group: Eventkit.Group) {
        const checkbox = { height: '28px', width: '28px', cursor: 'pointer' };
        if (this.state.selection.indexOf(group) > -1) {
            return <Checked style={checkbox} onClick={() => { this.handleUncheck(group); }} color="primary" />;
        }
        return <Unchecked style={checkbox} onClick={() => { this.handleCheck(group); }} color="primary" />;
    }

    private getHeaderCheckbox(groupCount: number, selectedCount: number) {
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

    private getGroupSplit(groups: Eventkit.Group[], users: Eventkit.User[]) {
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

    private handleSave() {
        this.setState(this.getInitialState());
        this.props.onSave(this.state.selection, this.props.selectedUsers);
    }

    private handleClose() {
        this.setState(this.getInitialState());
        this.props.onClose();
    }

    private handleTabChange(e: React.MouseEvent<HTMLElement>, tab: number) {
        this.setState({ tab, search: '', sort: 'name' });
    }

    private handleCheck(group: Eventkit.Group) {
        const { selection } = this.state;
        selection.push(group);
        this.setState({ selection });
    }

    private handleUncheck(group: Eventkit.Group) {
        const { selection } = this.state;
        selection.splice(selection.indexOf(group), 1);
        this.setState({ selection });
    }

    private handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ search: e.target.value });
    }

    private handleSelectAll() {
        let { groups } = this.props;
        if (this.state.search) {
            groups = this.searchGroups(groups, this.state.search);
        }
        const selection = this.getGroupSplit(groups, this.props.selectedUsers)[0];
        this.setState({ selection });
    }

    private handleDeselectAll() {
        this.setState({ selection: [] });
    }

    private searchGroups(groups: Eventkit.Group[], search: string) {
        const SEARCH = search.toUpperCase();
        return groups.filter(group => group.name.toUpperCase().includes(SEARCH));
    }

    private sortGroupNames(groups: Eventkit.Group[], sort: string) {
        let modifier = 1;
        if (sort === '-name') {
            modifier = -1;
        }
        return groups.sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();
            if (nameA < nameB) {
                return -1 * modifier;
            }
            if (nameA > nameB) {
                return 1 * modifier;
            }
            return 0;
        });
    }

    private sortGroupSelected(groups: Eventkit.Group[], sort: string, selection: Eventkit.Group[]) {
        let modifier = 1;
        if (sort === '-selected') {
            modifier = -1;
        }
        return groups.sort((a, b) => {
            const aSelected = !!selection.find(s => s.id === a.id);
            const bSelected = !!selection.find(s => s.id === b.id);
            if (aSelected && !bSelected) {
                return -1 * modifier;
            }
            if (!aSelected && bSelected) {
                return 1 * modifier;
            }
            return 0;
        });
    }

    private toggleSortName() {
        const { sort } = this.state;
        if (sort === 'name') {
            this.setState({ sort: '-name' });
        } else {
            this.setState({ sort: 'name' });
        }
    }

    private toggleSortSelected() {
        const { sort } = this.state;
        if (sort === 'selected') {
            this.setState({ sort: '-selected' });
        } else {
            this.setState({ sort: 'selected' });
        }
    }

    private infoPRef(element: HTMLElement) {
        if (this.infoP === element) {
            return;
        }

        this.infoP = element;
        this.setState(this.getInitialState());
    }

    render() {
        const { classes } = this.props;
        const { colors } = this.props.theme.eventkit;
        const styles = {
            textField: {
                backgroundColor: colors.secondary,
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
                    color: this.state.sort.includes('name') ? colors.primary : colors.text_primary,
                }}
                className="qa-AddMembersDialog-sortName"
            >
                {label}
                {this.state.sort === '-name' ?
                    <ArrowUp className={classes.arrow} />
                    :
                    <ArrowDown className={classes.arrow} />
                }
            </ButtonBase>
        );

        const sortSelected = (
            <ButtonBase
                onClick={this.toggleSortSelected}
                style={{
                    padding: '0px 10px',
                    color: this.state.sort.includes('selected') ? colors.primary : colors.text_primary,
                }}
                className="qa-AddMembersDialog-sortSelected"
            >
                {this.state.sort === '-selected' ?
                    <ArrowUp className={classes.arrow} />
                    :
                    <ArrowDown className={classes.arrow} />
                }
                {`(${this.state.selection.length}) SELECTED`}
            </ButtonBase>
        );

        const actions = [
            <Button
                key="cancel"
                className="qa-AddMembersDialog-cancel"
                onClick={this.handleClose}
                variant="text"
                color="primary"
            >
                CANCEL
            </Button>,
            <Button
                key="save"
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
        const scrollbarHeight = `calc(100vh - ${
            margin +
            titleHeight +
            tabHeight +
            searchHeight +
            infoHeight +
            sortHeight +
            footerHeight +
            20
        }px)`;

        return (
            <Dialog
                className="qa-AddMembersDialog"
                classes={{ paper: classes.dialog }}
                open={this.props.show}
                onClose={this.handleClose}
                title="ADD TO EXISTING GROUPS"
                style={{ zIndex: 1501 }}
                maxWidth={false}
            >
                <DialogTitle disableTypography className={classes.title}>
                    <div className="qa-AddMembersDialog-title">
                        <strong>ADD TO EXISTING GROUPS</strong>
                        <Clear className={classes.clear} color="primary" onClick={this.props.onClose} />
                    </div>
                </DialogTitle>
                <DialogContent style={{ padding: '0px 24px' }}>
                    <p
                        ref={this.infoPRef}
                        style={{ marginBottom: '20px', color: colors.text_primary }}
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
                        classes={{ indicator: classes.tabIndicator }}
                        className="qa-AddMembersDialog-Tabs"
                    >
                        <Tab
                            label="AVAILABLE GROUPS"
                            value={0}
                            className="qa-AddMembersDialog-Tab-unassigned"
                            classes={{
                                root: classes.unassignedTab,
                                label: classes.label,
                                labelContainer: classes.labelContainer,
                                selected: classes.selected
                            }}
                        />
                        <Tab
                            label="ALREADY IN GROUPS"
                            value={1}
                            className="qa-AddMembersDialog-Tab-assigned"
                            classes={{
                                root: classes.assignedTab,
                                label: classes.label,
                                labelContainer: classes.labelContainer,
                                selected: classes.selected
                            }}
                        />
                    </Tabs>
                    {searchbar}
                    {this.state.tab === 0 ?
                        <React.Fragment>
                            <div className={`qa-AddMembersDialog-unassignedHeader ${classes.header}`}>
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
                                        className={`qa-AddMembersDialog-unassignedRow ${classes.row}`}
                                    >
                                        <div className={classes.name}>{group.name}</div>
                                        {this.getUnassignedCheckbox(group)}
                                    </div>
                                ))}
                            </CustomScrollbar>
                        </React.Fragment>
                        :
                        <React.Fragment>
                            <div className={`qa-AddMembersDialog-assignedHeader ${classes.header}`}>
                                <div style={{ flex: '1 1 auto' }}>
                                    {sortName(`GROUP ASSIGNMENTS (${assigned.length})`)}
                                </div>
                                <div style={{ flex: '0 0 auto', justifyContent: 'flex-end', height: '28px' }}>
                                    <span style={{ marginRight: '-24px', color: colors.text_primary }}>(View Only)</span>
                                </div>
                            </div>
                            <CustomScrollbar
                                style={{ height: scrollbarHeight }}
                            >
                                {assigned.map(group => (
                                    <div
                                        className={`qa-AddMembersDialog-assignedRow ${classes.row}`}
                                        key={group.name}
                                    >
                                        <div className={classes.name}>{group.name}</div>
                                        <Checked style={{ height: '28px', width: '28px', fill: colors.text_primary }} />
                                    </div>
                                ))}
                            </CustomScrollbar>
                        </React.Fragment>
                    }
                </DialogContent>
                <DialogActions className={classes.actions}>{actions}</DialogActions>
            </Dialog>
        );
    }
}

export default withTheme()(withStyles(jss)(AddMembersDialog));
