import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

export class CustomScrollbar extends Component {
    constructor(props, ...rest) {
        super(props, ...rest);
    }

    renderThumb({style, ...props}) {
        const thumbStyle = {backgroundColor: '#000', opacity: '0.5', borderRadius: '5px'};
        return (
            <div style={{...style, ...thumbStyle}} {...props}/>
        );
    }
    
    render() {
        return (
            <Scrollbars
                renderThumbVertical={this.renderThumb}
                {...this.props}/>
        );
    }
}

export default CustomScrollbar;
