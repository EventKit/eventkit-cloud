import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import Paper from 'material-ui/Paper'
import {Menu, MenuItem} from 'material-ui/Menu'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import {
    TextField,
} from 'redux-form-material-ui'
import styles from '../components/login/Login.css'
import { login } from '../actions/userActions'
import axios from 'axios'

class Form extends React.Component {

    constructor(props) {
        super(props);
        // this.handlers = createHandlers(this.props.dispatch);
        this.onChange = this.onChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        const { username, password } = this.props;
    }

    onChange(event) {
         this.setState({[event.target.name]: event.target.value});
    }

    componentDidMount() {
        axios.get('/login/').catch((error) => {
            console.log(error);
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        const { username, password } = this.state;
        this.props.dispatch(login({'username': username, 'password': password}));
    };

    render() {

        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>
                    <form onSubmit={this.handleSubmit} onChange={this.onChange} className={styles.form}>
                        <Paper className={styles.paper} zDepth={2} rounded>
                            <div className={styles.heading}>Enter Login Information</div>
                            <div className={styles.fieldWrapper}>
                                <input name="username"
                                       placeholder="Username"
                                       className={styles.textField}
                                       type="text"/>

                            </div>
                            <div className={styles.fieldWrapper}>
                                <input name="password"
                                       placeholder="Password"
                                       className={styles.textField}
                                       onChange={this.onChange}
                                       type="password"
                                />
                            </div>
                            <div className={styles.submitButton}>
                                <FloatingActionButton mini={false}
                                                      type="submit"
                                                      style={{marginRight: 12}}>
                                    <i className="fa fa-arrow-right fa-lg" aria-hidden="true"></i>
                                </FloatingActionButton>
                            </div>
                        </Paper>
                    </form>
                </div>
            </div>
        )
    }
}

export default connect()(Form);
