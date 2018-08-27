import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link } from 'react-router';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import moment from 'moment';
import isUndefined from 'lodash/isUndefined';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';
import ScaleLine from 'ol/control/scaleline';

import ol3mapCss from '../../styles/ol3map.css';

export class DataPackFeaturedItem extends Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.getMapId = this.getMapId.bind(this);
        this.mapContainerRef = this.mapContainerRef.bind(this);
    }

    componentDidMount() {
        this.initMap();
    }

    getMapId() {
        let mapId = '';
        if (!isUndefined(this.props.gridName)) {
            mapId += `${this.props.gridName}_`;
        }
        mapId += `${this.props.run.uid}_`;
        if (!isUndefined(this.props.index)) {
            mapId += `${this.props.index}_`;
        }
        mapId += 'map';

        return mapId;
    }

    initMap() {
        const map = new Map({
            target: this.getMapId(),
            layers: [
                new Tile({
                    source: new XYZ({
                        url: this.context.config.BASEMAP_URL,
                        wrapX: true,
                        attributions: this.context.config.BASEMAP_COPYRIGHT,
                    }),
                }),
            ],
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            interactions: interaction.defaults({ mouseWheelZoom: false }),
            controls: [
                new Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' '),
                }),
                new ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
            ],
        });

        const source = new VectorSource({ wrapX: true });

        const geojson = new GeoJSON();
        const feature = geojson.readFeature(this.props.run.job.extent, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeature(feature);
        const layer = new VectorLayer({
            source,
        });
        map.addLayer(layer);
        map.getView().fit(source.getExtent(), map.getSize());
    }

    mapContainerRef(element) {
        if (!element) {
            return;
        }

        // Absorb touch move events.
        element.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        });
    }

    render() {
        const cardHeight = this.props.height || 'auto';
        let cardClamp = 2;
        if (window.innerWidth > 1024) cardClamp = 6;
        else if (window.innerWidth > 768) cardClamp = 7;

        const styles = {
            card: {
                backgroundColor: '#f7f8f8',
                position: 'relative',
                height: cardHeight,
            },
            content: {
                display: 'flex',
                flexWrap: 'nowrap',
                height: cardHeight,
                flexDirection: (window.innerWidth > 768) ? 'row' : 'column',
            },
            map: {
                flex: '67',
                maxWidth: (window.innerWidth > 768) ? '67%' : '',
                maxHeight: (window.innerWidth > 768) ? '' : '67%',
                boxSizing: 'border-box',
                backgroundColor: 'none',
                order: (window.innerWidth > 768) ? '1' : '2',
            },
            info: {
                flex: '33',
                maxWidth: (window.innerWidth > 768) ? '33%' : '100%',
                maxHeight: (window.innerWidth > 768) ? '' : '33%',
                boxSizing: 'border-box',
                padding: (window.innerWidth > 768) ? '17px 24px 20px' : '12px 16px 14px',
                order: (window.innerWidth > 768) ? '2' : '1',
            },
            cardHeader: {
                wordWrap: 'break-word',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxSizing: 'border-box',
                maxWidth: '100%',
                padding: '0',
            },
            cardTitle: {
                display: 'inline-block',
                width: '100%',
                color: '#4598bf',
                fontSize: '22px',
            },
            titleLink: {
                color: 'inherit',
                width: '100%',
                margin: '0px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 2,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                wordWrap: 'break-word',
            },
            cardSubtitle: {
                display: (window.innerWidth > 768) ? '' : 'none',
                fontSize: (window.innerWidth > 768) ? '12px' : '10px',
                fontWeight: 'normal',
                color: 'rgba(0, 0, 0, 0.54)',
                marginBottom: '16px',
            },
            cardTextContainer: {
                padding: '0px',
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden',
            },
            cardText: {
                color: '#000',
                wordWrap: 'break-word',
                width: '100%',
                backgroundColor: '#f7f8f8',
                zIndex: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: cardClamp,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                fontSize: (window.innerWidth > 1024) ? '16px' : '14px',
                lineHeight: (window.innerWidth > 1024) ? '1.5' : 'inherit',
            },
        };

        return (
            <Card
                style={styles.card}
                key={this.props.run.uid}
            >
                <div style={styles.content}>
                    <div
                        id={this.getMapId()}
                        style={styles.map}
                        ref={this.mapContainerRef}
                    />
                    <div style={styles.info}>
                        <CardHeader
                            style={styles.cardHeader}
                            title={
                                <div>
                                    <div style={styles.cardTitle}>
                                        <Link
                                            to={`/status/${this.props.run.job.uid}`}
                                            href={`/status/${this.props.run.job.uid}`}
                                            style={styles.titleLink}
                                        >
                                            {this.props.run.job.name}
                                        </Link>
                                    </div>
                                </div>
                            }
                            subheader={
                                <div style={styles.cardSubtitle}>
                                    <div
                                        className="qa-DataPackFeaturedItem-Subtitle-Event"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {`Event: ${this.props.run.job.event}`}
                                    </div>
                                    <span className="qa-DataPackFeaturedItem-Subtitle-Added">
                                        {`Added: ${moment(this.props.run.started_at).format('M/D/YY')}`}
                                    </span>
                                    <br />
                                    <span className="qa-DataPackFeaturedItem-Subtitle-Expires">
                                        {`Expires: ${moment(this.props.run.expiration).format('M/D/YY')}`}
                                    </span>
                                    <br />
                                </div>
                            }
                        />
                        <CardContent
                            style={styles.cardTextContainer}
                        >
                            <span style={styles.cardText}>
                                {this.props.run.job.description}
                            </span>
                        </CardContent>
                    </div>
                </div>
            </Card>
        );
    }
}

DataPackFeaturedItem.contextTypes = {
    config: PropTypes.object,
};

DataPackFeaturedItem.propTypes = {
    run: PropTypes.object.isRequired,
    gridName: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    height: PropTypes.string,
};

DataPackFeaturedItem.defaultProps = {
    height: undefined,
};

export default DataPackFeaturedItem;
