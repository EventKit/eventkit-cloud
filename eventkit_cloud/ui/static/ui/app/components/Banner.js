import * as React from 'react'
import axios from 'axios';

class Banner extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const style = {
            position: 'absolute',
            left: 0,
            right: 0,
            lineHeight: '25px',
            backgroundColor: this.context.config.BANNER_BACKGROUND_COLOR ? this.context.config.BANNER_BACKGROUND_COLOR : '#000',
            color: this.context.config.BANNER_TEXT_COLOR ? this.context.config.BANNER_TEXT_COLOR: '#fff',
            fontSize: '18px',
            textAlign: 'center'
        }

        return (
            <div className={'qa-Banner-div'} style={style}>
                {this.context.config.BANNER_TEXT ? this.context.config.BANNER_TEXT: ''}
            </div>
        )
    }
}

Banner.contextTypes = {
    config: React.PropTypes.object
}

export default Banner;
