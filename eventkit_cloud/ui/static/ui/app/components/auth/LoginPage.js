import React from 'react'
import LoginForm from '../../containers/loginContainer'
import styles from './Login.css'
import Paper from 'material-ui/Paper'

class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
    }

    componentWillMount() {
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    render() {
        return (
               <div className={styles.wholeDiv}>
                <div className={styles.root} style={{height: window.innerHeight - 95}}>
                    <Paper className={styles.paper} zDepth={2} rounded>
                        <LoginForm/>
                    </Paper>
                </div>
            </div>
        )
    }
}
export default LoginPage;