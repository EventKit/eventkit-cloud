import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../../styles/DrawAOIToolbar.css';
import DrawBoxButton from './DrawBoxButton';
import DrawFreeButton from './DrawFreeButton';
import MapViewButton from './MapViewButton';
import ImportButton from './ImportButton';
import {updateMode} from '../../actions/exportsActions.js';
import {setBoxButtonSelected, setFreeButtonSelected, setMapViewButtonSelected, setImportButtonSelected, setImportModalState, setAllButtonsDefault} from '../../actions/mapToolActions';


export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.setAllButtonsDefault();
    }

    render() {
        return (
            <div>
                <div className={styles.drawButtonsContainer}>
                    <div className={styles.drawButtonsTitle}><strong>TOOLS</strong></div>
                    <DrawBoxButton 
                        handleCancel={(sender) => this.props.handleCancel(sender)}
                        buttonState={this.props.toolbarIcons.box}
                        updateMode={this.props.updateMode}
                        setBoxButtonSelected={this.props.setBoxButtonSelected}
                        setAllButtonsDefault={this.props.setAllButtonsDefault}
                    />
                    <DrawFreeButton 
                        handleCancel={(sender) => this.props.handleCancel(sender)}
                        buttonState={this.props.toolbarIcons.free}
                        updateMode={this.props.updateMode}
                        setFreeButtonSelected={this.props.setFreeButtonSelected}
                        setAllButtonsDefault={this.props.setAllButtonsDefault}
                    />
                    <MapViewButton 
                        handleCancel={(sender) => this.props.handleCancel(sender)}
                        buttonState={this.props.toolbarIcons.mapView}
                        setMapView={this.props.setMapView}
                        setMapViewButtonSelected={this.props.setMapViewButtonSelected}
                        setAllButtonsDefault={this.props.setAllButtonsDefault}
                    />
                    <ImportButton 
                        handleCancel={(sender) => this.props.handleCancel(sender)}
                        buttonState={this.props.toolbarIcons.import}
                        setImportButtonSelected={this.props.setImportButtonSelected}
                        setImportModalState={this.props.setImportModalState}
                        setAllButtonsDefault={this.props.setAllButtonsDefault}
                    />
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        toolbarIcons: state.toolbarIcons,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        },
        setBoxButtonSelected: () => {
            dispatch(setBoxButtonSelected());
        },
        setFreeButtonSelected: () => {
            dispatch(setFreeButtonSelected());
        },
        setMapViewButtonSelected: () => {
            dispatch(setMapViewButtonSelected());
        },
        setImportButtonSelected: () => {
            dispatch(setImportButtonSelected());
        },
        setImportModalState: (visible) => {
            dispatch(setImportModalState(visible));
        }
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DrawAOIToolbar);
