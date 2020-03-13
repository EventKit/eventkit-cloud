import React, {useState, useEffect} from 'react';
import {MapContainer} from "../../../utils/mapBuilder";
import {OlMapProvider, OlZoomProvider} from "../context/OpenLayersContext";
import {useEffectOnMount} from "../../../utils/hooks";

export interface MapComponentProps {
    divId: string;
    style?: any;
    zoomLevel?: number;
    minZoom?: number;
    maxZoom?: number;
    visible?: boolean;
}

MapComponent.defaultProps = {
    minZoom: 2,
    maxZoom: 20,
    style: {},
    visible: true,
} as MapComponentProps;

function MapComponent(props: React.PropsWithChildren<MapComponentProps>) {
    const [ mapContainer, setMapContainer ] = useState();

    const { minZoom, maxZoom, style, divId, visible } = props;
    const zoomLevelProp = props.zoomLevel;
    const [zoomLevel, setZoom] = useState(zoomLevelProp || minZoom);
    const [olZoomLevel, setOlZoom] = useState(zoomLevelProp || minZoom);

    useEffectOnMount(() => {
        const mapContainer = new MapContainer(zoomLevel, minZoom, maxZoom);
        setMapContainer(mapContainer);

        const olMap = mapContainer.getMap();
        olMap.setTarget(divId);

        olMap.getView().on('change:resolution', () =>
            setOlZoom(olMap.getView().getZoom())
        );

        return function cleanup() {
            olMap.setTarget(null);
        };
    });

    useEffect(() => {
        if (!!mapContainer) {
            const olMap = mapContainer.getMap();
            olMap.updateSize();
        }
    }, [visible, divId]);

    const mapZoomLevel = Math.floor(olZoomLevel);
    useEffect(() => {
        // Effect runs when the Open Layers map updates its zoom level.
        if (!!mapContainer) {
            setZoom(mapZoomLevel);
            mapContainer.getMap().getView().setZoom(mapZoomLevel);
        }
    }, [mapZoomLevel]);

    useEffect(() => {
        // Effect runs when the zoomLevel prop changes, updates the map zoom level
        if (!!mapContainer) {
            setZoom(zoomLevelProp);
            mapContainer.getMap().getView().setZoom(zoomLevelProp);
            mapContainer.getMap().updateSize();
        }
    }, [zoomLevelProp]);

    const displayStyle = (style.display) ? style.display : 'block';
    return (
        <OlMapProvider value={{ mapContainer: mapContainer }}>
            <OlZoomProvider value={{
                zoomLevel: zoomLevel,
                olZoomLevel,
                setZoom,
            }}>
                <div style={{...style, display: (visible) ? displayStyle : 'none'}} id={divId}>
                    {!!mapContainer && props.children}
                </div>
            </OlZoomProvider>
        </OlMapProvider>
    );
}

export default MapComponent;
