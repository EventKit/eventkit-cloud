import React, {Component} from 'react'
import {connect} from 'react-redux'
import AppBar from 'material-ui/AppBar'
import BreadcrumbStepper from '../BreadcrumbStepper'
import Help from 'material-ui/svg-icons/action/help';

export class CreateExport extends React.Component {

    constructor() {
        super()
        this.handleWalkthroughReset = this.handleWalkthroughReset.bind(this);
        this.state = {
            walkthroughClicked : false
        }
    }

    handleWalkthroughReset() {
        this.setState({walkthroughClicked: false})
    }

    handleWalkthroughClick() {
        this.setState({walkthroughClicked: true})
    }

    render() {
        const pageTitle = <div style={{display: 'inline-block'}}><div style={{display: 'inline-block', paddingRight: '10px'}}>Create DataPack </div><div onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: '#4598bf', cursor:'pointer', display: 'inline-block', marginLeft:'10px', fontSize:'16px'}}><Help onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: '#4598bf', cursor:'pointer', height:'18px', width:'18px', verticalAlign:'middle', marginRight:'5px', marginBottom:'5px'}}/>{this.state.walkthroughClicked == false ? 'Page Tour' : 'Close Tour'}</div></div>
        //const pageTitle = <span>Create DataPack<Info onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: 'white', paddingLeft:'10px', paddingTop:'10px', width:'24px', cursor:'pointer'}}/></span>
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
                    walkthroughClicked={this.state.walkthroughClicked}
                    onWalkthroughReset={this.handleWalkthroughReset}/>
                <div >
                    {this.props.children}
                </div>

        </div>
        );
    }
}

export default CreateExport;
