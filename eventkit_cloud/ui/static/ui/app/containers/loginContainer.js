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
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';

export class Form extends React.Component {

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    state = {
        username: '',
        password: '',
        button: DISABLED_BUTTON,
    };

    onChange(event) {
        this.setState({[event.target.name]: event.target.value}, function () {
            if (!this.state.username || !this.state.password) {
                this.setState({button: DISABLED_BUTTON})
            }
            else {
                this.setState({button: ENABLED_BUTTON})
            }
        });
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

                    {this.state.button}


            </form>
        )
    }
}
const DISABLED_BUTTON = <div className={styles.disabledButton}>
    <FloatingActionButton name="submit"
                          mini={false}
                          type="submit"
                          style={{marginRight: 12}}
                          disabled={true}>
        <NavigationArrowForward />
    </FloatingActionButton>
    </div>

const ENABLED_BUTTON = <div className={styles.enabledButton}>
    <FloatingActionButton name="submit"
                          mini={false}
                          type="submit"
                          style={{marginRight: 12}}>
        <NavigationArrowForward />
    </FloatingActionButton>
</div>


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
