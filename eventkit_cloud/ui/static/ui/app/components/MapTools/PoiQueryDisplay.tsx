import * as React from "react";
import axios from "axios";
import {getCookie, getFeatureUrl} from "../../utils/generic";
import {useEffect, useState} from "react";
import {TileCoordinate} from "../../utils/mapUtils";
import {MapLayer} from "../CreateDataPack/CreateExport";
import QueryDataBox from "../CreateDataPack/QueryDataBox";
import OlPoiOverlay from "./OpenLayers/OlPoiOverlay";

// The feature response data for a given coordinate specified by lat and long
interface FeatureResponse {
    lat: number;
    long: number;
    featureData: any;
    errorMessage?: string;
}

export interface Props {
    selectedLayer: MapLayer;
    style?: any;
    maxHeight?: number;
    name?: string;
    setVisibility?: (state: boolean) => void;
}

function PoiQueryDisplay(props: React.PropsWithChildren<Props>) {
    const [responseData, setResponseData ] = useState(null);
    const [closeCard, setCloseCard] = useState(true);
    const [lastCoordinate, setCoordinate] = useState(undefined);

    async function getFeatures(tileCoord: TileCoordinate) {
        setCoordinate(tileCoord);

        let responseData = {
            lat: tileCoord.lat,
            long: tileCoord.long,
        } as FeatureResponse;

        let url;
        try {
            url = getFeatureUrl(props.selectedLayer, tileCoord.z, tileCoord.y, tileCoord.x, tileCoord.i, tileCoord.j);
        }
        catch(error) {
            responseData.errorMessage = 'No data found at coordinates.';
            return responseData;
        }
        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url,
            method: 'get',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            if (Object.entries(response.data).length === 0) {
                responseData.errorMessage = 'No data found at coordinates.';
                return responseData;
            }
            const feature = response.data['features'][0];
            responseData['featureData'] = { ...feature['properties'] };
            return responseData;
        }).catch((error) => {
            responseData.errorMessage = error.response.data;
            return responseData;
        });
    }

    function setVisibility(visibility: boolean) {
        if (!props.setVisibility) {
            return;
        }
        props.setVisibility(visibility);
    }

    const [ showPin, setShowPin ] = useState(false);
    function handleMapClick(tileCoord: TileCoordinate) {
        if (!!props.selectedLayer && !!props.selectedLayer.mapUrl) {
            setCloseCard(false);
            setResponseData(undefined);
            setVisibility(true);

            getFeatures(tileCoord).then(featureResponseData => {
                setResponseData(featureResponseData);
            });
            setShowPin(true);
            return true;
        }
        setShowPin(false);
        return false;
    }

    function handleClose(event)  {
        event.preventDefault();
        setVisibility(false);
        setShowPin(false);
        setCloseCard(true);

    }

    useEffect(() => {
        if (!closeCard && !!lastCoordinate) {
            handleMapClick(lastCoordinate);
        }
    }, [props.selectedLayer.slug, props.selectedLayer.metadata.url]);

    // Mechanism by which to pass a reference to the added ol VectorLayer down to any children.
    const childrenWithProps = React.Children.map(props.children, (child : any) =>
        React.cloneElement(child, { onClick: handleMapClick, showPin})
    );

    return (
        <>
            {childrenWithProps}
            <OlPoiOverlay coordinate={lastCoordinate} closePoi={handleClose}>
                <QueryDataBox
                    {...(responseData) ? responseData : {}}
                    maxHeight={props.maxHeight}
                    style={props.style}
                    closeCard={closeCard}
                />
            </OlPoiOverlay>
        </>
    );
}

export default PoiQueryDisplay;