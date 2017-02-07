import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm, Field} from 'redux-form'
import Paper from 'material-ui/Paper'
import {Menu, MenuItem} from 'material-ui/Menu'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import axios from 'axios'
import {
    TextField,
} from 'redux-form-material-ui'
import styles from '../components/login/Login.css'
import cookie from 'react-cookie';
import redirectSubmitted from './redirect'
import submitForm from './form'
import login from './login'


// @redirectSubmitted('/')
class Form extends React.Component {

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
    }

    onChange(event) {
        this.setState({[event.target.name]: event.target.value})
    }

    onSubmit(event) {
        event.preventDefault()
        const {username, password} = this.state
        this.props.onSubmit(username, password)
    }

    render() {
        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>
                    <form onSubmit={this.onSubmit} onChange={this.onChange} className={styles.form}>
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

export default submitForm(Form, login)
