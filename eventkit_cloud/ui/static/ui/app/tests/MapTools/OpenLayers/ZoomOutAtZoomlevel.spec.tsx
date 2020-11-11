import * as React from 'react';
import {render, screen, getByText, waitFor, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'
import ZoomOutAtZoomLevel from "../../../components/MapTools/OpenLayers/ZoomOutAtZoomLevel";
import {useOlMapContainer, useOlZoom} from "../../../components/MapTools/context/OpenLayersContext";
import {act} from "react-dom/test-utils";

jest.mock('../../../components/MapTools/context/OpenLayersContext', () => {
    return {
        useOlZoom: jest.fn(),
        useOlMapContainer: jest.fn(),
    }
});

const view = {
    setZoom: jest.fn(),
};
const map = {
    getView: () => view,
};
const mapContainer = {
    mapContainer: {
        getMap: () => map,
    }
};

describe('ZoomOutAtZoomLevel component', () => {
    const defaultProps = () => ({
        zoomLevel: 14,
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        (useOlMapContainer as any).mockImplementation(() => {
            return mapContainer;
        });
        (useOlZoom as any).mockImplementation(() => {
            return {zoomLevel: 13}
        });
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        return render(<ZoomOutAtZoomLevel {...props} />);
    };

    it('should render null and call setZoom on the maps view when the context is above props.zoomLevel', async () => {
        const {container, rerender} = setup();
        expect(container.firstChild).toBeNull();
        expect(useOlMapContainer().mapContainer.getMap().getView().setZoom).not.toHaveBeenCalled();
        (useOlZoom as any).mockImplementation(() => {
            return {zoomLevel: 17}
        });

        rerender(<ZoomOutAtZoomLevel {...defaultProps()}/>);
        expect(useOlMapContainer().mapContainer.getMap().getView().setZoom).toHaveBeenCalled();
        expect(useOlMapContainer().mapContainer.getMap().getView().setZoom).toHaveBeenCalledTimes(1);
        // Current functionality expects it to set the zoom to 2
        expect(useOlMapContainer().mapContainer.getMap().getView().setZoom).toHaveBeenCalledWith(2);

        (useOlZoom as any).mockImplementation(() => {
            return {zoomLevel: 3}
        });
        rerender(<ZoomOutAtZoomLevel {...defaultProps()}/>);
        // Shouldn't be called again
        expect(useOlMapContainer().mapContainer.getMap().getView().setZoom).toHaveBeenCalledTimes(1);
    });
});
