import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import {Menu, MenuItem} from 'material-ui/Menu'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import {
    TextField,
} from 'redux-form-material-ui'
import styles from '../components/auth/Login.css'
import {login} from '../actions/userActions'
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import '../components/tap_events';

export class Form extends React.Component {

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    onChange(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.handleLogin(this.state);
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit} onChange={this.onChange} className={styles.form}>
                <div className={styles.heading}>Enter Login Information</div>
                <div className={styles.fieldWrapper}>
                    <input id="username"
                           name="username"
                           placeholder="Username"
                           className={styles.textField}
                           type="text"/>

                </div>
                <div className={styles.fieldWrapper}>
                    <input id="password"
                           name="password"
                           placeholder="Password"
                           className={styles.textField}
                           onChange={this.onChange}
                           type="password"
                    />
                </div>
                <div className={styles.submitButton}>
                    <FloatingActionButton name="submit"
                                          mini={false}
                                          type="submit"
                                          style={{marginRight: 12}}>
                        <i className="fa fa-arrow-right fa-lg" aria-hidden="true"></i>
                    </FloatingActionButton>
                </div>
            </form>
        )
    }
}

function mapDispatchToProps(dispatch) {
    return {
        handleLogin: (params) => {
            dispatch(login(params));
        },
    };
}

Form.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
}

export default connect(null, mapDispatchToProps)(Form);
