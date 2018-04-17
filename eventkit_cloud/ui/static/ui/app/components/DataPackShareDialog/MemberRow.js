import React, { Component, PropTypes } from 'react';
import { Card, CardHeader } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';
import AdminShare from '../icons/AdminShareIcon';

export class MemberRow extends Component {
    constructor(props) {
        super(props);
        this.handleCheck = this.props.handleCheck.bind(this, this.props.member);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onAdminMouseOut = this.onAdminMouseOut.bind(this);
        this.onAdminMouseOver = this.onAdminMouseOver.bind(this);
    }

    onAdminMouseOver() {
        if (this.props.selected) {
            this.props.handleAdminMouseOver(this.tooltip, this.props.admin);
        }
    }

    onAdminMouseOut() {
        this.props.handleAdminMouseOut();
    }


    onKeyDown(e) {
        const key = e.which || e.keyCode;
        if (key === 13) this.handleAdminCheck();
    }

    handleAdminCheck() {
        if (this.props.showAdmin && this.props.selected) {
            this.props.handleAdminCheck(this.props.member);
        }
    }

    render() {
        const styles = {
            card: {
                margin: '0px 10px 10px',
                boxShadow: 'none',
            },
            text: {
                flex: '1 1 auto',
                marginRight: '10px',
                color: '#707274',
                fontSize: '14px',
            },
            expandIcon: {
                fill: '#4598bf',
                marginLeft: '15px',
                cursor: 'pointer',
            },
            checkIcon: {
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                flex: '0 0 auto',
            },
            adminCheckIcon: {
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                marginRight: '15px',
            },
            cardText: {
                backgroundColor: '#fff',
                color: '#707274',
                padding: '10px 16px 0px',
            },
        };

        // Assume group is not selected by default
        let groupIcon = <CheckBoxOutline style={styles.checkIcon} onClick={this.handleCheck} />;

        // Check if group is selected
        if (this.props.selected) {
            groupIcon = <CheckBox style={styles.checkIcon} onClick={this.handleCheck} />;
        }

        if (this.props.showAdmin && !this.props.selected) {
            styles.adminCheckIcon.color = '#707274';
            styles.adminCheckIcon.opacity = 0.2;
            styles.adminCheckIcon.cursor = 'default';
        }

        let adminButton = null;
        if (this.props.showAdmin) {
            if (!this.props.selected) {
                styles.adminCheckIcon.color = '#707274';
                styles.adminCheckIcon.opacity = 0.2;
                styles.adminCheckIcon.cursor = 'default';
            } else if (!this.props.admin) {
                styles.adminCheckIcon.opacity = 0.55;
            }

            adminButton = (
                <div ref={(input) => { this.tooltip = input; }} style={{ display: 'flex', alignItems: 'center' }}>
                    <AdminShare
                        className="qa-MemberRow-AdminShare"
                        onClick={this.handleAdminCheck}
                        onMouseOver={this.onAdminMouseOver}
                        onMouseOut={this.onAdminMouseOut}
                        onFocus={this.onAdminMouseOver}
                        onBlur={this.onAdminMouseOut}
                        style={styles.adminCheckIcon}
                    />
                </div>
            );
        }

        return (
            <Card
                key={this.props.member.user.username}
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-MemberRow-Card"
            >
                <CardHeader
                    className="qa-MemberRow-CardHeader"
                    title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={styles.text} className="qa-MemberRow-CardHeader-text">
                                <div>
                                    <strong>
                                        <span style={{ wordBreak: 'break-word' }}>{this.props.member.user.first_name} </span>
                                        <span style={{ wordBreak: 'break-word' }}>{this.props.member.user.last_name}</span>
                                    </strong>
                                </div>
                                <div style={{ wordBreak: 'break-word' }}>{this.props.member.user.email}</div>
                            </div>
                            {adminButton}
                            {groupIcon}
                        </div>
                    }
                    style={{ padding: '6px' }}
                    textStyle={{ padding: '0px', width: '100%' }}
                />
            </Card>
        );
    }
}

MemberRow.defaultProps = {
    showAdmin: false,
    admin: false,
    handleAdminCheck: () => {},
    handleAdminMouseOver: () => {},
    handleAdminMouseOut: () => {},
};

MemberRow.propTypes = {
    member: PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            date_joined: PropTypes.string,
            last_login: PropTypes.string,
        }),
        accepted_licenses: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    selected: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    showAdmin: PropTypes.bool,
    handleCheck: PropTypes.func.isRequired,
    handleAdminCheck: PropTypes.func,
    handleAdminMouseOut: PropTypes.func,
    handleAdminMouseOver: PropTypes.func,
};

export default MemberRow;
