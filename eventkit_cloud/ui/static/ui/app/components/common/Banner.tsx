import * as PropTypes from 'prop-types';
import * as React from 'react';

class Banner extends React.Component<{}, {}> {
    static contextTypes = {
        config: PropTypes.object,
    };

    render() {
        const style = {
            lineHeight: '25px',
            backgroundColor: this.context.config.BANNER_BACKGROUND_COLOR ?
                this.context.config.BANNER_BACKGROUND_COLOR : '#000',
            color: this.context.config.BANNER_TEXT_COLOR ?
                this.context.config.BANNER_TEXT_COLOR : '#fff',
            fontSize: '18px',
            textAlign: 'center' as 'center',
        };

        return (
            <div className="qa-Banner-div" style={style}>
                {this.context.config.BANNER_TEXT ? this.context.config.BANNER_TEXT : ''}
            </div>
        );
    }
}

export default Banner;
