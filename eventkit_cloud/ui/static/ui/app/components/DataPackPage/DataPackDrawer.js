import React, {PropTypes, Component} from 'react'
import Drawer from 'material-ui/Drawer';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';

export class DataPackDrawer extends Component {
    constructor(props) {
        super(props);
    }

    render () {
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
                <div style={{width: '100%', paddingTop: '10px', paddingLeft: '10px', paddingRight: '10px'}}>
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
                        labelStyle={{color: '#4598bf', textTransform: 'none'}}
                        onClick={() => {console.log('Clear All')}}/>
                </div>
                <div style={{width: '100%', paddingTop: '10px', paddingLeft: '10px', paddingRight: '10px', lineHeight: '36px'}}>
                    <strong>Permissions</strong>
                    <FlatButton
                        style={{float: 'right', minWidth: 'none'}} 
                        hoverColor={'none'}
                        label={'Clear'}
                        labelStyle={{color: '#4598bf', textTransform: 'none'}}/>
                    <RadioButtonGroup name={"permissions"}>
                        <RadioButton
                            style={{width:'auto', float: 'left'}}
                            value={"Public"}
                            label={"Public"}
                        />
                        <RadioButton
                            style={{width:'auto', float: 'left'}}
                            value={"Private"}
                            label={"Private"}
                        />
                    </RadioButtonGroup>
                </div>
            </Drawer>
        )
    }
}

DataPackDrawer.propTypes = {
    open: React.PropTypes.bool.isRequired
}

export default DataPackDrawer;