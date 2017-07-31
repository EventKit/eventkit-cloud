import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../../styles/DrawAOIToolbar.css';
import {setFreeButtonSelected, setAllButtonsDefault} from '../../actions/mapToolActions';
import ContentCreate from 'material-ui/svg-icons/content/create';
import ContentClear from 'material-ui/svg-icons/content/clear';
import {updateMode} from '../../actions/exportsActions';

export class DrawFreeButton extends Component {

    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.state = {
            icon: DEFAULT_ICON,
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.toolbarIcons.free != this.props.toolbarIcons.free) {
            // If the button has been selected update the button state
            if(nextProps.toolbarIcons.free == 'SELECTED') {
                this.setState({icon: SELECTED_ICON});
            }
            // If the button has been de-selected update the button state
            if(nextProps.toolbarIcons.free == 'DEFAULT') {
                this.setState({icon: DEFAULT_ICON});
            }
            // If the button has been set as inactive update the state
            if(nextProps.toolbarIcons.free == 'INACTIVE') {
                this.setState({icon: INACTIVE_ICON});
            }
        }
    }

    handleOnClick() {
        if(this.state.icon == SELECTED_ICON) {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();

        }
        else if(this.state.icon == DEFAULT_ICON) {
            this.props.setFreeButtonSelected();
            this.props.updateMode('MODE_DRAW_FREE');
        }
    }

    render() {
        return (
            <button className={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {this.state.icon}
            </button>
        )
    }
}

const DEFAULT_ICON = <div>
                        <ContentCreate className={styles.defaultButton}/>
                        <div className={styles.buttonName}>DRAW</div>
                    </div>

const INACTIVE_ICON = <div>
                        <ContentCreate className={styles.inactiveButton}/>
                        <div className={styles.buttonName + ' ' + styles.buttonNameInactive}>DRAW</div>
                    </div>

const SELECTED_ICON =<div>
                        <ContentClear className={styles.selectedButton}/>
                        <div className={styles.buttonName}>DRAW</div>
                    </div>

function mapStateToProps(state) {
    return {
        toolbarIcons: state.toolbarIcons,
        mode: state.mode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        setFreeButtonSelected: () => {
            dispatch(setFreeButtonSelected());
        },
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DrawFreeButton);
