import React, {useEffect, useState} from 'react';
import BreadcrumbStepper from "./BreadcrumbStepper";
import {getCookie, isZoomLevelInRange} from "../../utils/generic";
import {allHaveArea, featureToBbox, WGS84} from '../../utils/mapUtils';
import {updateExportInfo} from '../../actions/datacartActions';
import {getProviders} from '../../actions/providerActions';
import axios from "axios";
import {connect} from "react-redux";
import * as PropTypes from "prop-types";
import {useEffectOnMount} from "../../utils/hooks";
import {useAppContext} from "../ApplicationContext";
import get = Reflect.get;
import {JobValidationProvider} from "./context/JobValidation";

export interface ProviderLimits {
    slug: string;
    maxDataSize: number;
    maxArea: number;
}

export interface Props {
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    geojson: GeoJSON.FeatureCollection;
    updateExportInfo: (args: any) => void;
    breadcrumbStepperProps: any;
    getProviders: () => void;
}

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

function EstimateContainer(props: Props) {
    const { SERVE_ESTIMATES } = useAppContext();
    const [totalTime, setTime] = useState(-1);
    const [totalSize, setSize] = useState(-1);
    const [areEstimatesLoading, setEstimatesLoading] = useState(true);
    const [providerLimits, setLimits] = useState([]);
    const [aoiHasArea, setHasArea] = useState(false);

    useEffectOnMount(() => {
        const waitForProviders = async () => await getProviders();
        waitForProviders().then(() => checkProviders(props.providers));
    });

    useEffect(() => {
        if (SERVE_ESTIMATES) {
            updateEstimate();
        }
    }, [props.exportInfo.providers]);

    useEffect(() => {
        if (SERVE_ESTIMATES) {
            props.updateExportInfo({ providerInfo: {} });
            setEstimatesLoading(true);
            checkProviders(props.providers);
        }
        setHasArea(allHaveArea(props.geojson));
    }, [props.geojson]);


    async function getProviders() {
        await props.getProviders();
        const limits = [];
        props.providers.forEach((provider) => {
            if (!provider.display) {
                return;
            }
            const getValue = (value) => (value) ? parseFloat(value) : -1; // Avoids NaN's
            limits.push({
                slug: provider.slug,
                maxDataSize: getValue(provider.max_data_size),
                maxArea: getValue(provider.max_selection),
            } as ProviderLimits)
        });
        limits.sort((a, b) => a.maxArea - b.maxArea);
        setLimits(limits);
    }

    async function getEstimate(provider: Eventkit.Provider, bbox: number[]) {
        const providerExportOptions = props.exportInfo.exportOptions[provider.slug] as Eventkit.Store.ProviderExportOptions;

        let minZoom = provider.level_from;
        let maxZoom = provider.level_to;

        if (providerExportOptions) {
            if (isZoomLevelInRange(providerExportOptions.minZoom, provider)) {
                minZoom = providerExportOptions.minZoom;
            }
            if (isZoomLevelInRange(providerExportOptions.maxZoom, provider)) {
                maxZoom = providerExportOptions.maxZoom;
            }
        }
        const data = {
            slugs: provider.slug,
            srs: 4326,
            bbox: bbox.join(','),
            min_zoom: minZoom,
            max_zoom: maxZoom,
        };

        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url: `/api/estimate`,
            method: 'get',
            params: data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            return response.data[0];
        }).catch(() => {
            return {
                size: null,
                slug: provider.slug,
                time: null,
            };
        });
    }

    async function checkEstimate(provider: Eventkit.Provider) {
        // This assumes that the entire selection is the first feature, if the feature collection becomes the
        // selection then the bbox would need to be calculated for it.
        if (SERVE_ESTIMATES) {
            if (Object.keys(props.geojson).length === 0) {
                return null;
            }
            const bbox = featureToBbox(props.geojson.features[0], WGS84);
            const estimates = await getEstimate(provider, bbox);
            if (estimates) {
                return { time: estimates.time, size: estimates.size } as Eventkit.Store.Estimates;
            }
            return {
                size: null,
                slug: provider.slug,
                time: null,
            };
        }
        return undefined;
    }

    function getAvailability(provider: Eventkit.Provider, data: any) {
        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url: `/api/providers/${provider.slug}/status`,
            method: 'POST',
            data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            // The backend currently returns the response as a string, it needs to be parsed before being used.
            const availabilityData = (typeof (response.data) === "object") ? response.data : JSON.parse(response.data) as Eventkit.Store.Availability;
            availabilityData.slug = provider.slug;
            return availabilityData;
        }).catch(() => {
            return {
                slug: provider.slug,
                status: 'WARN',
                type: 'CHECK_FAILURE',
                message: "An error occurred while checking this provider's availability.",
            } as Eventkit.Store.Availability;
        });
    }

    async function checkAvailability(provider: Eventkit.Provider) {
        if (Object.keys(props.geojson).length === 0) {
            return;
        } else {
            const data = { geojson: props.geojson };
            return (await getAvailability(provider, data));
        }
    }

    async function checkProvider(provider: Eventkit.Provider) {
        if (provider.display === false) {
            return;
        }
        return Promise.all([
            checkAvailability(provider),
            checkEstimate(provider),
        ]).then(results => {
            return {
                slug: provider.slug,
                data: {
                    availability: results[0],
                    estimates: results[1],
                } as Eventkit.Store.ProviderInfo,
            }
        })
    }

    function checkProviders(providers: Eventkit.Provider[]) {
        Promise.all(providers.filter(provider => provider.display).map((provider) => {
            return checkProvider(provider);
        })).then(providerResults => {
            const providerInfo = { ...props.exportInfo.providerInfo } as Eventkit.Map<Eventkit.Store.ProviderInfo>;
            providerResults.map((provider) => {
                providerInfo[provider.slug] = provider.data;
            });
            props.updateExportInfo({ providerInfo });
            // Trigger an estimate calculation update in the parent
            // Does not re-request any data, calculates the total from available results.
            updateEstimate();
        });
    }

    function updateEstimate() {
        if (!SERVE_ESTIMATES || !props.exportInfo.providers) {
            return;
        }
        let sizeEstimate = 0;
        let timeEstimate = 0;
        const maxAcceptableTime = 60 * 60 * 24 * props.exportInfo.providers.length;
        for (const provider of props.exportInfo.providers) {
            // tslint:disable-next-line:triple-equals
            if (props.exportInfo.providerInfo[provider.slug] == undefined) {
                setEstimatesLoading(true);
                return;
            } else {
                if (provider.slug in props.exportInfo.providerInfo) {
                    const providerInfo = props.exportInfo.providerInfo[provider.slug];

                    if (providerInfo && providerInfo.estimates) {
                        if (providerInfo.estimates.time && providerInfo.estimates.size) {
                            timeEstimate += providerInfo.estimates.time.value;
                            sizeEstimate += providerInfo.estimates.size.value;
                        }
                    }
                }
                if (timeEstimate > maxAcceptableTime) {
                    timeEstimate = maxAcceptableTime;
                }
                setTime(timeEstimate);
                setSize(sizeEstimate);
            }
            setEstimatesLoading(false);
        }
    }

    return (
        <JobValidationProvider value={{
            providerLimits,
            aoiHasArea,
        }}>
        <BreadcrumbStepper
            {...props.breadcrumbStepperProps}
            checkProvider={checkProvider}
            updateEstimate={updateEstimate}
            sizeEstimate={totalSize}
            timeEstimate={totalTime}
            areEstimatesLoading={areEstimatesLoading}
            getProviders={getProviders}
        />
        </JobValidationProvider>
    )
}

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportInfo: state.exportInfo,
        providers: state.providers,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo));
        },
        getProviders: () => (
            dispatch(getProviders())
        )
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(EstimateContainer);
