import React, {Component} from 'react';

export class Warning extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        const bodyStyle = {
            backgroundColor: 'whitesmoke', 
            width: '100%', 
            margin: '5px 0px 20px 0px', 
            lineHeight: '25px', 
            padding: '16px', 
            color: 'red',
            border: '2px solid red',
            textAlign: 'center',
        }

        return (
            <div>
                <div style={bodyStyle}>
                    {this.props.text}
                </div>
            </div>
        )
    };
};

Warning.protoTypes = {
    text: React.PropTypes.string.isRequired,
};

export default Warning;
