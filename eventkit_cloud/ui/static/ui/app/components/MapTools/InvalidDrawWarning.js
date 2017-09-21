import React, {Component, PropTypes} from 'react';
import styles from '../../styles/InvalidDrawWarning.css';

export class InvalidDrawWarning extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={'qa-InvalidDrawWardning-div'} style={{display: this.props.show ? 'initial' : 'none'}}>
                <span>You drew an invalid bounding box, please redraw.</span>
            </div>
        )
    }
}

InvalidDrawWarning.propTypes = {
    show: PropTypes.bool.isRequired,
};

export default InvalidDrawWarning;
