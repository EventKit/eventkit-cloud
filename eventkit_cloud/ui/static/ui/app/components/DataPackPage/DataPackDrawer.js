import React, {PropTypes, Component} from 'react'
import Drawer from 'material-ui/Drawer';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import DatePicker from 'material-ui/DatePicker';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';
import ContentCreate from 'material-ui/svg-icons/content/create';
import NotificationSync from 'material-ui/svg-icons/notification/sync';

export class DataPackDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            permissions: null,
            status: null,
            minDate: null,
            maxDate: null,
        }
    }

    render () {
        const styles = {
            drawerSection: {width: '100%', paddingTop: '10px', paddingLeft: '10px', paddingRight: '10px', lineHeight: '36px'},
        }
        return (
            <Drawer 
                width={200} 
                openSecondary={true} 
                open={this.props.open}
                containerStyle={
                    {
                        backgroundColor: '#fff',
                        top: '221px',
                        height: window.innerHeight - 221
                    }
                }>
                <div style={styles.drawerSection}>
                    <RaisedButton
                        style={{minWidth: 'none', borderRadius: '0px'}}
                        buttonStyle={{borderRadius: '0px'}}
                        backgroundColor={'#4598bf'}
                        label={'Apply'}
                        labelStyle={{color: '#fff', textTransform: 'none'}}
                        onClick={() => {console.log('Apply')}}/>
                    <FlatButton
                        style={{float: 'right', minWidth: 'none'}}
                        hoverColor={'none'}
                        label={'Clear All'}
                        labelStyle={{color: '#4598bf', textTransform: 'none', paddingRight: '0px'}}
                        onClick={() => {console.log('Clear All')}}/>
                </div>


                <div style={styles.drawerSection}>
                    <strong>Permissions</strong>
                    <FlatButton
                        style={{float: 'right', minWidth: 'none'}} 
                        hoverColor={'none'}
                        label={'Clear'}
                        labelStyle={{color: '#4598bf', textTransform: 'none', paddingRight: '0px'}}
                        onClick={()=> {this.setState({permissions: null})}}/>
                    <div style={{width: '100px', height: '58px', display: 'inline-block'}}>
                        <RadioButtonGroup 
                                name={"permissions"} 
                                onChange={(event, value) => {console.log(value); this.setState({permissions: value})}}
                                valueSelected={this.state.permissions}>
                            <RadioButton
                                style={{width:'100px', float: 'left'}}
                                iconStyle={{fill: 'grey', marginRight: '5px'}}
                                labelStyle={{color: 'grey'}}
                                value={"Private"}
                                label={"Private"}
                            />
                            <RadioButton
                                style={{width:'100px', float: 'left'}}
                                iconStyle={{fill: 'grey', marginRight: '5px'}}
                                labelStyle={{color: 'grey'}}
                                value={"Public"}
                                label={"Public"}
                            /> 
                        </RadioButtonGroup>
                    </div>
                    <div style={{width: '80px', height: '58px', display: 'inline-block'}}>
                        <SocialPerson style={{float: 'right', marginLeft: '20px', fill: '#bcdfbb', height: '26px', marginBottom: '2px'}}/>
                        <SocialGroup style={{float: 'right', marginLeft: '20px', fill: 'grey', height: '26px', marginBottom: '2px'}}/>
                    </div>
                </div>


                <div style={styles.drawerSection}>
                    <strong>Export Status</strong>
                    <FlatButton
                        style={{float: 'right', minWidth: 'none'}} 
                        hoverColor={'none'}
                        label={'Clear'}
                        labelStyle={{color: '#4598bf', textTransform: 'none', paddingRight: '0px'}}
                        onClick={()=> {this.setState({status: null})}}/>
                    <div style={{width: '100px', height: '87px', display: 'inline-block'}}>
                        <RadioButtonGroup 
                                name={"status"} 
                                onChange={(event, value) => {console.log(value); this.setState({status: value})}}
                                valueSelected={this.state.status}>
                            <RadioButton
                                style={{width:'100px', float: 'left'}}
                                iconStyle={{fill: 'grey', marginRight: '5px'}}
                                labelStyle={{color: 'grey'}}
                                value={"Complete"}
                                label={"Complete"}
                            />
                            <RadioButton
                                style={{width:'100px', float: 'left'}}
                                iconStyle={{fill: 'grey', marginRight: '5px'}}
                                labelStyle={{color: 'grey'}}
                                value={"Incomplete"}
                                label={"Incomplete"}
                            /> 
                            <RadioButton
                                style={{width:'100px', float: 'left'}}
                                iconStyle={{fill: 'grey', marginRight: '5px'}}
                                labelStyle={{color: 'grey'}}
                                value={"Running"}
                                label={"Running"}
                            /> 
                        </RadioButtonGroup>
                    </div>
                    <div style={{width: '80px', height: '87px', display: 'inline-block'}}>
                        <p style={{width: '80px', height: '29px', margin: '0px'}}/>
                        <ContentCreate style={{float: 'right', marginLeft: '20px', fill: '#f4D225', height: '26px', marginBottom: '2px'}}/>
                        <NotificationSync style={{float: 'right', marginLeft: '20px', fill: '#f4D225', height: '26px', marginBottom: '2px'}}/>
                    </div>
                </div>

                <div style={styles.drawerSection}>
                    <strong>Date Added</strong>
                    <FlatButton
                        style={{float: 'right', minWidth: 'none'}} 
                        hoverColor={'none'}
                        label={'Clear'}
                        labelStyle={{color: '#4598bf', textTransform: 'none', paddingRight: '0px'}}
                        onClick={()=> {this.setState({minDate: null, maxDate: null})}}/>
                    <DatePicker
                        onChange={(e, d) => {console.log(d)}}
                        autoOk={true}
                        hintText={"Min Date"}
                        textFieldStyle={{fontSize: '14px', height: '36px'}}
                        onChange={(e, date) => {console.log(date); this.setState({minDate: date})}}
                        value={this.state.minDate}
                    />
                    <DatePicker
                        onChange={(e, d) => {console.log(d)}}
                        autoOk={true}
                        hintText={"Max Date"}
                        textFieldStyle={{fontSize: '14px', height: '36px'}}
                        onChange={(e, date) => {console.log(date); this.setState({maxDate: date})}}
                        value={this.state.maxDate}
                    />
                </div>
            </Drawer>
        )
    }
}

DataPackDrawer.propTypes = {
    open: React.PropTypes.bool.isRequired
}

export default DataPackDrawer;