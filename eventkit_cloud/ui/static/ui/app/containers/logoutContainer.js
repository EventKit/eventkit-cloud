import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import { logout } from '../actions/userActions';
import styles from '../components/auth/Login.css'


let createHandlers = function(dispatch) {
    let handleLogout = function (node, data) {
        dispatch(logout())
    };

    return {
        handleLogout,
    };
}

class Logout extends React.Component {

    constructor(props) {
        super(props);
        this.handlers = createHandlers(this.props.dispatch);
    }

    componentDidMount() {
        this.handlers.handleLogout();
    }

    render() {
        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>
                </div>
            </div>
        )
    }
}

export default connect()(Logout);

