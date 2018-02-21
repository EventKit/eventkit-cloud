import React, { Component, PropTypes } from 'react';
import { Card, CardHeader } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import CheckBox from 'material-ui/svg-icons/toggle/check-box';

export class MemberRow extends Component {
    constructor(props) {
        super(props);
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
            },
            cardText: {
                backgroundColor: '#fff',
                color: '#707274',
                padding: '10px 16px 0px',
            },
        };

        // Assume group is not selected by default
        let groupIcon = <CheckBoxOutline style={styles.checkIcon} onClick={this.handleCheckBox} />;

        // Check if group is selected
        if (this.props.selected) {
            groupIcon = <CheckBox style={styles.checkIcon} onClick={this.props.handleCheckBox} />;
        }

        return (
            <Card
                key={this.props.member.username}
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
                className="qa-MemberRow-Card"
            >
                <CardHeader
                    title={
                        <div style={{ display: 'flex' }}>
                            <div style={styles.text} className="qa-MemberRow-CardHeader-text">
                                <div><strong>{this.props.member.name}</strong></div>
                                <div>{this.props.member.email}</div>
                            </div>
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

MemberRow.propTypes = {
    member: PropTypes.shape({
        name: PropTypes.string,
        username: PropTypes.string,
        email: PropTypes.string,
    }).isRequired,
    selected: PropTypes.bool.isRequired,
    handleCheckBox: PropTypes.func.isRequired,
};

export default MemberRow;
