import React, {Component} from 'react';

export class UserInfoBlock extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        const bodyStyle = {
            backgroundColor: 'whitesmoke', 
            width: '100%', 
            margin: '5px 0px 20px 0px', 
            lineHeight: '35px', 
            padding: '0px 16px', 
            color: 'grey',
            cursor: 'not-allowed',
    }

        return (
            <div>
                <strong>{this.props.title}</strong>
                <div style={bodyStyle}>
                    {this.props.data}
                </div>
            </div>
        )
    };
};

UserInfoBlock.protoTypes = {
    title: React.PropTypes.string.isRequired,
    data: React.PropTypes.string.isRequired,
};

export default UserInfoBlock;
