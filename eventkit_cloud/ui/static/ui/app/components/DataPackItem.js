import React, {PropTypes, Component} from 'react'
import {Card, CardActions, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import style from '../styles/DataPackItem.css';
import ol from 'openlayers';

export class DataPackItem extends Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleExpandChange = this.handleExpandChange.bind(this);
        this.state = { expanded: false };
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this.initMap();
            }
        }
    }

    initMap() {
        const map = new ol.Map({
            target: this.props.run.uid + '_map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }),
            ],
            view: new ol.View({
                projection: 'EPSG:3857',
                center: [110,0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            })
        });

        let source = new ol.source.Vector();

        const geojson = new ol.format.GeoJSON();
        const feature = geojson.readFeature(this.props.run.job.extent, {
            'featureProjection': 'EPSG:3857',
            'dataProjection': 'EPSG:4326'
        });
        source.addFeature(feature);
        const layer = new ol.layer.Vector({
            source: source,
        });
        map.addLayer(layer);
        map.getView().fit(source.getExtent(), map.getSize());

    }

    handleExpandChange = (expanded) => {
        this.setState({expanded: expanded});
    }

    toggleExpanded() {
        this.setState({expanded: !this.state.expanded});
    }

    render() {
        const styles = {
            card: {
                backgroundColor: '#f7f8f8',
            },
            cardTitle:{
                wordWrap: 'break-word',
            },
            errorIcon: {float: 'left', color: '#ce4427', fontSize: '20px', opacity: '0.6'},
            runningIcon: {float: 'left', color: '#f4D225', fontSize: '20px'},
            unpublishedIcon: {float: 'right', color: 'grey', fontSize: '20px', marginRight: '5px'},
            publishedIcon : {float: 'right', color: '#bcdfbb', fontSize: '20x', marginRight: '5px'},
            ownerLabel: {float: 'right', color: 'grey', padding: '0px, 10px', margin: '0px'}
        };

        return (
            <Card style={styles.card} key={this.props.run.uid} expanded={this.state.expanded} onExpandChange={this.handleExpandChange}>
                <CardTitle 
                    titleColor={'#4598bf'}
                    style={styles.cardTitle} 
                    title={
                        <div>
                            <span>{this.props.run.job.name}</span>
                            <IconMenu
                                style={{float: 'right'}}
                                iconButtonElement={
                                    <IconButton>
                                        <i className="material-icons" style={{color: '#4598bf'}}>more_vert</i>
                                    </IconButton>}
                                anchorOrigin={{horizontal: 'middle', vertical: 'center'}}
                                targetOrigin={{horizontal: 'right', vertical: 'top'}}
                            >
                                <MenuItem 
                                    style={{fontSize: '13px'}}
                                    primaryText={this.state.expanded ? "Hide Map" : "Show Map"}
                                    onTouchTap={this.toggleExpanded}/>
                                <MenuItem 
                                    style={{fontSize: '13px'}}
                                    primaryText="Go to Export Detail"
                                    onTouchTap={() => {window.location.href='/exports/' + this.props.run.uid}}/>
                               
                                {this.props.run.user == this.props.user.data.username ?
                                <MenuItem
                                    style={{fontSize: '13px'}}
                                    primaryText={'Delete Export'}
                                    onTouchTap={() => {console.log('deleting')}}/>
                                : null}
                            </IconMenu>
                        </div>
                    } 
                    subtitle={
                        <div>
                        <span>{'Event: ' + this.props.run.job.event}</span><br/>
                        <span>{'Added: ' + moment(this.props.run.started_at).format('YYYY-MM-DD')}</span><br/>
                        </div>
                        } />
                <CardText>
                    <span>{this.props.run.job.description}</span>
                </CardText>
                <CardMedia expandable={true}>
                    <div id={this.props.run.uid + '_map'} className={style.map} />
                </CardMedia>
                <CardActions style={{height: '45px'}}>
                    <span>
                        {this.props.run.status == "SUBMITTED" || this.props.run.status == "INCOMPLETE" ?
                            <i className={'material-icons'} style={styles.runningIcon}>sync</i>
                            :
                            this.props.run.status == "FAILED"  ?
                                <i className={'material-icons'} style={styles.errorIcon}>error</i>
                                :
                                null
                        }
                        {this.props.run.user == this.props.user.data.username ?
                            <p style={styles.ownerLabel}>My DataPack</p>
                            :
                            <p style={styles.ownerLabel}>{this.props.run.user}</p>
                        }
                        {this.props.run.job.published ? 
                            <i className={'material-icons'} style={styles.publishedIcon}>group</i>
                            :
                            
                            <i className={'material-icons'} style={styles.unpublishedIcon}>person</i>
                        }
                        
                    </span>
                </CardActions>
            </Card>
        )
    }
}

DataPackItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
};

export default DataPackItem;