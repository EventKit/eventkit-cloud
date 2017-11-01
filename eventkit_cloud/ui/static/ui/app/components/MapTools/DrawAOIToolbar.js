import React, { Component, PropTypes } from 'react';
import DrawBoxButton from './DrawBoxButton';
import DrawFreeButton from './DrawFreeButton';
import MapViewButton from './MapViewButton';
import ImportButton from './ImportButton';
import BufferButton from './BufferButton';

export class DrawAOIToolbar extends Component {
    componentDidMount() {
        this.props.setAllButtonsDefault();
    }

    render() {
        const styles = {
            container: {
                zIndex: 1,
                position: 'absolute',
                width: '50px',
                height: this.props.showBufferButton ? '260px' : '230px',
                top: '70px',
                right: '10px',
                backgroundColor: '#fff',
                ...this.props.containerStyle,
            },
            title: {
                textAlign: 'center',
                height: '30px',
                width: '50px',
                fontSize: '.7em',
                lineHeight: '30px',
            },
        };

        return (
            <div id="container" style={styles.container}>
                <div className="qa-DrawAOIToolbar-div-title" style={styles.title}>
                    <strong>TOOLS</strong>
                </div>
                <DrawBoxButton
                    handleCancel={this.props.handleCancel}
                    buttonState={this.props.toolbarIcons.box}
                    updateMode={this.props.updateMode}
                    setBoxButtonSelected={this.props.setBoxButtonSelected}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                />
                <DrawFreeButton
                    handleCancel={this.props.handleCancel}
                    buttonState={this.props.toolbarIcons.free}
                    updateMode={this.props.updateMode}
                    setFreeButtonSelected={this.props.setFreeButtonSelected}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                />
                <MapViewButton
                    handleCancel={this.props.handleCancel}
                    buttonState={this.props.toolbarIcons.mapView}
                    setMapView={this.props.setMapView}
                    setMapViewButtonSelected={this.props.setMapViewButtonSelected}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                />
                <ImportButton
                    handleCancel={this.props.handleCancel}
                    buttonState={this.props.toolbarIcons.import}
                    setImportButtonSelected={this.props.setImportButtonSelected}
                    setImportModalState={this.props.setImportModalState}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                />
                {this.props.showBufferButton ?
                    <BufferButton onBufferClick={this.props.onBufferClick} />
                    :
                    null
                }
            </div>
        );
    }
}

DrawAOIToolbar.defaultProps = {
    containerStyle: {},
    showBufferButton: false,
    onBufferClick: null,
};

DrawAOIToolbar.propTypes = {
    toolbarIcons: PropTypes.object.isRequired,
    updateMode: PropTypes.func.isRequired,
    setMapView: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setBoxButtonSelected: PropTypes.func.isRequired,
    setFreeButtonSelected: PropTypes.func.isRequired,
    setMapViewButtonSelected: PropTypes.func.isRequired,
    setImportButtonSelected: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    containerStyle: PropTypes.object,
    showBufferButton: PropTypes.bool,
    onBufferClick: PropTypes.func,
};

export default DrawAOIToolbar;
