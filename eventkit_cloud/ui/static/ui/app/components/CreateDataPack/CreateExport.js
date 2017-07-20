import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from '../../styles/CreateExport.css'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import BreadcrumbStepper from '../BreadcrumbStepper'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import primaryStyles from '../../styles/constants.css'

export class CreateExport extends React.Component {

    constructor() {
        super()
        
    }

    render() {
        const pageTitle = "Create DataPack"
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            iconButton: {
                padding: 'none', 
                width: '30px', 
                height: '30px'
            }
        }

        return (
            <div>
                <AppBar className={primaryStyles.sectionTitle} style={styles.appBar} title={pageTitle}
                        iconStyleRight={{marginTop: '2px'}}
                        iconElementLeft={<p style={{display: 'none'}}/>}
                        /*iconElementRight={
                            <IconMenu style={{height: '30px', width: '30px'}} 
                                iconButtonElement={
                                    <IconButton style={styles.iconButton}>
                                        <MoreVertIcon />
                                    </IconButton>}
                                anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                                targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                                <MenuItem primaryText="Save & Exit" />
                                <MenuItem primaryText="Save & Share" />
                                <MenuItem primaryText="Discard" />
                            </IconMenu>}*/
                />
                <BreadcrumbStepper/>
                
                <div >
                    {this.props.children}
                </div>

        </div>

        );
    }

    
}


CreateExport.propTypes = {
};

export default CreateExport;
