import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
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
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

export type MemberOrder = 'username' | '-username';
export type SharedOrder = 'shared' | '-shared' | 'admin-shared' | '-admin-shared';

export interface Props {
    className?: string;
    public: boolean;
    memberCount: number;
    selectedCount: number;
    onMemberClick: (order: MemberOrder) => void;
    onSharedClick: (order: SharedOrder) => void;
    memberOrder: MemberOrder;
    sharedOrder: SharedOrder;
    activeOrder: MemberOrder | SharedOrder;
    handleCheckAll: () => void;
    handleUncheckAll: () => void;
    canUpdateAdmin: boolean;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

export interface State {
    anchor: null | HTMLElement;
}

export class MembersHeaderRow extends React.Component<Props, State> {
    static defaultProps = {
        canUpdateAdmin: false,
    };

    constructor(props: Props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleMemberChange = this.handleMemberChange.bind(this);
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

    private handleMemberChange() {
        if (!this.props.activeOrder.includes('username')) {
            this.props.onMemberClick(this.props.memberOrder);
        } else {
            const v = this.props.memberOrder === 'username' ? '-username' : 'username';
            this.props.onMemberClick(v);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            card: {
                boxShadow: 'none',
                color: colors.text_primary,
                borderBottom: `1px solid ${colors.secondary_dark}`,
                marginBottom: '6px',
                borderRadius: '0px',
            },
            cardHeader: {
                display: 'flex',
                fontSize: '12px',
                color: colors.text_primary,
                lineHeight: '28px',
            },
            member: {
                flex: '0 0 auto',
                marginRight: '5px',
            },
            share: {
                display: 'flex',
                flex: '0 0 auto',
                alignItems: 'center',
            },
            check: {
                flex: '0 0 auto',
                width: '28px',
                height: '28px',
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

        // assume no users are checked by default
        let checkIcon = icons.unchecked;

        if (this.props.public || (this.props.memberCount === this.props.selectedCount && this.props.memberCount !== 0)) {
            checkIcon = icons.checked;
        } else if (this.props.selectedCount) {
            checkIcon = icons.indeterminate;
        }

        let countText = '';
        if (!isWidthUp('sm', this.props.width)) {
            countText = this.props.public ?
                '(ALL)' : `(${this.props.selectedCount}/${this.props.memberCount})`;
        } else {
            countText = this.props.public ?
                'Shared with ALL' : `Shared with ${this.props.selectedCount} of ${this.props.memberCount}`;
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
                <div className="qa-MembersHeaderRow-sortLabel">
                    <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                    {LABELS[this.props.sharedOrder]}
                </div>
            );
        } else {
            sharedSort = (
                <div className="qa-MembersHeaderRow-sortLabel">
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
                className="qa-MembersHeaderRow-Card"
            >
                <CardHeader
                    title={
                        <div style={styles.cardHeader}>
                            <div style={styles.member} className="qa-MembersHeaderRow-CardHeader-text">
                                <ButtonBase
                                    onClick={this.handleMemberChange}
                                    disableTouchRipple
                                    style={{ color: this.props.activeOrder.includes('username') ? colors.primary : colors.text_primary }}
                                >
                                    MEMBER
                                    {this.props.memberOrder === 'username' ?
                                        <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                                        :
                                        <ArrowUp style={{ height: '28px', verticalAlign: 'bottom' }} />
                                    }
                                </ButtonBase>
                            </div>
                            <div style={{ flex: '1 1 auto' }} className="qa-MembersHeaderRow-countText">{countText}</div>
                            <div style={styles.share} className="qa-MembersHeaderRow-CardHeader-icons">
                                <ButtonBase
                                    onClick={this.handleClick}
                                    style={{
                                        marginRight: '10px',
                                        color: !this.props.activeOrder.includes('username') ?
                                            colors.primary : colors.text_primary,
                                    }}
                                    disableTouchRipple
                                >
                                    {sharedSort}
                                </ButtonBase>
                                {checkIcon}
                            </div>
                            <Menu
                                className="qa-MembersHeaderRow-Menu-sort"
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
                    style={{ padding: '12px 6px' }}
                />
            </Card>
        );
    }
}

export default withWidth()(withTheme()(MembersHeaderRow));
