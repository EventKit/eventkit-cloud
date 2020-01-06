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
                backgroundColor: '#fff',
                height: '230px',
                left: '10px',
                position: 'absolute',
                top: '70px',
                width: '50px',
                zIndex: 1,
                ...this.props.containerStyle,
            },
            title: {
                fontSize: '.7em',
                height: '30px',
                lineHeight: '30px',
                textAlign: 'center',
                width: '50px',
            },
        };

        return (
            <div id="container" className="qa-DrawAOIToolbar-div" style={styles.container}>
                <div className="qa-DrawAOIToolbar-div-title" style={styles.title}>
                    <strong>{this.props.title}</strong>
                </div>
                <DrawBoxButton
                    buttonState={this.props.toolbarIcons.box}
                    handleCancel={this.props.handleCancel}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                    setBoxButtonSelected={this.props.setBoxButtonSelected}
                    updateMode={this.props.updateMode}
                />
                <DrawFreeButton
                    buttonState={this.props.toolbarIcons.free}
                    handleCancel={this.props.handleCancel}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                    setFreeButtonSelected={this.props.setFreeButtonSelected}
                    updateMode={this.props.updateMode}
                />
                <MapViewButton
                    buttonState={this.props.toolbarIcons.mapView}
                    handleCancel={this.props.handleCancel}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                    setMapView={this.props.setMapView}
                    setMapViewButtonSelected={this.props.setMapViewButtonSelected}
                />
                <ImportButton
                    buttonState={this.props.toolbarIcons.import}
                    handleCancel={this.props.handleCancel}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                    setImportButtonSelected={this.props.setImportButtonSelected}
                    setImportModalState={this.props.setImportModalState}
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
    containerStyle: PropTypes.object,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setBoxButtonSelected: PropTypes.func.isRequired,
    setFreeButtonSelected: PropTypes.func.isRequired,
    setImportButtonSelected: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    setMapView: PropTypes.func.isRequired,
    setMapViewButtonSelected: PropTypes.func.isRequired,
    title: PropTypes.string,
    toolbarIcons: PropTypes.shape({
        box: PropTypes.string,
        free: PropTypes.string,
        import: PropTypes.string,
        mapView: PropTypes.string,
        search: PropTypes.string,
    }).isRequired,
    updateMode: PropTypes.func.isRequired,
};

export default DrawAOIToolbar;
