import React, { Component, PropTypes } from 'react';
import { Card, CardHeader } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import ArrowUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import IndeterminateIcon from '../../components/IndeterminateIcon';

export class MembersHeaderRow extends Component {
    render() {
        const styles = {
            card: {
                boxShadow: 'none',
                color: '#707274',
                borderBottom: '1px solid #70727480',
                marginBottom: '6px',
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

        return (
            <Card
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-MembersHeaderRow-Card"
            >
                <CardHeader
                    title={
                        <div style={{ display: 'flex', fontSize: '12px', color: '#707274', lineHeight: '28px' }}>
                            <div style={styles.member} className="qa-MembersHeaderRow-CardHeader-text">
                                <EnhancedButton
                                    onClick={this.props.onMemberClick}
                                    disableTouchRipple
                                    style={{ color: this.props.activeOrder === 'member' ? '#4598bf' : '#707274' }}
                                >
                                    MEMBER
                                    {this.props.memberOrder === 1 ?
                                        <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                                        :
                                        <ArrowUp style={{ height: '28px', verticalAlign: 'bottom' }} />
                                    }
                                </EnhancedButton>
                            </div>
                            <div style={{ flex: '1 1 auto' }}>{countText}</div>
                            <div style={styles.share} className="qa-MembersHeaderRow-CardHeader-icons">
                                <EnhancedButton
                                    onClick={this.props.onSharedClick}
                                    style={{ marginRight: '10px', color: this.props.activeOrder === 'shared' ? '#4598bf' : '#707274' }}
                                    disableTouchRipple
                                >
                                    {this.props.sharedOrder === 1 ?
                                        <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                                        :
                                        <ArrowUp style={{ height: '28px', verticalAlign: 'bottom' }} />
                                    }
                                    SHARED
                                </EnhancedButton>
                                {checkIcon}
                            </div>
                        </div>
                    }
                    style={{ padding: '12px 6px' }}
                    textStyle={{ padding: '0px', width: '100%' }}
                />
            </Card>
        );
    }
}

MembersHeaderRow.propTypes = {
    memberCount: PropTypes.number.isRequired,
    selectedCount: PropTypes.number.isRequired,
    onMemberClick: PropTypes.func.isRequired,
    onSharedClick: PropTypes.func.isRequired,
    activeOrder: PropTypes.oneOf(['member', 'shared']).isRequired,
    memberOrder: PropTypes.oneOf([-1, 1]).isRequired,
    sharedOrder: PropTypes.oneOf([-1, 1]).isRequired,
    handleCheckAll: PropTypes.func.isRequired,
    handleUncheckAll: PropTypes.func.isRequired,
};

export default MembersHeaderRow;
