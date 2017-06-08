import React from 'react';
import axios from 'axios';
import LoginForm from '../../containers/loginContainer';
import Paper from 'material-ui/Paper';
import CustomScrollbar from '../CustomScrollbar';

export class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.getDisclaimer = this.getDisclaimer.bind(this);
        this.state = {
            disclaimer: "",
        }
    }

    componentDidMount() {
        this.getDisclaimer();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    getDisclaimer() {
        return axios.get('/disclaimer')
        .then((response) => {
            if(response.data) {
                this.setState({disclaimer: response.data});
            }
        }).catch((error) => {
        });
    }

    render() {
        const mobile = window.innerWidth < 768;

        const styles = {
            wholeDiv: {
                width: '100%',
                height: window.innerHeight - 95,
                backgroundColor: '#111823',
            },
            root: {
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                
            },
            paper: {
                display: 'inline-block',
                backgroundImage: "url('../../../images/topoBackground.jpg')",
                backgroundRepeat: 'repeat repeat',
                padding: '30px',
                height: '390px',
                width: '100%',
            },
            container: {
                margin: mobile && this.state.disclaimer ? '0px auto' : `${(window.innerHeight - 95 - 420)/2}px auto`,
                maxWidth: 1200
            },
            paperContainer: {
                width: '50%', 
                margin: '0px auto', 
                maxWidth: '600px', 
                verticalAlign: 'middle', 
                display: mobile || !this.state.disclaimer ? 'block' : 'inline-block', 
                padding: '15px', 
                minWidth: '360px'
            },
            disclaimerHeading: {
                color: '#fff', 
                fontSize: '16px',
                marginBottom: '5px', 
                textAlign: 'center'
            }
        }

        return (
               <div style={styles.wholeDiv}>
                <CustomScrollbar style={{height: window.innerHeight - 95}}>
                    <div style={styles.container}>
                        <div style={styles.paperContainer}>
                            <Paper style={styles.paper} zDepth={2}>
                                <LoginForm/>
                            </Paper>
                        </div>

                        {this.state.disclaimer ? 
                            <div style={styles.paperContainer}>
                                <Paper style={{...styles.paper, backgroundColor: '#1D2B3C', backgroundImage: ''}} zDepth={2}>
                                    <CustomScrollbar style={{height: 330}}>
                                        <div style={styles.disclaimerHeading}><strong>ATTENTION</strong></div>
                                        <div style={{color: '#fff', paddingRight: '10px'}} dangerouslySetInnerHTML={{__html: this.state.disclaimer}}/>
                                    </CustomScrollbar>
                                </Paper>
                            </div>
                        : null}
                    </div>
                </CustomScrollbar>
            </div>
        )
    }
}

export default LoginPage;
