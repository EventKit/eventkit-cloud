import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from '../styles/CreateExport.css'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import BreadcrumbStepper from './BreadcrumbStepper'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import primaryStyles from '../styles/constants.css'

class CreateExport extends React.Component {

    constructor() {
        super()
        
    }

    render() {
        let location = this.props.location
        const pageTitle = "Create DataPack"
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                marginTop: '25px'
            },
        }

        return (
            <div>
                <AppBar className={primaryStyles.sectionTitle} style={styles.appBar} title={pageTitle}
                        iconElementLeft={<p></p>}
                        iconElementRight={<IconMenu iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                                              anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                                              targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                                              <MenuItem primaryText="Save & Exit" />
                                              <MenuItem primaryText="Save & Share" />
                                              <MenuItem primaryText="Discard" />

                                            </IconMenu>}
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
    location:        React.PropTypes.object.isRequired,
    bbox:            React.PropTypes.arrayOf(React.PropTypes.number),
};

function mapStateToProps(state) {
    return {
        location: state.location,
        bbox: state.bbox,
    };
}


export default connect(
    mapStateToProps,
)(CreateExport);
