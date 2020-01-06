import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

export class CustomScrollbar extends Component {
    scrollToTop() {
        this.scrollbar.scrollToTop();
    }

    scrollToBottom() {
        this.scrollbar.scrollToBottom();
    }

    scrollToMiddle() {
        const scrollHeight = this.scrollbar.getScrollHeight();
        this.scrollbar.scrollTop(scrollHeight / 4);
    }

    renderThumb({ style, ...props }) {
        const thumbStyle = {
            backgroundColor: '#8A898B',
            borderRadius: '5px',
            opacity: '0.7',
            zIndex: 99,
        };
        return (
            <div style={{ ...style, ...thumbStyle }} {...props} />
        );
    }

    render() {
        return (
            <Scrollbars
                ref={(instance) => { this.scrollbar = instance; }}
                renderThumbVertical={this.renderThumb}
                {...this.props}
            />
        );
    }
}

export default CustomScrollbar;
