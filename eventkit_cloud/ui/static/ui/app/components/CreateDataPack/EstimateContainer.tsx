import React from 'react';
import BreadcrumbStepper from "./BreadcrumbStepper";
import ExportInfo from "./ExportInfo";
import {getCookie, isZoomLevelInRange} from "../../utils/generic";
import {featureToBbox, WGS84} from '../../utils/mapUtils';
import {updateExportInfo,} from '../../actions/datacartActions';
import axios from "axios";
import {connect} from "react-redux";
import * as PropTypes from "prop-types";


export interface Props {
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    geojson: GeoJSON.FeatureCollection;
    updateExportInfo: (args: any) => void;
}

export interface State {
    // estimateData: {};
}

export class EstimateContainer extends React.Component<Props, State> {
    private CancelToken = axios.CancelToken;
    private source = this.CancelToken.source();

    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props){
        super(props);
        this.getEstimate = this.getEstimate.bind(this);
        this.checkEstimate = this.checkEstimate.bind(this);
        this.checkProvider = this.checkProvider.bind(this);
        this.setProviderLoading = this.setProviderLoading.bind(this);
    }

    getEstimate(provider: Eventkit.Provider, bbox: number[]) {
        const providerExportOptions = this.props.exportInfo.exportOptions[provider.slug] as Eventkit.Map<Eventkit.Store.ProviderInfo>;
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
            bbox: bbox.join(','), min_zoom: minZoom, max_zoom: maxZoom
        };

        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url: `/api/estimate`,
            method: 'get',
            params: data,
            headers: {'X-CSRFToken': csrfmiddlewaretoken},
            cancelToken: this.source.token,
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

    async checkEstimate(provider: Eventkit.Provider) {
        // This assumes that the entire selection is the first feature, if the feature collection becomes the
        // selection then the bbox would need to be calculated for it.
        if (this.context.config.SERVE_ESTIMATES) {
            const bbox = featureToBbox(this.props.geojson.features[0], WGS84);
            const estimates = await this.getEstimate(provider, bbox);
            return {time: estimates.time, size: estimates.size, loading: false} as Eventkit.Store.Estimates;
        }
        return undefined;
    }

    async checkProvider(provider: Eventkit.Provider) {
        if (provider.display === false) {
            return;
        }
        this.setProviderLoading(true, provider);

        return Promise.all([
            // this.checkAvailability(provider),
            this.checkEstimate(provider),
        ]).then(results => {
            this.setProviderLoading(false, provider);
            return {
                slug: provider.slug,
                data: {
                    availability: results[0],
                    estimates: results[1],
                } as Eventkit.Store.ProviderInfo,
            }
        })
    }

    setProviderLoading(isLoading: boolean, provider: Eventkit.Provider) {
        const providerInfo = {...this.props.exportInfo.providerInfo} as Eventkit.Map<Eventkit.Store.ProviderInfo>;
        const updatedProviderInfo = {...providerInfo};
        const providerInfoData = updatedProviderInfo[provider.slug];
        if (!!providerInfoData) {
            updatedProviderInfo[provider.slug] = {
                ...providerInfoData,
                estimates: {
                    ...((!!providerInfoData.estimates) ? providerInfoData.estimates : {}),
                    loading: isLoading
                } as Eventkit.Store.Estimates
            };
            this.props.updateExportInfo({
                providerInfo: updatedProviderInfo
            });
        }
    }

    render () {
        return (
            <>
            <BreadcrumbStepper
                getEstimate={this.getEstimate}
                checkEstimate={this.checkEstimate}
                checkProvider={this.checkProvider}
                setProviderLoading={this.setProviderLoading}
            />
            <ExportInfo
                getEstimate={this.getEstimate}
                checkEstimate={this.checkEstimate}
                checkProvider={this.checkProvider}
                setProviderLoading={this.setProviderLoading}
            />
            </>
        )
    }
}


function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo));
        },
    };
}

export default connect(
    mapDispatchToProps,
)(EstimateContainer);