
import React, {Component} from 'react'
import logo from '../../images/logo_white_medium.png'
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import FontIcon from 'material-ui/FontIcon';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MenuItem from 'material-ui/MenuItem'
import {red500, yellow500, blue500} from 'material-ui/styles/colors';




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
        console.log("open")
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
                position: 'fixed',
                left: '50%',
                marginLeft: '-100px',
                marginTop: '35px'
            },
            drawer: {
                marginTop: '95px',
                backgroundColor: '#010101',
            },
            menuItem: {
                color: 'white',
            }
        };


        const img = <img style={styles.img} src={logo}/>

        return (
        <header className="header">
            <AppBar style={styles.appBar} title={img} onLeftIconButtonTouchTap={this.handleToggle.bind(this)} />
            <Drawer containerStyle={styles.drawer}
                    docked={false}
                    open={this.state.drawerOpen}
                    onRequestChange={(open) => this.setState({open})}>
                <MenuItem style={styles.menuItem} onTouchTap={this.handleClose.bind(this)}>Menu Item 1</MenuItem>
                <MenuItem style={styles.menuItem} onTouchTap={this.handleClose.bind(this)}>Menu Item 2 </MenuItem>
                <MenuItem style={styles.menuItem} onTouchTap={this.handleClose.bind(this)}>Menu Item 3 </MenuItem>
            </Drawer>

        </header>
        )
    }
}

TitleBar.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};
export default TitleBar