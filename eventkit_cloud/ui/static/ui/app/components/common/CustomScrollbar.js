import { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';

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
            opacity: '0.7',
            borderRadius: '5px',
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
