import PropTypes from 'prop-types';
import { Component } from 'react';

class Banner extends Component {
    render() {
        const style = {
            lineHeight: '25px',
            backgroundColor: this.context.config.BANNER_BACKGROUND_COLOR
                ? this.context.config.BANNER_BACKGROUND_COLOR : '#000',
            color: this.context.config.BANNER_TEXT_COLOR
                ? this.context.config.BANNER_TEXT_COLOR : '#fff',
            fontSize: '18px',
            textAlign: 'center',
        };

        return (
            <div className="qa-Banner-div" style={style}>
                {this.context.config.BANNER_TEXT ? this.context.config.BANNER_TEXT : ''}
            </div>
        );
    }
}

Banner.contextTypes = {
    config: PropTypes.object,
};

export default Banner;
