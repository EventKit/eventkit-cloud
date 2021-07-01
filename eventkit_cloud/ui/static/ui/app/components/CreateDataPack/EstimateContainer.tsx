import React, {useEffect, useState} from 'react';
import BreadcrumbStepper from "./BreadcrumbStepper";
import {getCookie, getSqKm, isZoomLevelInRange} from "../../utils/generic";
import {allHaveArea, featureToBbox, WGS84} from '../../utils/mapUtils';
import {updateExportInfo} from '../../actions/datacartActions';
import {getProviders} from '../../actions/providerActions';
import axios from "axios";
import {connect} from "react-redux";
import {DepsHashers, useEffectOnMount, useProviderIdentity, useProvidersLoading} from "../../utils/hooks/hooks";
import {useAppContext} from "../ApplicationContext";
import {JobValidationProvider} from "./context/JobValidation";

export interface ProviderLimits {
    slug: string;
    maxDataSize: number;
    maxArea: number;
    useBbox: boolean;
}

export interface Props {
    aoiInfo: any;
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    updateExportInfo: (args: any) => void;
    breadcrumbStepperProps: any;
    getProviders: () => void;
}

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

function EstimateContainer(props: Props) {
    const { SERVE_ESTIMATES } = useAppContext();
    const { aoiInfo } = props;

    const [totalTime, setTime] = useState(-1);
    const [totalSize, setSize] = useState(-1);
    const [providerLimits, setLimits] = useState([]);
    const [aoiHasArea, setHasArea] = useState(false);
    const [isCollectingEstimates, setProviderLoading] = useProvidersLoading(props.providers.filter(provider => provider.display));

    async function getEstimate(provider: Eventkit.Provider, bbox: number[]) {
        const providerExportOptions = props.exportInfo.exportOptions[provider.slug] as Eventkit.Store.ProviderExportOptions;
        let providerInfo = props.exportInfo.providerInfo[provider.slug] as Eventkit.Store.ProviderInfo;

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
        setProviderLoading(provider,true);
        providerInfo = {...providerInfo, ...{"estimates": {"status": "PENDING"}}};
        updateExportInfo(props.exportInfo)
        return axios({
            url: `/api/estimate`,
            method: 'get',
            params: data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            setProviderLoading(provider,false);
            return response.data[0];
        }).catch(() => {
            setProviderLoading(provider,false);
            return {
                size: undefined,
                slug: provider.slug,
                time: undefined,
            };
        });
    }

    async function checkEstimate(provider: Eventkit.Provider) {
        // This assumes that the entire selection is the first feature, if the feature collection becomes the
        // selection then the bbox would need to be calculated for it.
        if (SERVE_ESTIMATES) {
            if (Object.keys(aoiInfo.geojson).length === 0) {
                return undefined;
            }
            setProviderLoading(provider, true)
            const bbox = featureToBbox(aoiInfo.geojson.features[0], WGS84);
            const estimates = await getEstimate(provider, bbox);
            if (estimates) {
                return { time: estimates.time, size: estimates.size } as Eventkit.Store.Estimates;
            }
            return {
                size: undefined,
                slug: provider.slug,
                time: undefined,
            };
        }
        return undefined;
    }

    function getAvailability(provider: Eventkit.Provider, data: any) {
        const csrfmiddlewaretoken = getCookie('csrftoken');
        props.exportInfo.providerInfo[provider.slug] = {...props.exportInfo.providerInfo[provider.slug], ...{
                slug: provider.slug,
                status: 'PENDING',
                type: 'PENDING',
                message: "Waiting for a response.",
            }};
        updateExportInfo(props.exportInfo)
        return axios({
            url: `/api/providers/${provider.slug}/status`,
            method: 'POST',
            data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            const availabilityData = response.data as Eventkit.Store.Availability;
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
        if (Object.keys(aoiInfo.geojson).length === 0) {
            return;
        } else {
            const data = { geojson: aoiInfo.geojson };
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
        }
    }

    useEffectOnMount(() => {
        props.getProviders();
    });

    useEffect(() => {
        if (props.providers.length) {
            const limits = [];
            props.providers.forEach((provider) => {
                if (!provider.display) {
                    return;
                }
                const getValue = (value) => (value) ? parseFloat(value) : undefined; // Avoids NaN's
                limits.push({
                    slug: provider.slug,
                    maxDataSize: getValue(provider.max_data_size),
                    maxArea: getValue(provider.max_selection),
                    useBbox: provider.use_bbox,
                } as ProviderLimits)
            });
            limits.sort((a, b) => b.maxArea - a.maxArea);
            setLimits(limits);
        }
    }, [props.providers]);

    useProviderIdentity(() => {
        if (SERVE_ESTIMATES) {
            updateEstimate();
        }
    }, props.exportInfo.providers, [props.exportInfo.providerInfo]);

    const [ aoiArea, setArea ] = useState(0);
    const [ aoiBboxArea, setBboxArea ] = useState(0);
    useEffect(() => {
        if (SERVE_ESTIMATES && Object.keys(aoiInfo.geojson).length && props.providers.length) {
            props.updateExportInfo({ providerInfo: {} });
        }
        const hasArea = allHaveArea(aoiInfo.geojson);
        setHasArea(hasArea);
        if (hasArea) {
            setArea(getSqKm(props.aoiInfo.geojson));
            setBboxArea(getSqKm(props.aoiInfo.geojson, true));
        } else {
            setArea(0);
            setBboxArea(0);
        }
    }, [aoiInfo.geojson, props.providers]);

    const [dataSizeInfo, setDataSizeInfo] = useState({
        haveAvailableEstimates: undefined,
        providerEstimates: undefined,
        exceedingSize: undefined,
        noMaxDataSize: undefined,
    });
    const providerEstimates = {};
    const hashes = [];
    Object.entries(props.exportInfo.providerInfo).map(([slug, infoObject]) => {
        if (infoObject.estimates && infoObject.estimates.size) {
            providerEstimates[slug] = infoObject.estimates;
            hashes.push(DepsHashers.providerEstimate(infoObject.estimates));
        }
    });
    useEffect(() => {
        if (SERVE_ESTIMATES && Object.keys(providerEstimates).length) {
            const providerSlugs = props.providers.filter(provider => provider.display).map(provider => provider.slug);
            const haveAvailableEstimates = providerSlugs.filter((slug) => {
                // Filter out providers that DO NOT have a size estimate
                const estimate = providerEstimates[slug];
                return estimate && estimate.size && estimate.size.value;
            });
            // Providers without a max data size will fall back to AoI.
            const noMaxDataSize = [...providerLimits.filter(limits => !limits.maxDataSize).map(limits => limits.slug)];
            // Exceeding size contains the slugs of providers that are greater than their max data size and
            // any slugs for providers that did not have estimates available to determine size with.
            const exceedingSize = [
                ...providerLimits.filter(limits => {
                    if (!limits.maxDataSize) {
                        return false;
                    }
                    return haveAvailableEstimates.indexOf(limits.slug) !==
                        -1 && providerEstimates[limits.slug].size.value > limits.maxDataSize;
                }).map(limits => limits.slug),
                ...providerSlugs.filter(slug => haveAvailableEstimates.indexOf(slug) === -1)];

            setDataSizeInfo({
                providerEstimates,
                haveAvailableEstimates,
                exceedingSize,
                noMaxDataSize,
            });
        }
    }, [(SERVE_ESTIMATES) ? DepsHashers.arrayHash(hashes) : undefined]);

    return (
        <JobValidationProvider value={{
            providerLimits,
            aoiHasArea,
            aoiArea,
            aoiBboxArea,
            dataSizeInfo,
            isCollectingEstimates
        }}>
            <BreadcrumbStepper
                {...props.breadcrumbStepperProps}
                checkProvider={checkProvider}
                updateEstimate={updateEstimate}
                sizeEstimate={totalSize}
                timeEstimate={totalTime}
                getProviders={getProviders}
                isCollectingEstimates={isCollectingEstimates}
            />
        </JobValidationProvider>
    )
}

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
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
