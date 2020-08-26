import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { logout } from '../actions/userActions';

const createHandlers = (dispatch) => {
    const handleLogout = () => {
        dispatch(logout());
    };

    return {
        handleLogout,
    };
};

class Logout extends React.Component {
    constructor(props) {
        super(props);
        this.handlers = createHandlers(this.props.dispatch);
    }

    componentDidMount() {
        this.handlers.handleLogout();
    }

    render() {
        const styles = {
            wholeDiv: {
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                marginBottom: '0px',
            },
            root: {
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                height: 'calc(100vh - 95px)',
            },
        };
        return (
            <div style={styles.wholeDiv}>
                <div style={styles.root} />
            </div>
        );
    }
}

Logout.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Logout);
