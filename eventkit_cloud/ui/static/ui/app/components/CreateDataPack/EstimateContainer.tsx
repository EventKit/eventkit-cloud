import React from 'react';
import BreadcrumbStepper from "./BreadcrumbStepper";
import {getCookie, isZoomLevelInRange} from "../../utils/generic";
import {featureToBbox, WGS84} from '../../utils/mapUtils';
import {updateExportInfo} from '../../actions/datacartActions';
import {getProviders} from '../../actions/providerActions';
import axios from "axios";
import {connect} from "react-redux";
import * as PropTypes from "prop-types";


export interface Props {
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    geojson: GeoJSON.FeatureCollection;
    updateExportInfo: (args: any) => void;
    breadcrumbStepperProps: any;
    getProviders: () => void;
}

export interface State {
    areEstimatesLoading: boolean;
    sizeEstimate: number;
    timeEstimate: number;
    limits: {
        max: number;
        sizes: number[];
    };
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
        this.getAvailability = this.getAvailability.bind(this);
        this.checkAvailability = this.checkAvailability.bind(this);
        this.updateEstimate = this.updateEstimate.bind(this);
        this.getProviders = this.getProviders.bind(this);
        this.checkProviders = this.checkProviders.bind(this);
        this.state = {
            areEstimatesLoading: true,
            sizeEstimate: -1,
            timeEstimate: -1,
            limits: {
                max: 0,
                sizes: [],
            },
        }
    }

    componentDidMount(): void {
        // make requests to check provider availability
        this.getProviders().then(r => this.checkProviders(this.props.providers));
        this.setState({areEstimatesLoading: true});
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        this.getProviders().then(r => this.checkProviders(this.props.providers));

        if (this.context.config.SERVE_ESTIMATES) {
            // only update the estimate if providers has changed
            const prevProviders = prevProps.exportInfo.providers;
            const providers = this.props.exportInfo.providers;
            if (prevProviders && providers) {
                if (prevProviders.length !== providers.length) {
                    this.updateEstimate();
                    this.setState({areEstimatesLoading: false});
                } else if (!prevProviders.every((p1) => {
                    return providers.includes(p1);
                })) {
                    this.updateEstimate();
                }
            } else if (prevProviders || providers) {
                this.updateEstimate();
            }
        }
    }

    async getProviders() {
        await this.props.getProviders();
        let max = 0;
        const sizes = [];
        this.props.providers.forEach((provider) => {
            if (!provider.display) {
                return;
            }
            const providerMax = parseFloat(provider.max_selection);
            sizes.push(providerMax);
            if (providerMax > max) {
                max = providerMax;
            }
        });
        const limits = {
            max,
            sizes: sizes.sort((a, b) => a - b),
        };
        this.setState({limits});
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
            bbox: bbox.join(','), min_zoom: minZoom, max_zoom: maxZoom,
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
            // if (Object.keys(this.props.geojson).length === 0) {
            //     return null;
            // }
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
        return Promise.all([
            this.checkAvailability(provider),
            this.checkEstimate(provider),
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

    private checkProviders(providers: Eventkit.Provider[]) {
        Promise.all(providers.filter(provider => provider.display).map((provider) => {
            return this.checkProvider(provider);
        })).then(providerResults => {
            const providerInfo = {...this.props.exportInfo.providerInfo} as Eventkit.Map<Eventkit.Store.ProviderInfo>;
            providerResults.map((provider) => {
                providerInfo[provider.slug] = provider.data;
            });
            this.props.updateExportInfo({providerInfo});
            // Trigger an estimate calculation update in the parent
            // Does not re-request any data, calculates the total from available results.
            this.updateEstimate();
        });
    }

    private updateEstimate() {
        if (!this.context.config.SERVE_ESTIMATES || !this.props.exportInfo.providers) {
            return;
        }
        let sizeEstimate = 0;
        let timeEstimate = 0;
        const maxAcceptableTime = 60 * 60 * 24 * this.props.exportInfo.providers.length;
        for (const provider of this.props.exportInfo.providers) {
            // tslint:disable-next-line:triple-equals
            if (this.props.exportInfo.providerInfo[provider.slug] == undefined) {
                this.setState({areEstimatesLoading: true});
                return;
            } else {
                if (provider.slug in this.props.exportInfo.providerInfo) {
                const providerInfo = this.props.exportInfo.providerInfo[provider.slug];

                if (providerInfo) {
                    if (providerInfo.estimates) {
                        timeEstimate += providerInfo.estimates.time.value;
                        sizeEstimate += providerInfo.estimates.size.value;
                    }
                    // for cloned estimates as data structure is slightly different when saved to store
                    if (providerInfo.estimated_size || providerInfo.estimated_duration) {
                        timeEstimate += providerInfo.estimated_duration;
                        sizeEstimate += providerInfo.estimated_size;
                    }
                }
                }
                if (timeEstimate > maxAcceptableTime) {
                    timeEstimate = maxAcceptableTime;
                }
                this.setState({sizeEstimate, timeEstimate});
            }
            this.setState({areEstimatesLoading: false});
        }
    }

    render () {
        return (
            <BreadcrumbStepper
                {...this.props.breadcrumbStepperProps}
                checkProvider={this.checkProvider}
                // checkProviders={this.checkProviders}
                checkEstimate={this.checkEstimate}
                updateEstimate={this.updateEstimate}
                sizeEstimate={this.state.sizeEstimate}
                timeEstimate={this.state.timeEstimate}
                areEstimatesLoading={this.state.areEstimatesLoading}
                getProviders={this.getProviders}
            />
        )
    }
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
