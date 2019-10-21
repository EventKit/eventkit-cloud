import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DrawBoxButton from './DrawBoxButton';
import DrawFreeButton from './DrawFreeButton';
import MapViewButton from './MapViewButton';
import ImportButton from './ImportButton';

export class DrawAOIToolbar extends Component {
    render() {
        const styles = {
            container: {
                zIndex: 1,
                position: 'absolute',
                width: '50px',
                height: '230px',
                top: '70px',
                left: '10px',
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
            <div id="container" className="qa-DrawAOIToolbar-div" style={styles.container}>
                <div className="qa-DrawAOIToolbar-div-title" style={styles.title}>
                    <strong>{this.props.title}</strong>
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
            </div>
        );
    }
}

DrawAOIToolbar.defaultProps = {
    containerStyle: {},
    title: 'AOI TOOLS',
};

DrawAOIToolbar.propTypes = {
    toolbarIcons: PropTypes.shape({
        box: PropTypes.string,
        free: PropTypes.string,
        mapView: PropTypes.string,
        import: PropTypes.string,
        search: PropTypes.string,
    }).isRequired,
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
    title: PropTypes.string,
};

export default DrawAOIToolbar;
