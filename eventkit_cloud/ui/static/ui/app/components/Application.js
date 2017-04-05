import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import logo from '../../images/eventkit-logo.1.png'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import Subheader from 'material-ui/Subheader'
import MenuItem from 'material-ui/MenuItem'
import { Link, IndexLink } from 'react-router';
import css from '../styles/TitleBar.css'
import {closeDrawer, openDrawer} from '../actions/exportsActions';
require ('../fonts/index.css');
import ClassificationBanner from './ClassificationBanner'
import AVLibraryBooks from 'material-ui/svg-icons/av/library-books';
import ContentAddBox from 'material-ui/svg-icons/content/add-box';
import ActionInfoOutline from 'material-ui/svg-icons/action/info-outline';
import SocialPerson from 'material-ui/svg-icons/social/person';
import ActionExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';


export class Application extends Component {
    constructor(props) {
        super(props);
        this.state = {open: true}
        this.state.drawerOpen = true

        this.handleToggle = this.handleToggle.bind(this)
        this.handleClose = this.handleClose.bind(this)
    }

    componentWillMount() {
        if (window.innerWidth <= 700){
            this.props.closeDrawer();
        }
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

    render() {

        const contentStyle = {  transition: 'margin-left 450ms cubic-bezier(0.23, 1, 0.32, 1)' };

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
                marginLeft: '0px',
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

        return (
            <MuiThemeProvider>
                <div className={styles.root}>
                    <ClassificationBanner />
                    <header className="header" style={{height: '95px'}}>
                        <AppBar style={styles.appBar} title={img} onLeftIconButtonTouchTap={this.handleToggle.bind(this)} />
                    </header>
                    <Drawer className={css.drawer}
                            containerStyle={styles.drawer}
                            overlayStyle={styles.drawer}
                            docked={true}
                            open={this.props.drawerOpen}
                            onRequestChange={(open) => this.setState({open})}>
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
                        <MenuItem className={css.menuItem} >
                            <IndexLink className={css.link} activeClassName={css.active} onlyActiveOnIndex={true} to="/exports">
                                <AVLibraryBooks style={{height: '22px', width: '22px'}}/>
                                &nbsp;&nbsp;&nbsp;DataPack Library
                            </IndexLink>
                        </MenuItem>
                        <MenuItem className={css.menuItem} >
                            <Link className={css.link} activeClassName={css.active} to="/create" >
                                <ContentAddBox style={{height: '22px', width: '22px'}}/>
                                &nbsp;&nbsp;&nbsp;Create Datapack
                            </Link>
                        </MenuItem>
                        <MenuItem className={css.menuItem} >
                            <Link className={css.link} activeClassName={css.active} to="/about" >
                                <ActionInfoOutline style={{height: '22px', width: '22px'}}/>
                                &nbsp;&nbsp;&nbsp;About EventKit
                            </Link>
                        </MenuItem>
                        <MenuItem className={css.menuItem} >
                            <Link className={css.link} activeClassName={css.active} to="/account" >
                                <SocialPerson style={{height: '22px', width: '22px'}}/>
                                &nbsp;&nbsp;&nbsp;Account Settings
                            </Link>
                        </MenuItem>
                        <MenuItem className={css.menuItem} >
                            <Link className={css.link} activeClassName={css.active} to="/logout" >
                                <ActionExitToApp style={{height: '22px', width: '22px'}}/>
                                &nbsp;&nbsp;&nbsp;Log Out
                            </Link>
                        </MenuItem>
                    </Drawer>
                    <div style={contentStyle} className={css.contentStyle}>
                    {this.props.children}
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
};

function mapStateToProps(state) {
    return {
        drawerOpen: state.drawerOpen,
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
