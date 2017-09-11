import React, {PropTypes, Component} from 'react'
import ol from 'openlayers';
import '../tap_events'
import DataPackDetails from './DataPackDetails'
import RaisedButton from 'material-ui/RaisedButton';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';
import Check from 'material-ui/svg-icons/navigation/check'
import Edit from 'material-ui/svg-icons/image/edit';
import DatePicker from 'material-ui/DatePicker';
import Info from 'material-ui/svg-icons/action/info'
import CustomScrollbar from '../CustomScrollbar';
import BaseDialog from '../BaseDialog';
import DeleteDialog from '../DeleteDialog';

export class DataCartDetails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            minDate: null,
            maxDate: null,
            expirationDate: null,
            permission: null,
            cartDetails: {},
            status: '',
            statusBackgroundColor: '',
            statusFontColor: '',
            deleteDialogOpen: false,
            rerunDialogOpen: false,
            cloneDialogOpen: false,
            providerDesc: '',
            providerDialogOpen: false,
            zipFileUrl: null,
            formatsDialogOpen: false,
            projectionsDialogOpen: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.cartDetails.status != this.state.status) {
            switch(nextProps.cartDetails.status) {
                case 'COMPLETED':
                    return this.setState({status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63'});
                case 'SUBMITTED':
                    return this.setState({status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225'});
                case 'INCOMPLETE':
                    return this.setState({status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427'});
                default:
                    return this.setState({status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396'});
            }
        }
        if(nextProps.cartDetails.zipfile_url != this.state.zipFileUrl){
            this.setState({zipFileUrl: nextProps.cartDetails.zipfile_url})
        }

    }

    componentDidMount(){
        this._initializeOpenLayers();
        this._setTableColors();
        this._setMaxDate();
        this._setExpirationDate();
        this._setPermission();
    }

    _setExpirationDate(){
        this.setState({expirationDate : this.props.cartDetails.expiration})
    }

    _setPermission(){
        this.setState({permission : this.props.cartDetails.job.published})
    }

    _setMaxDate() {
        const minDate = new Date();
        const maxDays = this.props.maxResetExpirationDays;
        let maxDate;
        let d = new Date();
        let m = moment(d);
        m.add(maxDays, 'days');
        maxDate = m.toDate();
        this.setState({minDate, maxDate});
    }

    _setTableColors() {
        switch(this.props.cartDetails.status) {
            case 'COMPLETED':
                return this.setState({status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63'});
            case 'SUBMITTED':
                return this.setState({status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225'});
            case 'INCOMPLETE':
                return this.setState({status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427'});
            default:
                return this.setState({status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396'});
        }
    }
    _initializeOpenLayers() {
        var base = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: false
            })
        });

        this._map = new ol.Map({
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false
            }),
            layers: [base],
            target: 'summaryMap',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            })
        });
        const source = new ol.source.Vector();
        const geojson = new ol.format.GeoJSON();
        const feature = geojson.readFeatures(this.props.cartDetails.job.extent, {
            'featureProjection': 'EPSG:3857',
            'dataProjection': 'EPSG:4326'
        });
        source.addFeatures(feature);
        const layer = new ol.layer.Vector({
            source: source,
        });

        this._map.addLayer(layer);
        this._map.getView().fit(source.getExtent(), this._map.getSize());

    }
    handleDeleteOpen = () => {
        this.setState({deleteDialogOpen: true});
    };

    handleDeleteClose = () => {
        this.setState({deleteDialogOpen: false});
    };

    handleRerunOpen = () => {
        this.setState({rerunDialogOpen: true});
    };

    handleRerunClose = () => {
        this.setState({rerunDialogOpen: false});
    };
    handleCloneOpen = () => {
        this.setState({cloneDialogOpen: true});
    };

    handleCloneClose = () => {
        this.setState({cloneDialogOpen: false});
    };

    handleProviderClose = () => {
        this.setState({providerDialogOpen: false});
    };

    handleProviderOpen(runProviders) {
        let propsProvider = this.props.providers.find(x => x.slug === runProviders.slug);
        let providerDesc = propsProvider.service_description.toString();
        let providerName = propsProvider.name.toString();
        this.setState({providerDesc, providerName, providerDialogOpen: true})
    };

    handleFormatsClose = () => {
        this.setState({formatsDialogOpen: false});
    };

    handleFormatsOpen() {
        this.setState({formatsDialogOpen: true})
    };

    handleProjectionsClose = () => {
        this.setState({projectionsDialogOpen: false});
    };

    handleProjectionsOpen() {
        this.setState({projectionsDialogOpen: true})
    };

    handleDelete = () => {
        this.props.onRunDelete(this.props.cartDetails.uid)
        this.setState({deleteDialogOpen: false});
    };

    handleRerun = () => {
        this.props.onRunRerun(this.props.cartDetails.job.uid)
        this.setState({rerunDialogOpen: false});
    };

    handleClone = () => {
        let providerArray = [];
        this.props.cartDetails.provider_tasks.forEach((provider) => {
            if(provider.display == true) {
                providerArray.push(provider);
            };
        })
        this.props.onClone(this.props.cartDetails, providerArray);
        this.setState({cloneDialogOpen: false});

    };

    openDatePicker = () => {
        this.refs.dp.openDialog()
    };

    handlePublishedChange = (event, index, value) => {
        if(value == 1) {
            // hit the API and change published to true
            this.setState({permission: true})
            this.props.onUpdatePermission(this.props.cartDetails.job.uid, true);
        }
        else {
            // hit the API and change published to false
            this.setState({permission: false})
            this.props.onUpdatePermission(this.props.cartDetails.job.uid, false);
        }
    };

    handleExpirationChange = (e, date) => {
        this.setState({expirationDate: date});
        this.props.onUpdateExpiration(this.props.cartDetails.uid, date);
    };

    render() {
        const providers = this.props.cartDetails.provider_tasks.filter((provider) => {
            return provider.display != false;
        });

        const styles = {
            tdHeader: {
                backgroundColor: '#f8f8f8', 
                padding: '10px', 
                fontWeight: 'bold', 
                width: '140px'
            },
            tdData: {
                backgroundColor: '#f8f8f8', 
                padding: '10px', 
                color: '#8b9396', 
                wordWrap: 'break-word'
            },
            subHeading: {
                fontSize: '16px', 
                alignContent: 'flex-start', 
                color: 'black', 
                paddingBottom: '10px', 
                paddingTop: '30px', 
                fontWeight: 'bold'
            },
            textField: {
                fontSize: '14px', 
                height: '36px', 
                width: '0px', 
                display:'inlineBlock'
            },
            dropDown: {
                height: '30px', 
                lineHeight: '35px', 
                float: 'left',
            },
            item: {
                fontSize: '14px',
            },
            icon: {
                height: '30px', 
                width: '30px', 
                padding: '0px', 
                marginRight: '5px', 
                fill: '#4498c0'
            },
            label: {
                lineHeight: '30px', 
                color: '#8b9396', 
                paddingLeft: '0px', 
                fontSize: '14px', 
                fontWeight: 'normal'
            },
            list: {
                paddingTop: '5px', 
                paddingBottom: '0px', 
                display:'inlineBlock'
            },
            underline: {
                display:'none', 
                marginLeft: '0px'
            },
            selected: {
                color: '#4498c0', 
                fontWeight: 'bold'
            },
            dataSource: {
                marginLeft:'10px',
                height:'18px', 
                width:'18px', 
                cursor: 'pointer', 
                display:'inlineBlock', 
                fill:'#4598bf', 
                verticalAlign: 'middle'
            }
        };

        const rerunExportActions = [
            <RaisedButton
                style={{marginRight: '10px'}}
                labelStyle={{color: '#4598bf', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: 'whitesmoke'}}
                disableTouchRipple={true}
                label="Cancel"
                primary={false}
                onTouchTap={this.handleRerunClose.bind(this)}
            />,
            <RaisedButton
                buttonStyle={{backgroundColor: '#4598bf'}}
                label="Rerun"
                primary={true}
                onTouchTap={this.handleRerun.bind(this)}
            />,
        ];
        const cloneExportActions = [
            <RaisedButton
                style={{marginRight: '10px'}}
                labelStyle={{color: '#4598bf', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: 'whitesmoke'}}
                disableTouchRipple={true}
                label="Cancel"
                primary={false}
                onTouchTap={this.handleCloneClose.bind(this)}
            />,
            <RaisedButton
                buttonStyle={{backgroundColor: '#4598bf'}}
                label="Clone"
                primary={true}
                onTouchTap={this.handleClone.bind(this)}
            />]

        return (
            <div>
                <div>
                    <table>
                        <tbody>
                        <tr>
                            <td style={styles.tdHeader}>Name</td>
                            <td style={styles.tdData}>{this.props.cartDetails.job.name}</td>
                        </tr>

                        </tbody>
                    </table>
                </div>
                <div style={styles.subHeading}>
                    Status
                </div>
                <div>
                    <table>
                        <tbody>

                        <tr>
                            <td style={{...styles.tdHeader, backgroundColor: this.state.statusBackgroundColor}}>Export</td>
                            <td style={{...styles.tdData, backgroundColor: this.state.statusBackgroundColor, color: this.state.statusFontColor}}>
                                {this.props.cartDetails.status}
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Expiration</td>
                            <td style={{backgroundColor: '#f8f8f8', paddingRight: '10px',paddingLeft:'10px', paddingTop:'0px', display:'inlineBlock', paddingBottom:'0px', color: '#8b9396'}}>
                                {moment(this.props.cartDetails.expiration).format('YYYY-MM-DD')}
                                <DatePicker
                                    ref="dp"
                                    style={{height:'0px',display: '-webkit-inline-box', width:'0px'}}
                                    autoOk={true}
                                    minDate={this.state.minDate}
                                    maxDate={this.state.maxDate}
                                    id="datePicker"
                                    onChange={this.handleExpirationChange}
                                    textFieldStyle={styles.textField}
                                    underlineStyle={{display: 'none'}}
                                />
                                <Edit onClick={(e) => { this.refs.dp.focus() }}  key={this.props.cartDetails.uid} style={{marginLeft:'10px',height:'18px', width:'18px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/></td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Permission</td>
                            <td style={{...styles.tdData, paddingTop: '0px', paddingBottom: '0px'}}><DropDownMenu
                                value={this.state.permission == true? 1 : 2}
                                onChange={this.handlePublishedChange.bind(this)}
                                style={styles.dropDown}
                                labelStyle={styles.label}
                                iconStyle={styles.icon}
                                listStyle={styles.list}
                                selectedMenuItemStyle={styles.selected}
                                underlineStyle={styles.underline}>
                                <MenuItem value={1}
                                          leftIcon={<SocialGroup style={{fill: '#bcdfbb', height: '26px', marginBottom: '2px'}}/>}
                                          rightIcon={this.state.permission == true? <Check style={{fill: '#4598bf', height: '26px', marginBottom: '2px'}}/> : null}
                                          primaryText="Public"/>
                                <MenuItem value={2}
                                          leftIcon={<SocialPerson style={{fill: 'grey', height: '26px', marginBottom: '2px'}} />}
                                          rightIcon={this.state.permission == false? <Check style={{fill: '#4598bf', height: '26px', marginBottom: '2px'}}/> : null}
                                          primaryText="Private" />

                            </DropDownMenu></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{paddingBottom:'10px'}}>
                    <DataPackDetails providerTasks={this.props.cartDetails.provider_tasks}
                                     onProviderCancel={this.props.onProviderCancel}
                                     providers={this.props.providers}
                                     zipFileUrl={this.state.zipFileUrl}/>
                </div>
                <div style={{width:'100%', float:'left', paddingTop:'10px',paddingBottom:'30px'}}>
                    <div style={styles.subHeading}>
                        Other Options
                    </div>
                    <div>
                        <RaisedButton
                            style={{margin: '10px'}}
                            disabled={this.state.status == "SUBMITTED"}
                            backgroundColor={'rgba(226,226,226,0.5)'}
                            disableTouchRipple={true}
                            labelColor={'#4598bf'}
                            labelStyle={{fontWeight:'bold'}}
                            onTouchTap={this.handleRerunOpen.bind(this)}
                            label="RUN EXPORT AGAIN"
                        />
                        <BaseDialog
                            show={this.state.rerunDialogOpen}
                            title={'RERUN DATAPACK'}
                            onClose={this.handleRerunClose.bind(this)}
                            actions={rerunExportActions}
                        >
                            <strong>Are you sure you want to run this DataPack again?</strong>
                        </BaseDialog>
                        <RaisedButton
                            style={{margin: '10px'}}
                            backgroundColor={'rgba(226,226,226,0.5)'}
                            disableTouchRipple={true}
                            labelColor={'#4598bf'}
                            labelStyle={{fontWeight:'bold'}}
                            onTouchTap={this.handleCloneOpen.bind(this)}
                            label="CLONE"
                        />
                        <BaseDialog
                            show={this.state.cloneDialogOpen}
                            title={'CLONE DATAPACK'}
                            onClose={this.handleCloneClose}
                            actions={cloneExportActions}
                        >
                            <strong>Are you sure you want to clone this DataPack?</strong>
                        </BaseDialog>
                        <RaisedButton
                            style={{margin: '10px'}}
                            backgroundColor={'rgba(226,226,226,0.5)'}
                            disableTouchRipple={true}
                            labelColor={'#ff0000'}
                            labelStyle={{fontWeight:'bold'}}
                            onTouchTap={this.handleDeleteOpen.bind(this)}
                            label="DELETE"
                        />
                        <DeleteDialog
                            show={this.state.deleteDialogOpen}
                            handleCancel={this.handleDeleteClose}
                            handleDelete={this.handleDelete}
                        />
                    </div>

                </div>
                <div style={{width:'100%', paddingTop:'10px',paddingBottom:'20px'}}>

                    <div style={styles.subHeading}>
                        General Information
                    </div>
                    <table style={{tableLayout: 'fixed'}}>
                        <tbody>
                        <tr>
                            <td style={styles.tdHeader}>Description</td>
                            <td style={styles.tdData}>{this.props.cartDetails.job.description}</td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Project&nbsp;/ Category</td>
                            <td style={styles.tdData}>{this.props.cartDetails.job.event}</td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Data Sources</td>
                            <td style={styles.tdData} >{
                                providers.map((provider) => {
                                    return <p key={provider.name}>{provider.name}<Info onTouchTap={this.handleProviderOpen.bind(this, provider)} key={provider.description} style={styles.dataSource}/>
                                            <BaseDialog
                                                show={this.state.providerDialogOpen}
                                                title={this.state.providerName}
                                                onClose={this.handleProviderClose.bind(this)}
                                            >
                                                <div style={{paddingTop:'20px', wordWrap: 'break-word'}}>{this.state.providerDesc}</div>
                                            </BaseDialog>
                                        </p>
                                })}
                            </td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>File Formats</td>

                            <td style={styles.tdData}>.gpkg<Info onTouchTap={this.handleFormatsOpen.bind(this)} style={{marginLeft:'10px',height:'18px', width:'18px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/></td>
                            <BaseDialog
                                show={this.state.formatsDialogOpen}
                                title='Format Information'
                                onClose={this.handleFormatsClose.bind(this)}
                            ><div style={{paddingBottom:'20px', wordWrap: 'break-word'}}>
                                EventKit provides all geospatial data in the GeoPackage (.gpkg) format. Additional format support will be added in subsequent versions.</div>
                            </BaseDialog>

                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Projection</td>
                            <td style={styles.tdData}>EPSG:4326 - World Geodetic System 1984 (WGS84)<Info onTouchTap={this.handleProjectionsOpen.bind(this)} style={{marginLeft:'10px',height:'18px', width:'18px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/></td>
                            <BaseDialog
                                show={this.state.projectionsDialogOpen}
                                title='Projection Information'
                                onClose={this.handleProjectionsClose.bind(this)}
                            ><div style={{paddingBottom:'10px', wordWrap: 'break-word'}}>
                                All geospatial data provided by EventKit are in the World Geodetic System 1984 (WGS 84) projection. This projection is also commonly known by its EPSG code: 4326. Additional projection support will be added in subsequent versions.
                            </div>
                            </BaseDialog>
                        </tr>
                        </tbody>
                    </table>
                </div>


                <div style={{width:'100%', float:'left', paddingBottom:'30px'}}>
                    <div style={styles.subHeading}>
                        Selected Area of Interest (AOI)
                    </div>
                    <div id="summaryMap" style={{maxHeight: '400px'}}></div>
                </div>
                <div style={{width:'100%', paddingTop:'30px'}}>
                    <div style={styles.subHeading}>
                        Export Information
                    </div>
                    <table>
                        <tbody>
                        <tr>
                            <td style={styles.tdHeader}>Run By</td>
                            <td style={styles.tdData}>{this.props.cartDetails.user}</td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Run Id</td>
                            <td style={styles.tdData}>{this.props.cartDetails.uid}</td>
                        </tr>
                        <tr>
                            <td style={styles.tdHeader}>Started</td>
                            <td style={styles.tdData}>{moment(this.props.cartDetails.started_at).format('h:mm:ss a, MMMM Do YYYY')}</td>
                        </tr>
                        {this.props.cartDetails.finished_at ?
                            <tr>
                                <td style={styles.tdHeader}>Finished</td>
                                <td style={styles.tdData}>{moment(this.props.cartDetails.finished_at).format('h:mm:ss a, MMMM Do YYYY')}</td>
                            </tr>
                            :
                            null
                        }
                        </tbody>
                    </table>
                </div>

            </div>

        )
    }
}

DataCartDetails.contextTypes = {
    config: React.PropTypes.object
}

DataCartDetails.propTypes = {
    cartDetails: PropTypes.object,
    onRunDelete: PropTypes.func.isRequired,
    onRunRerun:  PropTypes.func.isRequired,
    onUpdateExpiration: PropTypes.func.isRequired,
    onUpdatePermission: PropTypes.func.isRequired,
    onClone:     PropTypes.func.isRequired,
    onProviderCancel: PropTypes.func.isRequired,
    maxResetExpirationDays: PropTypes.string.isRequired,
    providers: PropTypes.array.isRequired
}

export default DataCartDetails;