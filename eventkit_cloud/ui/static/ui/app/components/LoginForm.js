import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import Paper from 'material-ui/Paper'
import { Menu, MenuItem } from 'material-ui/Menu'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import axios from 'axios'
import {
    TextField,
} from 'redux-form-material-ui'
import styles from './Login.css'

class LoginForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: ''
        }

        this.onChange = this.onChange.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
    }
    onChange(e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    onSubmit(e) {
         e.preventDefault()
        console.log(this.state)
        axios.post('django.contrib.auth.views.login', {user: this.state})
    }

    componentDidMount() {

    }
    render() {
        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>
                    <form onSubmit={this.onSubmit} className={styles.form}>
                        <Paper className={styles.paper} zDepth={2} rounded>
                            <div className={styles.heading}>Enter Login Information</div>
                            <div className={styles.fieldWrapper}>
                                   <input name="username"
                                          value={this.state.username}
                                          className={styles.textField}
                                          onChange={this.onChange}
                                          type="text"/>

                            </div>
                            <div className={styles.fieldWrapper}>
                                <input name="password"
                                       value={this.state.password}
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


LoginForm.propTypes = {

}


export default reduxForm({
    form: 'loginForm',
    initialValues: {

    }
})(LoginForm)
