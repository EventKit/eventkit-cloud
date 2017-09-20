import React, {Component} from 'react'
import {connect} from 'react-redux'
import AppBar from 'material-ui/AppBar'
import BreadcrumbStepper from '../BreadcrumbStepper'

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
            pageTitle: {
                fontSize: '18px', 
                lineHeight: '35px', 
                paddingLeft: '10px',
                height: '35px'
            }
        }

        return (
            <div>
                <AppBar 
                    style={styles.appBar} 
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{marginTop: '2px'}}
                    iconElementLeft={<p style={{display: 'none'}}/>}
                />
                <BreadcrumbStepper/>
                <div >
                    {this.props.children}
                </div>

        </div>
        );
    }
}

export default CreateExport;
