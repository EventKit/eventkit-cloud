import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import {Menu, MenuItem} from 'material-ui/Menu'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import {
    TextField,
} from 'redux-form-material-ui'
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
        this.state = {
            username: '',
            password: '',
            button: DISABLED_BUTTON,
            login_form: false,
            oauth_name: ""
        };
    }

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

    checkAuthEndpoint = () => {
        return axios.get('/auth').then(function (response) {
            this.setState({login_form: true});
        }.bind(this)).catch(function (response) {
        });
    }

    checkOAuthEndpoint = () => {
        return axios.get('/oauth', {params: {query: "name"}}).then(function (response) {
            this.setState({oauth_name: response.data.name});
        }.bind(this)).catch(function (response) {
        });
    }

    componentDidMount() {
        this.checkAuthEndpoint();
        this.checkOAuthEndpoint();
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
        const styles = {
            form: {
                verticalAlign: 'center',
                margin: '0 auto',
                width: '70%',
            },
            heading: {
                width: '100%',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: '15px auto 0px auto',
            },
            input: {
                backgroundColor: 'rgba(179,205,224,.2)',
                fontSize: '16px',
                width: '100%',
                height: '45px',
                color: '#e2e2e2',
                margin: '15px auto 0px auto',
                padding: '10px'
            }
        }
        let login_form = ''
        let oauth_button = ''
        if (this.state.login_form) {
            login_form = <form onSubmit={this.handleSubmit} onChange={this.onChange} style={styles.form}>
                <div style={styles.heading}>Enter Login Information</div>
                <input 
                    id="username"
                    name="username"
                    placeholder="Username"
                    style={styles.input}
                    type="text"
                />
                <input 
                    id="password"
                    name="password"
                    placeholder="Password"
                    onChange={this.onChange}
                    style={styles.input}
                    type="password"
                />
                {this.state.button}
            </form>
        }
        if (this.state.oauth_name) {
            oauth_button = <RaisedButton className={'OAuthButton'}
                style={{
                    minWidth: 'none',
                    borderRadius: 'px',
                    margin: '15px auto 15px auto',
                }}
                buttonStyle={{borderRadius: '0px'}}
                backgroundColor={'#4598bf'}
                label={"Log in with " + this.state.oauth_name}
                labelStyle={{color: '#fff', textTransform: 'none'}}
                onClick={this.handleOAuth}/>
        }
        return <div style={{verticalAlign: 'center', textAlign: 'center'}}>
            {login_form}
            {oauth_button}
        </div>
    }
}

const DISABLED_BUTTON = <FloatingActionButton 
                            name="submit"
                            mini={false}
                            type="submit"
                            disabled={true}
                            disabledColor={'#b4b7b8'}
                            style={{margin: '30px auto 15px auto'}}
                        >
                            <NavigationArrowForward />
                        </FloatingActionButton>

const ENABLED_BUTTON = <FloatingActionButton name="submit"
                          mini={false}
                          type="submit"
                          backgroundColor={'#55ba63'}
                          style={{margin: '30px auto 15px auto'}}>
        <NavigationArrowForward />
    </FloatingActionButton>

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
