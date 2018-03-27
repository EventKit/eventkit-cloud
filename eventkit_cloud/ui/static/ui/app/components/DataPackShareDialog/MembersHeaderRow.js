import React, { Component, PropTypes } from 'react';
import { Card, CardHeader } from 'material-ui/Card';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import ArrowUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';

export class MembersHeaderRow extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleMemberChange = this.handleMemberChange.bind(this);
        this.state = {
            open: false,
            anchor: null,
        };
    }

    handleClick(e) {
        if (this.props.canUpdateAdmin) {
            this.setState({ open: true, anchor: e.currentTarget });
        } else if (!this.props.activeOrder.includes('shared')) {
            this.props.onSharedClick(this.props.sharedOrder);
        } else {
            const v = this.props.sharedOrder === 'shared' ? '-shared' : 'shared';
            this.props.onSharedClick(v);
        }
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleChange(e, v) {
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
            },
            menuItem: {
                fontSize: '12px',
                padding: 0,
                minHeight: '36px',
                lineHeight: '36px',
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
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-MembersHeaderRow-Card"
            >
                <CardHeader
                    title={
                        <div style={styles.cardHeader}>
                            <div style={styles.member} className="qa-MembersHeaderRow-CardHeader-text">
                                <EnhancedButton
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
                                </EnhancedButton>
                            </div>
                            <div style={{ flex: '1 1 auto' }} className="qa-MembersHeaderRow-countText">{countText}</div>
                            <div style={styles.share} className="qa-MembersHeaderRow-CardHeader-icons">
                                <EnhancedButton
                                    onClick={this.handleClick}
                                    style={{ marginRight: '10px', color: !this.props.activeOrder.includes('member') ? '#4598bf' : '#707274' }}
                                    disableTouchRipple
                                >
                                    {sharedSort}
                                </EnhancedButton>
                                {checkIcon}
                            </div>
                            <Popover
                                className="qa-MembersHeaderRow-Popover"
                                open={this.state.open}
                                anchorEl={this.state.anchor}
                                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                                onRequestClose={this.handleClose}
                            >
                                <Menu
                                    className="qa-MembersHeaderRow-Menu"
                                    value={this.props.activeOrder}
                                    onChange={this.handleChange}
                                    menuItemStyle={styles.menuItem}
                                    style={{ padding: 0 }}
                                >
                                    <MenuItem primaryText="SHARED" value="shared" />
                                    <MenuItem primaryText="NOT SHARED" value="-shared" />
                                    <MenuItem primaryText="ADMIN SHARED" value="admin-shared" />
                                    <MenuItem primaryText="NOT ADMIN SHARED" value="-admin-shared" />
                                </Menu>
                            </Popover>
                        </div>
                    }
                    style={{ padding: '12px 6px' }}
                    textStyle={{ padding: '0px', width: '100%' }}
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
