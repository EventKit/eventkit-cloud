import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class UserInfoTableRow extends Component {
    render() {
        const styles = {
            tr: {
                lineHeight: '35px',
            },
            title: {
                padding: '0px 15px',
                backgroundColor: 'whitesmoke',
                whiteSpace: 'nowrap',
            },
            data: {
                padding: '0px 15px',
                backgroundColor: 'whitesmoke',
                color: 'grey',
                width: '99%',
            },
        };

        if (!this.props.title || !this.props.data) {
            return null;
        }

        return (
            <tr className="qa-UserInfoTableRow-tr" style={styles.tr}>
                <td style={styles.title}><strong>{this.props.title}</strong></td>
                <td style={styles.data}>{this.props.data}</td>
            </tr>
        );
    }
}

UserInfoTableRow.defaultProps = {
    title: '',
    data: '',
};

UserInfoTableRow.propTypes = {
    title: PropTypes.string,
    data: PropTypes.string,
};

export default UserInfoTableRow;
