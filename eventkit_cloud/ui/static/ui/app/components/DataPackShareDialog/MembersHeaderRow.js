import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CheckBoxOutline from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBox from '@material-ui/icons/CheckBox';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import ButtonBase from '@material-ui/core/ButtonBase';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';

export class MembersHeaderRow extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleMemberChange = this.handleMemberChange.bind(this);
        this.state = {
            anchor: null,
        };
    }

    handleClick(e) {
        if (this.props.canUpdateAdmin) {
            this.setState({ anchor: e.currentTarget });
        } else if (!this.props.activeOrder.includes('shared')) {
            this.props.onSharedClick(this.props.sharedOrder);
        } else {
            const v = this.props.sharedOrder === 'shared' ? '-shared' : 'shared';
            this.props.onSharedClick(v);
        }
    }

    handleClose() {
        this.setState({ anchor: null });
    }

    handleChange(v) {
        this.props.onSharedClick(v);
        this.handleClose();
    }

    handleMemberChange() {
        if (!this.props.activeOrder.includes('member')) {
            this.props.onMemberClick(this.props.memberOrder);
        } else {
            const v = this.props.memberOrder === 'member' ? '-member' : 'member';
            this.props.onMemberClick(v);
        }
    }

    render() {
        const styles = {
            card: {
                boxShadow: 'none',
                color: '#707274',
                borderBottom: '1px solid #70727480',
                marginBottom: '6px',
            },
            cardHeader: {
                display: 'flex',
                fontSize: '12px',
                color: '#707274',
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
                color: '#4598bf',
            },
            menuItem: {
                fontSize: '12px',
                height: 'auto',
                color: '#707274',
            },
        };

        const icons = {
            checked: <CheckBox style={styles.check} onClick={this.props.handleUncheckAll} />,
            unchecked: <CheckBoxOutline style={styles.check} onClick={this.props.handleCheckAll} />,
            indeterminate: <IndeterminateIcon style={styles.check} onClick={this.props.handleUncheckAll} />,
        };

        // assume no users are checked by default
        let checkIcon = icons.unchecked;

        if (this.props.memberCount === this.props.selectedCount) {
            checkIcon = icons.checked;
        } else if (this.props.selectedCount) {
            checkIcon = icons.indeterminate;
        }

        let countText = '';
        if (window.innerWidth < 576) {
            countText = `(${this.props.selectedCount}/${this.props.memberCount})`;
        } else {
            countText = `Shared with ${this.props.selectedCount} of ${this.props.memberCount}`;
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
                                    style={{ color: this.props.activeOrder.includes('member') ? '#4598bf' : '#707274' }}
                                >
                                    MEMBER
                                    {this.props.memberOrder === 'member' ?
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
                                        color: !this.props.activeOrder.includes('member') ?
                                            '#4598bf' : '#707274',
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

MembersHeaderRow.defaultProps = {
    canUpdateAdmin: false,
};

MembersHeaderRow.propTypes = {
    memberCount: PropTypes.number.isRequired,
    selectedCount: PropTypes.number.isRequired,
    onMemberClick: PropTypes.func.isRequired,
    onSharedClick: PropTypes.func.isRequired,
    memberOrder: PropTypes.oneOf(['member', '-member']).isRequired,
    sharedOrder: PropTypes.oneOf([
        'shared',
        '-shared',
        'admin-shared',
        '-admin-shared',
    ]).isRequired,
    activeOrder: PropTypes.oneOf([
        'member',
        '-member',
        'shared',
        '-shared',
        'admin-shared',
        '-admin-shared',
    ]).isRequired,
    handleCheckAll: PropTypes.func.isRequired,
    handleUncheckAll: PropTypes.func.isRequired,
    canUpdateAdmin: PropTypes.bool,
};

export default MembersHeaderRow;
