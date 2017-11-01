import React, {Component, PropTypes} from 'react';
import ActionSearch from 'material-ui/svg-icons/action/search';
import ContentClear from 'material-ui/svg-icons/content/clear';

export class SearchAOIButton extends Component {
    
    constructor(props) {
        super(props) 
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if(this.props.buttonState == 'SELECTED') {
            this.props.handleCancel();            
            this.props.setAllButtonsDefault();
        }
    }

    render() {
        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                color: '#4498c0',
                bottom: '0px',
                fontSize: '.5em',
                width: '50px',
                height: '12px',
            },
            buttonGeneral: {
                height: '50px',
                width: '50px',
                borderLeft: '1px solid #e6e6e6',
                borderBottom: 'none',
                borderTop: 'none',
                borderRight: 'none',
                margin: '0px',
                padding: '0px',
                backgroundColor: '#fff',
                outline: 'none',
            }

        }
        const DEFAULT_ICON = <div id='default_icon'>
                <ActionSearch className={'qa-SearchAOIButton-ActionSearch-default'} style={{fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div className={'qa-SearchAOIButton-div-default'} style={styles.buttonName}>SEARCH</div>
            </div>
                    
        const INACTIVE_ICON = <div id='inactive_icon'>
                <ActionSearch className={'qa-SearchAOIButton-ActionSearch-inactive'} style={{opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div className={'qa-SearchAOIButton-div-default'}style={{...styles.buttonName, opacity: 0.4}}>SEARCH</div>
            </div>

        const SELECTED_ICON =<div id='selected_icon'>
                <ContentClear className={'qa-SearchAOIButton-ContentClear'} style={{fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div className={'qa-SearchAOIButton-div'} style={styles.buttonName}>SEARCH</div>
            </div>

        return(
            <button className={'qa-SearchAOIButton-button'}style={styles.buttonGeneral} onClick={this.handleOnClick}>
                {state == 'DEFAULT' ? DEFAULT_ICON : state == 'INACTIVE' ? INACTIVE_ICON : SELECTED_ICON}
            </button>
        )
    }
}

SearchAOIButton.propTypes = {
    buttonState: PropTypes.string,
    handleCancel: React.PropTypes.func,
    setAllButtonsDefault: React.PropTypes.func,
}

export default SearchAOIButton;

