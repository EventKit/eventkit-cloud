import React, {useState, useEffect, createContext} from 'react';
import {MapContainer} from "../../../utils/mapBuilder";
import {OlMapProvider, OlZoomProvider} from "../context/OpenLayersContext";
import {useEffectOnMount} from "../../../utils/hooks";

interface Props {
    divId: string;
    style?: any;
    zoomLevel?: number;
    minZoom?: number;
    maxZoom?: number;
}

MapComponent.defaultProps = {
    minZoom: 2,
    maxZoom: 20,
    style: {},
} as Props;

function MapComponent(props: React.PropsWithChildren<Props>) {
    const [ mapContainer, setMapContainer ] = useState();

    const { zoomLevel, minZoom, maxZoom, style, divId } = props;
    const [zoomLevelState, setZoom] = useState(zoomLevel || minZoom);

    useEffectOnMount(() => {
        const mapContainer = new MapContainer(zoomLevelState, minZoom, maxZoom);
        setMapContainer(mapContainer);

        const olMap = mapContainer.getMap();
        olMap.setTarget(divId);
        olMap.getView().on('change:resolution', () => setZoom(Math.floor(olMap.getView().getZoom())));  // Update zoom level on resolution change

        return function cleanup() {
            olMap.setTarget(null);
        };
    });

    useEffect(() => {
        if (!!mapContainer) {
            setZoom(zoomLevelState);
            mapContainer.getMap().getView().setZoom(zoomLevelState);
        }
    }, [zoomLevelState]);

    return (
        <OlMapProvider value={{ mapContainer: mapContainer }}>
            <OlZoomProvider value={{
                zoomLevel: zoomLevelState,
                setZoom,
            }}>
                <div style={style} id={divId}>
                    {!!mapContainer && props.children}
                </div>
            </OlZoomProvider>
        </OlMapProvider>
    );
}

export default MapComponent;