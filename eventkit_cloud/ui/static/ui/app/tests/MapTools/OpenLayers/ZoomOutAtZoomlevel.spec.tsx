import * as React from 'react';
import {render, screen, getByText, waitFor, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'
import ZoomOutAtZoomLevel from "../../../components/MapTools/OpenLayers/ZoomOutAtZoomLevel";
import {useOlMapContainer, useOlZoom} from "../../../components/MapTools/context/OpenLayersContext";

jest.mock('../../../components/MapTools/context/OpenLayersContext', () => {
    return {
        useOlZoom: jest.fn(),
        useOlMapContainer: jest.fn(),
    }
});

describe('CreateDataPackButton component', () => {
    const defaultProps = () => ({
        zoomLevel: 14,
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        (useOlMapContainer as any).mockImplementation(() => {
            return {
                mapContainer: {
                    getMap: () => ({
                        getView: () => ({
                            setZoom: jest.fn(),
                        }),
                    }),
                }
            }
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

    it('should say job processing when job is not complete.', () => {
        const {container, rerender} = setup();
        expect(container.firstChild).toBeNull();
        expect(useOlMapContainer().mapContainer.getMap().getView().setZoom).not.toHaveBeenCalled();
        (useOlZoom as any).mockImplementation(() => {
            return {zoomLevel: 17}
        });
        rerender(<ZoomOutAtZoomLevel {...defaultProps()}/>);
    });
});
