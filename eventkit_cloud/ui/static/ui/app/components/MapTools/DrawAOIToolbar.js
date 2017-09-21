import React, {Component, PropTypes} from 'react';
import DrawBoxButton from './DrawBoxButton';
import DrawFreeButton from './DrawFreeButton';
import MapViewButton from './MapViewButton';
import ImportButton from './ImportButton';

export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.setAllButtonsDefault();
    }

    render() {
        const styles = {
            container: {
                zIndex: 1, 
                position: 'absolute', 
                width: '50px', 
                height: '230px', 
                top: '70px', 
                right: '10px', 
                backgroundColor: '#fff',
                ...this.props.containerStyle
            },
            title: {
                textAlign: 'center', 
                height: '30px', 
                width: '50px', 
                fontSize: '.7em', 
                lineHeight: '30px'
            }
        }
        return (
            <div>
                <div id='container' style={styles.container}>
                    <div className={'qa-DrawAOIToolbar-div-title'} id='title' style={styles.title}><strong>TOOLS</strong></div>
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

DrawAOIToolbar.propTypes = {
    toolbarIcons: PropTypes.object,
    updateMode: PropTypes.func,
    setMapView: PropTypes.func,
    handleCancel: PropTypes.func,
    setAllButtonsDefault: PropTypes.func,
    setBoxButtonSelected: PropTypes.func,
    setFreeButtonSelected: PropTypes.func,
    setMapViewButtonSelected: PropTypes.func,
    setImportButtonSelected: PropTypes.func,
    setImportModalState: PropTypes.func,
    containerStyle: PropTypes.object,
}

export default DrawAOIToolbar;
