import React, {Component} from 'react'
import {connect} from 'react-redux'
import AppBar from 'material-ui/AppBar'
import BreadcrumbStepper from '../BreadcrumbStepper'
import Info from 'material-ui/svg-icons/action/info';

export class CreateExport extends React.Component {

    constructor() {
        super()
        this.state = {
            walkthrough : false
        }
    }

    handleWalkthroughClick() {
        this.setState({walkthrough: true})
    }

    render() {
        const pageTitle = <span>Create DataPack<Info onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: 'white', paddingLeft:'10px', paddingTop:'10px', width:'24px', cursor:'pointer'}}/></span>
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
                <BreadcrumbStepper
                    walkthrough={this.state.walkthrough}/>
                <div >
                    {this.props.children}
                </div>

        </div>
        );
    }
}

export default CreateExport;
