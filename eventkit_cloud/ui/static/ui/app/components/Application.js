import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import axios from 'axios';
import logo from '../../images/eventkit-logo.1.png'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import Subheader from 'material-ui/Subheader'
import MenuItem from 'material-ui/MenuItem'
import { Link, IndexLink } from 'react-router';
import css from '../styles/TitleBar.css'
import {closeDrawer, openDrawer} from '../actions/exportsActions';
require ('../fonts/index.css');
import Banner from './Banner'
import AVLibraryBooks from 'material-ui/svg-icons/av/library-books';
import ContentAddBox from 'material-ui/svg-icons/content/add-box';
import ActionInfoOutline from 'material-ui/svg-icons/action/info-outline';
import SocialPerson from 'material-ui/svg-icons/social/person';
import ActionExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const muiTheme = getMuiTheme({
    datePicker: {
        selectColor: '#253447',
    },
    flatButton: {
        textColor: '#253447',
        primaryTextColor: '#253447'
    },
});


export class Application extends Component {
    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this)
        this.handleClose = this.handleClose.bind(this)
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.getConfig = this.getConfig.bind(this);
        this.state = {
            config: {}
        }
    }

    componentWillReceiveProps(nextProps) {
        // if the user is logged in and the screen is large the drawer should be open
         if(nextProps.userData != this.props.userData) {
             if(nextProps.userData != null && window.innerWidth >= 1200) {
                 this.props.openDrawer();
             }
         }
    }

    componentDidMount() {
        this.getConfig()
    }

    handleToggle() {
        if(this.props.drawerOpen) {
            this.props.closeDrawer();
        }
        else {
            this.props.openDrawer();
        }
    }

    handleClose() { 
        this.props.closeDrawer();
    }

    onMenuItemClick() {
        if(window.innerWidth < 1200) {
            this.handleToggle();
        }
    }

    getChildContext() {
        return {
            config: this.state.config
        }
        
    }

    getConfig() {
        return axios.get('/configuration')
        .then((response) => {
            if(response.data) {
                this.setState({config: response.data});
            }
        }).catch((error) => {
        
        });
    }

    render() {
        const contentStyle = {transition: 'margin-left 450ms cubic-bezier(0.23, 1, 0.32, 1)'};
        if (this.props.drawerOpen) {
            contentStyle.marginLeft = 200;
        }
        const styles = {
            appBar: {
                backgroundColor: 'black',
                height: '70px',
                top: '25px'
            },
            img: {
                position: 'absolute',
                left: '50%',
                marginLeft: '-127px',
                marginTop: '10px',
                height: '50px'
            },
            drawer: {
                width: '200px',
                marginTop: '95px',
                backgroundColor: '#010101',
                
                padding: '0px'
            },
            mainMenu: {
                color: '#3e3f3f',
                display: 'inline-block',
                marginRight: '40px',
                fontSize: '20px',
                align: 'left',
            },
        };

        const img = <img style={styles.img} src={logo}/>

        const childrenWithContext = React.Children.map(this.props.children, (child) => {
            return React.cloneElement(child, {
                context: {config: this.state.config}
            });
        });

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <div style={{backgroundColor: '#000'}}>
                    <Banner />
                    <header className="header" style={{height: '95px'}}>
                        <AppBar style={styles.appBar} title={img} onLeftIconButtonTouchTap={this.handleToggle.bind(this)} />
                    </header>
                    <Drawer
                        containerStyle={styles.drawer}
                        overlayStyle={styles.drawer}
                        docked={true}
                        open={this.props.drawerOpen}
                    >
                        <Subheader inset={false}>
                            <span style={{width:'100%'}}>
                                <div style={styles.mainMenu}>MAIN MENU</div>
                                <div style={{display:'inline-block'}}>
                                    <a href="#">
                                        <NavigationArrowBack style={{fill: '4498c0', verticalAlign: 'middle', paddingBottom: '3px'}} onClick={this.handleClose.bind(this)}/>
                                    </a>
                                </div>
                            </span>
                        </Subheader>
                        <MenuItem className={css.menuItem} onClick={this.onMenuItemClick}>
                            <IndexLink className={css.link} activeClassName={css.active} onlyActiveOnIndex={true} to="/exports">
                                <AVLibraryBooks style={{height: '22px', width: '22px', marginRight: '11px'}}/>
                                DataPack Library
                            </IndexLink>
                        </MenuItem>
                        <MenuItem className={css.menuItem} onClick={this.onMenuItemClick}>
                            <Link className={css.link} activeClassName={css.active} to="/create" >
                                <ContentAddBox style={{height: '22px', width: '22px', marginRight: '11px'}}/>
                                Create DataPack
                            </Link>
                        </MenuItem>
                        <MenuItem className={css.menuItem} onClick={this.onMenuItemClick}>
                            <Link className={css.link} activeClassName={css.active} to="/about" >
                                <ActionInfoOutline style={{height: '22px', width: '22px', marginRight: '11px'}}/>
                                About EventKit
                            </Link>
                        </MenuItem>
                        <MenuItem className={css.menuItem} onClick={this.onMenuItemClick}>
                            <Link className={css.link} activeClassName={css.active} to="/account" >
                                <SocialPerson style={{height: '22px', width: '22px', marginRight: '11px'}}/>
                                Account Settings
                            </Link>
                        </MenuItem>
                        <MenuItem className={css.menuItem} onClick={this.handleClose}>
                            <Link className={css.link} activeClassName={css.active} to="/logout" >
                                <ActionExitToApp style={{height: '22px', width: '22px', marginRight: '11px'}}/>
                                Log Out
                            </Link>
                        </MenuItem>
                    </Drawer>
                    <div style={contentStyle} className={css.contentStyle}>
                        <div>{childrenWithContext}</div>
                    </div>
                </div>
            </MuiThemeProvider>
        )
    }
}
Application.propTypes = {
    children: PropTypes.object,
    openDrawer: PropTypes.func,
    closeDrawer: PropTypes.func,
    userDate: PropTypes.object,
    drawerOpen: PropTypes.bool,
};

Application.childContextTypes = {
    config: PropTypes.object,
}

function mapStateToProps(state) {
    return {
        drawerOpen: state.drawerOpen,
        userData: state.user.data,

    }
}

function mapDispatchToProps(dispatch) {
    return {
        closeDrawer: () => {
            dispatch(closeDrawer());
        },
        openDrawer: () => {
            dispatch(openDrawer());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Application);
