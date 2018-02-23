import React, { Component, PropTypes } from 'react';
import { Card, CardHeader } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import ArrowUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import IndeterminateIcon from '../../components/IndeterminateIcon';

export class GroupsHeaderRow extends Component {
    render() {
        const styles = {
            card: {
                boxShadow: 'none',
                color: '#707274',
            },
            group: {
                flex: '1 1 auto',
            },
            share: {
                display: 'flex',
            },
            check: {
                position: 'relative',
                display: 'inline-block',
                width: '28px',
                height: '28px',
                float: 'right',
                marginRight: '39px',
                cursor: 'pointer',
            },
        };

        const icons = {
            checked: <CheckBox style={styles.check} onClick={this.props.handleUncheckAll} />,
            unchecked: <CheckBoxOutline style={styles.check} onClick={this.props.handleCheckAll} />,
            indeterminate: <IndeterminateIcon style={styles.check} onClick={this.props.handleUncheckAll} />,
        };

        // assume no groups are checked by default
        let checkIcon = icons.unchecked;

        if (this.props.groupCount === this.props.selectedCount) {
            checkIcon = icons.checked;
        } else if (this.props.selectedCount) {
            checkIcon = icons.indeterminate;
        }

        return (
            <Card
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-GroupsHeaderRow-Card"
            >
                <CardHeader
                    title={
                        <div style={{ display: 'flex', fontSize: '12px', color: '#707274', lineHeight: '28px' }}>
                            <div style={styles.group} className="qa-GroupsHeaderRow-CardHeader-text">
                                <EnhancedButton
                                    onClick={this.props.onGroupClick}
                                    style={{ marginRight: '10px', color: this.props.activeOrder === 'group' ? '#4598bf' : '#707274' }}
                                    disableTouchRipple
                                >
                                    GROUP
                                    {this.props.groupOrder === 1 ?
                                        <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                                        :
                                        <ArrowUp style={{ height: '28px', verticalAlign: 'bottom' }} />
                                    }
                                </EnhancedButton>
                            </div>
                            <div style={styles.share} className="qa-GroupsHeaderRow-CardHeader-icons">
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
                    style={{ padding: '12px' }}
                    textStyle={{ padding: '0px', width: '100%' }}
                />
            </Card>
        );
    }
}

GroupsHeaderRow.propTypes = {
    groupCount: PropTypes.number.isRequired,
    selectedCount: PropTypes.number.isRequired,
    onGroupClick: PropTypes.func.isRequired,
    onSharedClick: PropTypes.func.isRequired,
    activeOrder: PropTypes.oneOf(['group', 'shared']).isRequired,
    groupOrder: PropTypes.oneOf([-1, 1]).isRequired,
    sharedOrder: PropTypes.oneOf([-1, 1]).isRequired,
    handleCheckAll: PropTypes.func.isRequired,
    handleUncheckAll: PropTypes.func.isRequired,
};

export default GroupsHeaderRow;
