import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../../styles/SearchAOIButton.css';
import {setSearchAOIButtonSelected, setAllButtonsDefault} from '../../actions/mapToolActions';
import {updateMode} from '../../actions/exportsActions';
import ActionSearch from 'material-ui/svg-icons/action/search';
import ContentClear from 'material-ui/svg-icons/content/clear';

export class SearchAOIButton extends Component {
    
    constructor(props) {
        super(props) 
        this.handleOnClick = this.handleOnClick.bind(this);
        this.state = {
            icon: DEFAULT_ICON,
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.toolbarIcons.search != this.props.toolbarIcons.search) {
            // If the button has been selected update the button state
            if(nextProps.toolbarIcons.search == 'SELECTED') {
                this.setState({icon: SELECTED_ICON});
            }
            // If the button has been de-selected update the button state
            if(nextProps.toolbarIcons.search == 'DEFAULT') {
                this.setState({icon: DEFAULT_ICON});
            }
            // If the button has been set as inactive update the state
            if(nextProps.toolbarIcons.search == 'INACTIVE') {
                this.setState({icon: INACTIVE_ICON});
            }
        }
    }

    handleOnClick() {
        if(this.state.icon == SELECTED_ICON) {
            this.props.handleCancel();            
            this.props.setAllButtonsDefault();
        }
    }

    render() {
        return(
            <button className={styles.buttonGeneral} onClick={this.handleOnClick}>
                {this.state.icon}
            </button>
        )
    }
}

const DEFAULT_ICON = <div>
                        <ActionSearch className={styles.defaultButton}/>
                        <div className={styles.buttonName}>SEARCH</div>
                    </div>
                    
const INACTIVE_ICON = <div>
                        <ActionSearch className={styles.inactiveButton}/>
                        <div className={styles.buttonName + ' ' + styles.buttonNameInactive}>SEARCH</div>
                    </div>

const SELECTED_ICON =<div>
                        <ContentClear className={styles.selectedButton}/>
                        <div className={styles.buttonName}>SEARCH</div>
                    </div>

SearchAOIButton.propTypes = {
    toolbarIcons: React.PropTypes.object,
    handleCancel: React.PropTypes.func,
    setSearchAOIButtonSelected: React.PropTypes.func,
    setAllButtonsDefault: React.PropTypes.func,
    
}

function mapStateToProps(state) {
    return {
        toolbarIcons: state.toolbarIcons,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setSearchAOIButtonSelected: () => {
            dispatch(setSearchAOIButtonSelected());
        },
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchAOIButton);