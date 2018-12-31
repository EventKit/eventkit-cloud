import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CheckBoxOutline from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBox from '@material-ui/icons/CheckBox';
import AdminShare from '../icons/AdminShareIcon';

export interface Props {
    className?: string;
    member: Eventkit.User;
    selected: boolean;
    admin: boolean;
    showAdmin: boolean;
    handleCheck: (user: Eventkit.User) => void;
    handleAdminCheck: (user: Eventkit.User) => void;
    handleAdminMouseOut: () => void;
    handleAdminMouseOver: (tooltip: HTMLElement, admin: boolean) => void;
    theme: Eventkit.Theme & Theme;
}

export class MemberRow extends React.Component<Props, {}> {
    static defaultProps = {
        showAdmin: false,
        admin: false,
        handleAdminCheck: () => { /* do nothing */ },
        handleAdminMouseOver: () => { /* do nothing */ },
        handleAdminMouseOut: () => { /* do nothing */ },
    };

    private handleCheck: () => void;
    private tooltip: HTMLElement;
    constructor(props: Props) {
        super(props);
        this.handleCheck = this.props.handleCheck.bind(this, this.props.member);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onAdminMouseOut = this.onAdminMouseOut.bind(this);
        this.onAdminMouseOver = this.onAdminMouseOver.bind(this);
    }

    private onAdminMouseOver() {
        if (this.props.selected) {
            this.props.handleAdminMouseOver(this.tooltip, this.props.admin);
        }
    }

    private onAdminMouseOut() {
        this.props.handleAdminMouseOut();
    }

    private onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
        const key = e.which || e.keyCode;
        if (key === 13) {
            this.handleAdminCheck();
        }
    }

    private handleAdminCheck() {
        if (this.props.showAdmin && this.props.selected) {
            this.props.handleAdminCheck(this.props.member);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            card: {
                margin: '0px 10px 10px',
                boxShadow: 'none',
            },
            text: {
                flex: '1 1 auto',
                marginRight: '10px',
                color: colors.text_primary,
                fontSize: '14px',
            },
            expandIcon: {
                fill: colors.primary,
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
                color: undefined,
                opacity: undefined,
            },
            cardText: {
                backgroundColor: colors.white,
                color: colors.text_primary,
                padding: '10px 16px 0px',
            },
        };

        // Assume group is not selected by default
        let groupIcon = <CheckBoxOutline style={styles.checkIcon} onClick={this.handleCheck} color="primary" />;

        // Check if group is selected
        if (this.props.selected) {
            groupIcon = <CheckBox style={styles.checkIcon} onClick={this.handleCheck} color="primary" />;
        }

        let adminButton = null;
        if (this.props.showAdmin) {
            if (!this.props.selected) {
                styles.adminCheckIcon.color = colors.text_primary;
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
                        color="primary"
                        style={styles.adminCheckIcon}
                    />
                </div>
            );
        }

        let name = this.props.member.user.username;
        if (this.props.member.user.first_name && this.props.member.user.last_name) {
            name = `${this.props.member.user.first_name} ${this.props.member.user.last_name}`;
        }
        const email = this.props.member.user.email || 'No email provided';

        return (
            <Card
                key={this.props.member.user.username}
                style={styles.card}
                className="qa-MemberRow-Card"
            >
                <CardHeader
                    className="qa-MemberRow-CardHeader"
                    title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={styles.text} className="qa-MemberRow-CardHeader-text">
                                <div style={{ wordBreak: 'break-word' }}>
                                    <strong>
                                        {name}
                                    </strong>
                                </div>
                                <div style={{ wordBreak: 'break-word' }}>
                                    {email}
                                </div>
                            </div>
                            {adminButton}
                            {groupIcon}
                        </div>
                    }
                    style={{ padding: '6px' }}
                />
            </Card>
        );
    }
}

export default withTheme()(MemberRow);
