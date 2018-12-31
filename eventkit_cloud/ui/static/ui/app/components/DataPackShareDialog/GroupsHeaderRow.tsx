import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CheckBoxOutline from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBox from '@material-ui/icons/CheckBox';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import ButtonBase from '@material-ui/core/ButtonBase';
import IndeterminateIcon from '../icons/IndeterminateIcon';

export type GroupOrder = 'name' | '-name';
export type SharedOrder = 'shared' | '-shared' | 'admin-shared' | '-admin-shared';

export interface Props {
    className?: string;
    groupCount: number;
    selectedCount: number;
    onGroupClick: (order: GroupOrder) => void;
    onSharedClick: (order: SharedOrder) => void;
    groupOrder: GroupOrder;
    sharedOrder: SharedOrder;
    activeOrder: GroupOrder | SharedOrder;
    handleCheckAll: () => void;
    handleUncheckAll: () => void;
    canUpdateAdmin: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    anchor: null | HTMLElement;
}

export class GroupsHeaderRow extends React.Component<Props, State> {
    static defaultProps = {
        canUpdateAdmin: false,
    };

    constructor(props: Props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleGroupChange = this.handleGroupChange.bind(this);
        this.state = {
            anchor: null,
        };
    }

    private handleClick(e: React.MouseEvent<HTMLElement>) {
        if (this.props.canUpdateAdmin) {
            this.setState({ anchor: e.currentTarget });
        } else if (!this.props.activeOrder.includes('shared')) {
            this.props.onSharedClick(this.props.sharedOrder);
        } else {
            const v = this.props.sharedOrder === 'shared' ? '-shared' : 'shared';
            this.props.onSharedClick(v);
        }
    }

    private handleClose() {
        this.setState({ anchor: null });
    }

    private handleChange(v: SharedOrder) {
        this.props.onSharedClick(v);
        this.handleClose();
    }

    private handleGroupChange() {
        if (!this.props.activeOrder.includes('name')) {
            this.props.onGroupClick(this.props.groupOrder);
        } else {
            const v = this.props.groupOrder === 'name' ? '-name' : 'name';
            this.props.onGroupClick(v);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            card: {
                boxShadow: 'none',
                color: colors.text_primary,
            },
            cardHeader: {
                display: 'flex',
                fontSize: '12px',
                color: colors.text_primary,
                lineHeight: '28px',
            },
            group: {
                flex: '1 1 auto',
            },
            share: {
                display: 'flex',
            },
            check: {
                position: 'relative' as 'relative',
                display: 'inline-block',
                width: '28px',
                height: '28px',
                float: 'right' as 'right',
                marginRight: '39px',
                cursor: 'pointer',
                color: colors.primary,
            },
            menuItem: {
                fontSize: '12px',
                height: 'auto',
                color: colors.text_primary,
            },
        };

        const icons = {
            checked: <CheckBox style={styles.check} onClick={this.props.handleUncheckAll} />,
            unchecked: <CheckBoxOutline style={styles.check} onClick={this.props.handleCheckAll} />,
            indeterminate: <IndeterminateIcon style={styles.check} onClick={this.props.handleUncheckAll} />,
        };

        // assume no groups are checked by default
        let checkIcon = icons.unchecked;

        if (this.props.groupCount === this.props.selectedCount && this.props.groupCount !== 0) {
            checkIcon = icons.checked;
        } else if (this.props.selectedCount) {
            checkIcon = icons.indeterminate;
        }

        const LABELS = {
            shared: 'SHARED',
            '-shared': 'NOT SHARED',
            'admin-shared': 'ADMIN SHARED',
            '-admin-shared': 'NOT ADMIN SHARED',
        };

        let sharedSort = null;
        if (this.props.canUpdateAdmin) {
            sharedSort = (
                <div className="qa-GroupsHeaderRow-sortLabel">
                    <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                    {LABELS[this.props.sharedOrder]}
                </div>
            );
        } else {
            sharedSort = (
                <div className="qa-GroupsHeaderRow-sortLabel">
                    {this.props.sharedOrder === 'shared' ?
                        <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                        :
                        <ArrowUp style={{ height: '28px', verticalAlign: 'bottom' }} />
                    }
                    SHARED
                </div>
            );
        }

        return (
            <Card
                style={styles.card}
                className="qa-GroupsHeaderRow-Card"
            >
                <CardHeader
                    className="qa-GroupsHeaderRow-CardHeader"
                    title={
                        <div style={styles.cardHeader}>
                            <div style={styles.group} className="qa-GroupsHeaderRow-CardHeader-text">
                                <ButtonBase
                                    onClick={this.handleGroupChange}
                                    style={{
                                        marginRight: '10px',
                                        color: this.props.activeOrder.includes('name') ? colors.primary : colors.text_primary,
                                    }}
                                    disableTouchRipple
                                >
                                    GROUP
                                    {this.props.groupOrder === 'name' ?
                                        <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                                        :
                                        <ArrowUp style={{ height: '28px', verticalAlign: 'bottom' }} />
                                    }
                                </ButtonBase>
                            </div>
                            <div style={styles.share} className="qa-GroupsHeaderRow-CardHeader-icons">
                                <ButtonBase
                                    onClick={this.handleClick}
                                    style={{
                                        marginRight: '10px',
                                        color: !this.props.activeOrder.includes('group') ?
                                            colors.primary : colors.text_primary,
                                    }}
                                    disableTouchRipple
                                >
                                    {sharedSort}
                                </ButtonBase>
                                {checkIcon}
                            </div>
                            <Menu
                                className="qa-GroupsHeaderRow-Menu-sort"
                                onClose={this.handleClose}
                                open={Boolean(this.state.anchor)}
                                anchorEl={this.state.anchor}
                                style={{ padding: '0px', zIndex: 1501 }}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <MenuItem
                                    value="shared"
                                    style={styles.menuItem}
                                    onClick={() => this.handleChange('shared')}
                                >
                                    SHARED
                                </MenuItem>
                                <MenuItem
                                    value="-shared"
                                    style={styles.menuItem}
                                    onClick={() => this.handleChange('-shared')}
                                >
                                    NOT SHARED
                                </MenuItem>
                                <MenuItem
                                    value="admin-shared"
                                    style={styles.menuItem}
                                    onClick={() => this.handleChange('admin-shared')}
                                >
                                    ADMIN SHARED
                                </MenuItem>
                                <MenuItem
                                    value="-admin-shared"
                                    style={styles.menuItem}
                                    onClick={() => this.handleChange('-admin-shared')}
                                >
                                    NOT ADMIN SHARED
                                </MenuItem>
                            </Menu>
                        </div>
                    }
                    style={{ padding: '12px' }}
                />
            </Card>
        );
    }
}

export default withTheme()(GroupsHeaderRow);
