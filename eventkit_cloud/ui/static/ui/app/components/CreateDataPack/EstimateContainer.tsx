import React from 'react';
import BreadcrumbStepper from "./BreadcrumbStepper";
import {getCookie, isZoomLevelInRange} from "../../utils/generic";
import {featureToBbox, WGS84} from '../../utils/mapUtils';
import {updateExportInfo} from '../../actions/datacartActions';
import axios from "axios";
import {connect} from "react-redux";
import * as PropTypes from "prop-types";
import {Route} from "react-router";
import {SelectedBaseMap} from "./CreateExport";


export interface Props {
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    geojson: GeoJSON.FeatureCollection;
    updateExportInfo: (args: any) => void;
    breadcrumbStepperProps: any;
}

export interface State {
    loadingProviders: string[];
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
        this.getAvailability = this.getAvailability.bind(this);
        this.checkAvailability = this.checkAvailability.bind(this);
        this.state = {
            loadingProviders: []
        }
    }

    getEstimate(provider: Eventkit.Provider, bbox: number[]) {
        const providerExportOptions = this.props.exportInfo.exportOptions[provider.slug] as Eventkit.Store.ProviderExportOptions;
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
            return {time: estimates.time, size: estimates.size} as Eventkit.Store.Estimates;
        }
        return undefined;
    }

    private getAvailability(provider: Eventkit.Provider, data: any) {
        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url: `/api/providers/${provider.slug}/status`,
            method: 'POST',
            data,
            headers: {'X-CSRFToken': csrfmiddlewaretoken},
            cancelToken: this.source.token,
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

    async checkAvailability(provider: Eventkit.Provider) {
        const data = {geojson: this.props.geojson};
        return (await this.getAvailability(provider, data));
    }

    async checkProvider(provider: Eventkit.Provider) {
        if (provider.display === false) {
            return;
        }
        this.setProviderLoading(true, provider);

        return Promise.all([
            this.checkAvailability(provider),
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

    hasLoaded(){
        return Object.keys(this.state.loadingProviders).length > 0;
    }

    setProviderLoading(isLoading: boolean, provider: Eventkit.Provider) {
        const { loadingProviders } = this.state;
        const slugIndex = loadingProviders.indexOf(provider.slug);
            if (isLoading) {
                if (slugIndex === -1) {
                    this.setState({loadingProviders: [...loadingProviders, provider.slug]})
                }
                if (this.hasLoaded) {
                    this.setState({loadingProviders: [...loadingProviders]})
                }
            } else {
                const removeProvider = loadingProviders.splice(slugIndex, 1);
                this.setState({loadingProviders: removeProvider})
            }
    }

    render () {
        return (
            <BreadcrumbStepper
                {...this.props.breadcrumbStepperProps}
                checkProvider={this.checkProvider}
                checkEstimate={this.checkEstimate}
                setProviderLoading={this.setProviderLoading}
                hasLoaded={this.hasLoaded}
            />
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