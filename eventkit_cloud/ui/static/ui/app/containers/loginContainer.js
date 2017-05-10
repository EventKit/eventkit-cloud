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
import axios from 'axios';
import RaisedButton from 'material-ui/RaisedButton';

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
        login_form: false,
        oauth_name: ""
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

    componentDidMount() {
        axios.get('/oauth', {params: {query: "name"}}).then(function (response) {
            console.log("success in oauth")
            this.setState({oauth_name: response.data.name});
            console.log(this.state)
        }.bind(this)).catch(function (response) {
            console.log("failure in oauth")
        });

        axios.get('/auth').then(function (response) {
            console.log("success in auth")
            this.setState({login_form: true});
            console.log(this.state)
        }.bind(this)).catch(function (response) {
            console.log("failure in auth")
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.handleLogin(this.state);
    }

    handleOAuth(event) {
        event.preventDefault();
        window.location.href = "/oauth";
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }

    render() {
        let login_form = ''
        let oauth_button = ''
        if (this.state.login_form) {
            login_form = <form onSubmit={this.handleSubmit} onChange={this.onChange} className={styles.form}>
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
        }
        if (this.state.oauth_name) {
            oauth_button = <RaisedButton
                style={{minWidth: 'none', borderRadius: 'px', margin:10, marginTop:50, marginLeft: 'auto', marginRight: 'auto'}}
                buttonStyle={{borderRadius: '0px'}}
                backgroundColor={'#4598bf'}
                label={"Log in with " + this.state.oauth_name}
                labelStyle={{color: '#fff', textTransform: 'none'}}
                onClick={this.handleOAuth}/>
        }
        return <div style={{textAlign: 'center'}}>
            {login_form}
            {oauth_button}
        </div>
    }
}

const DISABLED_BUTTON = <div className={styles.disabledButton}>
    <FloatingActionButton name="submit"
                          mini={false}
                          type="submit"
                          disabled={true}
                          style={{marginLeft: 'auto', marginRight: 'auto'}}>
        <NavigationArrowForward />
    </FloatingActionButton>
</div>

const ENABLED_BUTTON = <div className={styles.enabledButton}>
    <FloatingActionButton name="submit"
                          mini={false}
                          type="submit"
                    style={{marginLeft: 'auto', marginRight: 'auto'}}>
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
