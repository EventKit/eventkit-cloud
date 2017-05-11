import React, {Component} from 'react';

export class UserInfoTableRow extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        const styles ={
            tr: {
                lineHeight: '35px',
            },
            td: {padding: '0px 15px', backgroundColor: 'whitesmoke'}
        }

        if(!this.props.title || !this.props.data) {
            return null
        }

        return (
            <tr style={styles.tr}>
                <td style={{...styles.td, whiteSpace: 'nowrap'}}><strong>{this.props.title}</strong></td>
                <td style={{...styles.td, color: 'grey', width: '99%'}}>{this.props.data}</td>
            </tr>
        )
    };
};

UserInfoTableRow.PropTypes = {
    title: React.PropTypes.string,
    data: React.PropTypes.string
};

export default UserInfoTableRow;
