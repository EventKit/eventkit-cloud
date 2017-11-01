import React, {PropTypes, Component} from 'react'
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning';
import CustomScrollbar from '../CustomScrollbar';
import BaseDialog from '../BaseDialog';

export class ProviderError extends React.Component {
    constructor(props) {
        super(props)
        this.handleProviderErrorClose = this.handleProviderErrorClose.bind(this);
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
        const styles = {
            errorText: {
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#ce4427',
                cursor: 'pointer',
                fontWeight: 'bold'
            },
            warning: {
                marginLeft:'10px', 
                cursor: 'pointer', 
                display:'inlineBlock', 
                fill:'#ce4427', 
                verticalAlign: 'bottom'
            }
        }
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

        let errorTitle;
        let errorData;
        if(errors.length > 3){
            errorTitle = <strong id='error-title'>{provider.name} has <strong style={{color:'#ce4427'}}>{errors.length} error(s).</strong></strong>;
            errorData = errors.slice(0,3).map((error, index) => (
                <div style={{marginTop:'15px', width:'100%'}} key={index} id='error-data'>
                    <Warning className={'qa-ProviderError-Warning->3'} style={{marginRight: '10px', display:'inlineBlock', fill:'#e8ac90', verticalAlign: 'bottom'}}/>
                    {error}
                    <Divider className={'qa-ProviderError-Divider->3'} style={{marginTop: '5px'}}/>
                </div>
            ))
        }
        else {
            errorTitle = <strong id='error-title'>{provider.name} has <strong style={{color:'#ce4427'}}> {errors.length} error(s) </strong></strong>
            errorData = errors.map((error, index) => (
                <div style={{marginTop:'15px', width:'100%'}} key={index} id='error-data'>
                    <Warning className={'qa-ProviderError-Warning-<3'} style={{marginRight: '10px', display:'inlineBlock', fill:'#e8ac90', verticalAlign: 'bottom'}}/>
                    {error}
                    <Divider className={'qa-ProviderError-Warning-<3'} style={{marginTop: '15px'}}/>
                </div>
            ))
        }

        return (
            <span  className={'qa-ProviderError-span-errorText'}>
                <a 
                    onClick={() => {this.handleProviderErrorOpen()}} 
                    style={styles.errorText}
                >
                    ERROR
                </a>
                <Warning
                    className={'qa-ProviderError-Warning'}
                    onClick={() => {this.handleProviderErrorOpen()}} 
                    style={styles.warning}
                />
                <BaseDialog
                    className={'qa-ProviderError-BaseDialog'}
                    show={this.state.providerErrorDialogOpen}
                    title={errorTitle}
                    onClose={this.handleProviderErrorClose}
                >
                    {errorData}
                </BaseDialog>
            </span>
        )
    }
}

ProviderError.propTypes = {
    provider: PropTypes.object.isRequired,
}

export default ProviderError;


