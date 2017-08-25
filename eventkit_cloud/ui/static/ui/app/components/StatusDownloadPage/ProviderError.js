import React, {PropTypes, Component} from 'react'
import '../tap_events'
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning';
import CustomScrollbar from '../CustomScrollbar';

export class ProviderError extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            providerErrorDialogOpen: false,
        }
    }

    handleProviderErrorOpen() {
        this.setState({providerErrorDialogOpen: true});
    };

    handleProviderErrorClose() {
        this.setState({providerErrorDialogOpen: false});
    };


    render() {
        let provider = this.props.provider;
        let errors = [];

        provider.tasks.forEach((column) => {
            if(column.display == true) {
                if(column.errors.length != 0) {
                    let error = column.errors[0].exception;
                    errors.push(error);
                }
            }
        });

        let errorData;
        if(errors.length > 3){
            errorData =  <div>
                <strong>{provider.name} has <strong style={{color:'#ce4427'}}>{errors.length} error(s).</strong></strong>
                    <div style={{marginTop:'15px', marginBottom:'15px'}}>The first three errors:
                    </div>
                <CustomScrollbar style={{height: '200px', overflowX: 'hidden', width:'100%'}}>
                    {errors.slice(0,3).map((error, index) => (
                        <div style={{marginTop:'15px', width:'95%'}} key={index} >
                            <Warning style={{marginRight: '10px', display:'inlineBlock', fill:'#e8ac90', verticalAlign: 'bottom'}}/>
                            {error}
                            <Divider style={{marginTop: '5px'}}/>
                        </div>
                    ))}
                </CustomScrollbar>
                    <div style={{marginTop:'25px'}}><strong>You may want to restart processing the files or contact an administrator.
                    </strong></div>

            </div>
        }
        else {
            errorData = <div> <div style={{marginBottom:'15px'}}><strong>{provider.name} has <strong style={{color:'#ce4427'}}> {errors.length} error(s) </strong></strong></div>
                <CustomScrollbar style={{height: '200px', overflowX: 'hidden', width:'100%'}}>
                {errors.map((error, index) => (
                    <div style={{marginTop:'25px', width:'95%'}} key={index} >
                        <Warning style={{marginRight: '10px', display:'inlineBlock', fill:'#e8ac90', verticalAlign: 'bottom'}}/>
                        {error}
                        <Divider style={{marginTop: '15px'}}/>
                    </div>
                ))}
                </CustomScrollbar>

            </div>
        }


        const providerErrorActions = [
            <RaisedButton
                style={{margin: '10px'}}
                labelStyle={{color: 'whitesmoke', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: '#4598bf'}}
                disableTouchRipple={true}
                label="Close"
                primary={false}
                onTouchTap={this.handleProviderErrorClose.bind(this)}
            />,
        ];

        return (
            <span><a onClick={() => {this.handleProviderErrorOpen()}} style={{
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#ce4427',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}>ERROR</a>
            <Warning onClick={() => {this.handleProviderErrorOpen()}} style={{marginLeft:'10px', cursor: 'pointer', display:'inlineBlock', fill:'#ce4427', verticalAlign: 'bottom'}}/>
            <Dialog
                contentStyle={{width:'70%', minWidth:'300px', maxWidth:'610px'}}
                actions={providerErrorActions}
                modal={false}
                open={this.state.providerErrorDialogOpen}
                onRequestClose={this.handleProviderErrorClose.bind(this)}
            >
                {errorData}

    </Dialog></span>

        )
    }
}

ProviderError.propTypes = {
    provider: PropTypes.object.isRequired,
}

export default ProviderError;


