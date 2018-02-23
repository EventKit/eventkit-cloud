import React, { Component, PropTypes } from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

export class GroupMemberRow extends Component {
    render() {
        const styles = {
            dropDownIcon: {
                padding: '0px',
                width: '24px',
                height: '24px',
                position: 'relative',
                top: 0,
                right: 0,
                fill: '#4598bf',
            },
            dropDownLabel: {
                fontSize: '11px',
                height: '24px',
                lineHeight: '24px',
                display: 'inline-block',
                padding: '0px 0px 0px 10px',
                color: '#707274',
                fontWeight: 700,
            },
            adminLabel: {
                flex: '1 1 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
            },
        };

        let adminLabel = null;
        if (this.props.showAdminDropDown && this.props.isGroupAdmin) {
            adminLabel = (
                <DropDownMenu
                    autoWidth={false}
                    disabled={this.props.dropDownDisabled}
                    value={this.props.isDataPackAdmin}
                    onChange={() => this.props.handleAdminChange(this.props.member)}
                    style={{ display: 'flex', height: '24px' }}
                    menuStyle={{ width: '160px' }}
                    iconStyle={styles.dropDownIcon}
                    labelStyle={styles.dropDownLabel}
                    listStyle={{ paddingTop: '4px', paddingBottom: '4px' }}
                    menuItemStyle={{ fontSize: '11px', color: '#707274' }}
                    underlineStyle={{ display: 'none' }}
                >
                    <MenuItem value={false} primaryText="MEMBER RIGHTS ONLY" innerDivStyle={{ padding: '0px 10px' }} />
                    <MenuItem value primaryText="ADMIN RIGHTS" innerDivStyle={{ padding: '0px 10px' }} />
                </DropDownMenu>
            );
        } else if (this.props.showAdminDropDown && !this.props.isGroupAdmin) {
            adminLabel = <div style={{ fontSize: '11px', padding: '0px 24px 0px 10px', opacity: '0.5' }}>MEMBER RIGHTS ONLY</div>;
        } else if (this.props.isGroupAdmin) {
            adminLabel = <div style={{ fontSize: '11px', padding: '0px 24px 0px 10px', opacity: '1' }}>ADMIN</div>;
        }

        return (
            <div
                key={this.props.member.username}
                style={{ padding: '6px 0px 0px', display: 'flex', flexWrap: 'wrap' }}
                className="qa-GroupMemberRow-memberContainer"
            >
                <div
                    style={{ flex: '1 1 auto' }}
                    className="qa-GroupMemberRow-memberInfo"
                >
                    <div><strong>{this.props.member.name}{this.props.isGroupAdmin && this.props.showAdminDropDown ? ' (Group Admin)' : ''}</strong></div>
                    <div>{this.props.member.email}</div>
                </div>
                <div
                    style={styles.adminLabel}
                    className="qa-GroupMemberRow-adminLabel"
                >
                    {adminLabel}
                </div>
            </div>
        );
    }
}

GroupMemberRow.defaultProps = {
    showAdminDropDown: false,
    isGroupAdmin: false,
    isDataPackAdmin: false,
    dropDownDisabled: false,
    handleAdminChange: () => {},
};

GroupMemberRow.propTypes = {
    member: PropTypes.object.isRequired,
    showAdminDropDown: PropTypes.bool,
    isGroupAdmin: PropTypes.bool,
    isDataPackAdmin: PropTypes.bool,
    dropDownDisabled: PropTypes.bool,
    handleAdminChange: PropTypes.func,
};

export default GroupMemberRow;
