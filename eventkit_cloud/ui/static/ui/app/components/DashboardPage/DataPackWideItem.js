import React, { PropTypes, Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { Card, CardActions, CardMedia, CardTitle, CardText } from 'material-ui/Card';
import moment from 'moment';
import { List, ListItem } from 'material-ui/List';
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

export class DataPackWideItem extends Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.state = {
            providerDescs: {},
        };
    }

    componentDidMount() {
        this.initMap();
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
        const providersList = Object.entries(this.state.providerDescs).map(([key, value], ix) => {
            return (
                <ListItem
                    key={key}
                    style={{
                        backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white',
                        fontWeight: 'bold',
                        width: '100%',
                        zIndex: 0,
                    }}
                    nestedListStyle={{ padding: '0px' }}
                    primaryText={key}
                    initiallyOpen={false}
                    primaryTogglesNestedList={false}
                    nestedItems={[
                        <ListItem
                            key={1}
                            primaryText={<div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{value}</div>}
                            style={{
                                backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white',
                                fontSize: '14px',
                                width: '100%',
                                zIndex: 0,
                            }}
                        />,
                    ]}
                />

            );
        });

        const cardHeight = this.props.height || 'auto';

        const styles = {
            card: {
                backgroundColor: '#f7f8f8',
                position: 'relative',
                height: cardHeight,
            },
            cardTitle: {
                wordWrap: 'break-word',
                padding: '17px 24px 20px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxSizing: 'border-box',
                flex: '0',
            },
            cardTitle2: {
                fontSize: 22,
                height: '36px',
            },
            cardSubtitle: {
                fontSize: window.innerWidth < 768 ? '10px' : '12px',
                fontWeight: 'normal',
            },
            cardText: {
                position: 'absolute',
                wordWrap: 'break-word',
                width: '100%',
                backgroundColor: '#f7f8f8',
                zIndex: 2,
                padding: '0px 24px 0px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                WebkitLineClamp: window.innerWidth < 1024 ? 10 : 8,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                fontSize: window.innerWidth < 1024 ? '14px' : '16px',
                lineHeight: window.innerWidth < 1024 ? 'inherit' : '1.5',
            },
            cardTextContainer: {
                padding: '0px',
                marginBottom: '10px',
                position: 'relative',
                boxSizing: 'border-box',
                flex: '1',
                overflow: 'hidden',
            },
            titleLink: {
                color: 'inherit',
                display: 'block',
                width: '100%',
                height: '36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: '0px',
            },
            map: {
                flex: '66',
                maxWidth: '66%',
                boxSizing: 'border-box',
                padding: '0px 2px',
                backgroundColor: 'none',
            },
            info: {
                flex: '33',
                maxWidth: '33%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
            },
        };

        return (
            <Card
                style={styles.card}
                key={this.props.run.uid}
            >
                <div style={{display: 'flex', flexWrap: 'nowrap', height: cardHeight}}>
                    <div
                        id={this.getMapId()}
                        style={styles.map}
                        ref={this.mapContainerRef}
                    />
                    <div style={styles.info}>
                        <CardTitle
                            titleColor="#4598bf"
                            style={styles.cardTitle}
                            titleStyle={styles.cardTitle2}
                            subtitleStyle={styles.cardSubtitle}
                            title={
                                <div>
                                    <div style={{display: 'inline-block', width: '100%', height: '36px'}}>
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
                            subtitle={
                                <div>
                                    <div
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {`Event: ${this.props.run.job.event}`}
                                    </div>
                                    <span>{`Added: ${moment(this.props.run.started_at).format('YYYY-MM-DD')}`}</span><br />
                                    <span>{`Expires: ${moment(this.props.run.expiration).format('YYYY-MM-DD')}`}</span><br />
                                </div>
                            }
                        />
                        <CardText
                            style={styles.cardTextContainer}
                        >
                            <span style={styles.cardText}>
                                {this.props.run.job.description}
                            </span>
                        </CardText>
                    </div>
                </div>
            </Card>
        );
    }
}

DataPackWideItem.contextTypes = {
    config: React.PropTypes.object,
};

DataPackWideItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    providers: PropTypes.array.isRequired,
    gridName: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    height: PropTypes.string,
};

export default DataPackWideItem;
