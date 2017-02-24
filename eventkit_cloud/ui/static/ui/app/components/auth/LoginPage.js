import React from 'react'
import LoginForm from '../../containers/loginContainer'
import styles from './Login.css'
import Paper from 'material-ui/Paper'

class LoginPage extends React.Component {

    render() {
        return (
               <div className={styles.wholeDiv}>
                <div className={styles.root}>
                    <Paper className={styles.paper} zDepth={2} rounded>
                        <LoginForm/>
                    </Paper>
                </div>
            </div>
        )
    }
}
export default LoginPage;