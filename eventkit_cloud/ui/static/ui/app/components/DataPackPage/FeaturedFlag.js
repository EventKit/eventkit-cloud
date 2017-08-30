import React, {PropTypes, Component} from 'react';

export class FeaturedFlag extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const style = {
            backgroundColor: '#4498c0', 
            color: '#fff', 
            textAlign: 'center', 
            fontSize: '11px', 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            width: 100, 
            height: 17,
            ...this.props.style
        };

        if (!this.props.show) {return null}

        return (
            <div style={style}>FEATURED</div>
        )      
    }
}

FeaturedFlag.propTypes = {
    show: PropTypes.bool.isRequired,
    style: PropTypes.object
};

export default FeaturedFlag;
