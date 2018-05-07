import React, { Component, PropTypes } from 'react';
import EnhancedButton from 'material-ui/internal/EnhancedButton';

export class OwnUserRow extends Component {
    constructor(props) {
        super(props);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleMakeAdminClick = this.handleMakeAdminClick.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.state = {
            hovered: false,
        }
    }

    handleMouseOver() {
        this.setState({ hovered: true });
    }

    handleMouseOut() {
        this.setState({ hovered: false });
    }

    handleMakeAdminClick(e) {
        e.stopPropagation();
        this.props.handleMakeAdmin(this.props.user);
    }

    handleDemoteAdminClick(e) {
        e.stopPropagation();
        this.props.handleDemoteAdmin(this.props.user);
    }

    render() {
        const styles = {
            row: {
                ...this.props.style,
                color: '#707274',
                fontSize: '14px',
                whiteSpace: 'normal',
                display: 'flex',
                borderTop: '1px solid rgba(0, 0, 0, 0.2)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.2)',
                backgroundColor: this.state.hovered ? '#4598bf33' : 'rgba(0, 0, 0, 0.05)',
            },
            checkbox: {
                display: 'flex',
                flex: '0 0 auto',
                paddingLeft: '24px',
                alignItems: 'center',
            },
            userInfo: {
                display: 'flex',
                flexWrap: 'wrap',
                wordBreak: 'break-word',
                width: '100%',
            },
            me: {
                display: 'flex',
                flex: '1 1 auto',
                alignItems: 'center',
                paddingLeft: '15px',
                fontWeight: 800,
            },
            iconButton: {
                padding: '0px',
                height: '40px',
                width: '48px',
                flex: '0 0 auto',
                alignSelf: 'center',
            },
            adminContainer: {
                display: 'flex',
                margin: '0px 30px 0px 20px',
                alignItems: 'center',
            },
            admin: {
                backgroundColor: '#4598bf',
                color: '#fff',
                padding: '4px 11px',
                fontSize: '11px',
                cursor: 'pointer',
            },
            notAdmin: {
                backgroundColor: '#ccc',
                color: '#fff',
                padding: '4px 11px',
                fontSize: '11px',
                opacity: '0.8',
                cursor: 'pointer',
            },
        };

        let name = this.props.user.user.username;
        if (this.props.user.user.first_name && this.props.user.user.last_name) {
            name = `${this.props.user.user.first_name} ${this.props.user.user.last_name}`;
        }
        const email = this.props.user.user.email || 'No email provided';

        let adminLabel = null;
        if (this.props.showAdminLabel && this.props.isAdmin) {
            adminLabel = (
                <div style={styles.adminContainer}>
                        ADMIN
                </div>
            );
        }

        return (
            <div
                style={styles.row}
                className="qa-OwnUserRow"
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onFocus={this.handleMouseOver}
                onBlur={this.handleMouseOut}
            >
                <div style={{ padding: '28px 24px' }} />
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div>
                        <div className="qa-OwnUserRow-name" style={styles.userInfo}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-OwnUserRow-email" style={styles.userInfo}>
                            {email}
                        </div>
                    </div>
                    <div style={styles.me}>(me)</div>
                    {adminLabel}
                </div>
                <div style={{ padding: '28px 24px' }} />
            </div>
        );
    }
}

OwnUserRow.defaultProps = {
    isAdmin: false,
    showAdminLabel: false,
    style: {},
};

OwnUserRow.propTypes = {
    user: PropTypes.shape({
        user: PropTypes.shape({
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            username: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    isAdmin: PropTypes.bool,
    showAdminLabel: PropTypes.bool,
    style: PropTypes.object,
};

export default OwnUserRow;
