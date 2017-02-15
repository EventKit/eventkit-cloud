import React, {Component} from 'react'
import logo from '../../images/eventkit-logo.1.png'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import Subheader from 'material-ui/Subheader'
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MenuItem from 'material-ui/MenuItem'
import { Link, IndexLink } from 'react-router';
import css from '../styles/TitleBar.css'

class TitleBar extends Component {
    constructor(props){
        super(props);
        this.state = {drawerOpen:false};
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }

    handleToggle() {
        this.setState({drawerOpen: !this.state.drawerOpen});
    }

    handleClose() { this.setState({drawerOpen: false}); }
    render() {

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
        <header className="header">
            <AppBar style={styles.appBar}  title={img} onLeftIconButtonTouchTap={this.handleToggle.bind(this)} />
            <Drawer containerStyle={styles.drawer}
                    overlayStyle={styles.drawer}
                    docked={false}
                    open={this.state.drawerOpen}
                    onRequestChange={(open) => this.setState({open})}>
                <Subheader inset={false}><span style={{width:'100%'}}><div style={styles.mainMenu}>MAIN MENU</div><div style={{display:'inline-block'}}><i className="fa fa-long-arrow-left fa-lg" style={{color: '#4498c0'}} onTouchTap={this.handleClose.bind(this)} aria-hidden="true"></i></div></span></Subheader>
                <MenuItem className={css.menuItem} onTouchTap={this.handleClose.bind(this)}><IndexLink className={css.link} activeClassName={css.active} onlyActiveOnIndex={true} to="/exports"><i className="fa fa-book" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;DataPack Library</IndexLink></MenuItem>
                <MenuItem className={css.menuItem} onTouchTap={this.handleClose.bind(this)}><Link className={css.link} activeClassName={css.active} to="/create" ><i className="fa fa-plus-square" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Create Datapack</Link></MenuItem>
                <MenuItem className={css.menuItem} onTouchTap={this.handleClose.bind(this)}><Link className={css.link} activeClassName={css.active} to="/about" ><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;About EventKit</Link></MenuItem>
                <MenuItem className={css.menuItem} onTouchTap={this.handleClose.bind(this)}><Link className={css.link} activeClassName={css.active} to="/account" ><i className="fa fa-user" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Account Settings</Link></MenuItem>
                <MenuItem className={css.menuItem} onTouchTap={this.handleClose.bind(this)}><Link className={css.link} activeClassName={css.active} to="/logout" ><i className="fa fa-sign-out" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Log Out</Link></MenuItem>
            </Drawer>

        </header>
        )
    }
}

TitleBar.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};
export default TitleBar