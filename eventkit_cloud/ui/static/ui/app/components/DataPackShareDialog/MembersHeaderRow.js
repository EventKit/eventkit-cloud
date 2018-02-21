import React, { Component, PropTypes } from 'react';
import { Card, CardHeader } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import ArrowUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import IndeterminateIcon from '../../components/IndeterminateIcon';

export class MembersHeaderRow extends Component {
    constructor(props) {
        super(props);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleCheckAll = this.handleCheckAll.bind(this);
    }

    handleUncheckAll() {
    }

    handleCheckAll() {
    }

    render() {
        const styles = {
            card: {
                boxShadow: 'none',
                color: '#707274',
            },
            member: {
                flex: '1 1 auto',

            },
            share: {
                display: 'flex',
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
            checked: <CheckBox style={styles.check} onClick={this.handleUncheckAll} />,
            unchecked: <CheckBoxOutline style={styles.check} onClick={this.handleCheckAll} />,
            indeterminate: <IndeterminateIcon style={styles.check} onClick={this.handleUncheckAll} />,
        };

        // assume no users are checked by default
        let checkIcon = icons.unchecked;

        if (this.props.memberCount === this.props.selectedCount) {
            checkIcon = icons.checked;
        } else if (this.props.selectedCount) {
            checkIcon = icons.indeterminate;
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
                                    onClick={() => { console.log('group enhanced'); }}
                                    style={{ marginRight: '10px' }}
                                    disableTouchRipple
                                >
                                    MEMBER
                                    <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
                                </EnhancedButton>
                            </div>
                            <div style={styles.share} className="qa-MembersHeaderRow-CardHeader-icons">
                                <EnhancedButton
                                    onClick={() => { console.log('enhanced'); }}
                                    style={{ marginRight: '10px' }}
                                    disableTouchRipple
                                >
                                    <ArrowDown style={{ height: '28px', verticalAlign: 'bottom' }} />
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
};

export default MembersHeaderRow;
