import React, {Component, PropTypes} from 'react';

export class InvalidDrawWarning extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const style = {
            display: this.props.show ? 'initial' : 'none',
            position: 'absolute',
            top: '70px',
            right: '80px',
            width: '200px',
            border: '1px solid transparent',
            padding: '5px 5px 5px 10px',
            backgroundColor: '#d9534f',
            borderColor: '#d43f3a',
            color: '#fff',
            zIndex: 2,
            opacity: .7,
            fontSize: '12px'
        }
        
        return (
            <div style={style}>
                <span>You drew an invalid bounding box, please redraw.</span>
            </div>
        )
    }
}

InvalidDrawWarning.propTypes = {
    show: PropTypes.bool.isRequired,
};

export default InvalidDrawWarning;
