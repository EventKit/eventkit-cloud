import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../../styles/InvalidDrawWarning.css';

export class InvalidDrawWarning extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={styles.invalidWarning} style={{display: this.props.show ? 'initial' : 'none'}}>
                <span>You drew an invalid bounding box, please redraw.</span>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        show: state.showInvalidDrawWarning
    };
}

InvalidDrawWarning.propTypes = {
    show: React.PropTypes.bool.isRequired,
};

export default connect(
    mapStateToProps,
    null
)(InvalidDrawWarning);
