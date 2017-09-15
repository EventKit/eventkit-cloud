import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import 'openlayers/dist/ol.css';
import numeral from 'numeral';
import ol from 'openlayers';
import { RadioButton } from 'material-ui/RadioButton';
import { List, ListItem} from 'material-ui/List';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import styles from '../../styles/ExportInfo.css';
import CustomScrollbar from '../../components/CustomScrollbar';
import {updateExportInfo, stepperNextEnabled, stepperNextDisabled, exportInfoNotDone} from '../../actions/exportsActions.js';
import debounce from 'lodash/debounce';
import Info from 'material-ui/svg-icons/action/info';
import BaseDialog from '../BaseDialog';


export class ExportInfo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            expanded: false,
            formatsDialogOpen: false,
            projectionsDialogOpen: false,
        }
        this.onNameChange = this.onNameChange.bind(this);
        this.onDescriptionChange = this.onDescriptionChange.bind(this);
        this.onProjectChange = this.onProjectChange.bind(this);        
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.hasRequiredFields = this.hasRequiredFields.bind(this);
        this._initializeOpenLayers = this._initializeOpenLayers.bind(this);
    }

    componentDidMount() {        
        // if the state does not have required data disable next
        if (!this.hasRequiredFields(this.props.exportInfo)) {
            this.props.setNextDisabled();
        }

        // calculate the area of the AOI
        this.setArea();

        // set up debounce functions for user text input
        this.nameHandler = debounce(event => {
            this.props.updateExportInfo({
                ...this.props.exportInfo, 
                exportName: event.target.value
            });
        }, 250);
        this.descriptionHandler = debounce(event => {
            this.props.updateExportInfo({
                ...this.props.exportInfo,
                datapackDescription: event.target.value
            });
        }, 250);
        this.projectHandler = debounce(event => {
            this.props.updateExportInfo({
                ...this.props.exportInfo,
                projectName: event.target.value
            });
        }, 250);

        // listen for screensize updates
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentDidUpdate(prevProps, prevState) {
        // if the user expaned the AOI section mount the map
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers()
            }
        }

    }

    componentWillUnmount() {
        // clean up listener
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    componentWillReceiveProps(nextProps) {
        // if required fields are fulfilled enable next
        if (this.hasRequiredFields(nextProps.exportInfo)) {
            if (!nextProps.nextEnabled) {
                this.props.setNextEnabled();
            }
        }
        // if not and next is enabled it should be disabled
        else if (nextProps.nextEnabled) {
            this.props.setNextDisabled();
        }
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    onNameChange(e) {
        e.persist();
        this.nameHandler(e);
    }

    onDescriptionChange(e) {
        e.persist();
        this.descriptionHandler(e);
    }

    onProjectChange(e) {
        e.persist();
        this.projectHandler(e);
    }

    onChangeCheck(e){
        // current array of providers
        let providers = [...this.props.exportInfo.providers];
        const propsProviders = this.props.providers;
        let index;
        // check if the check box is checked or unchecked
        if (e.target.checked) {
            // add the provider to the array
            for (let i=0; i < propsProviders.length; i++) {
                if (propsProviders[i].name === e.target.name) {
                    providers.push(propsProviders[i]);
                    break;
                }
            }
        } else {
            // or remove the value from the unchecked checkbox from the array
            index = providers.map(x => x.name).indexOf(e.target.name);
            for (let i=0; i <propsProviders.length; i++) {
                if (propsProviders[i].name === e.target.name) {
                    providers.splice(index,1);
                }
            }
        }
        // update the state with the new array of options
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            providers: providers
        });
    }

    toggleCheckbox(event, checked) {
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            makePublic: checked
        });
    }

    expandedChange(expanded) {
        this.setState({expanded: expanded})
    }

    hasRequiredFields(exportInfo) {
        // if the required fields are populated return true, else return false
        return exportInfo.exportName
            && exportInfo.datapackDescription 
            && exportInfo.projectName 
            && exportInfo.providers.length > 0;
    }

    setArea() {
        const source = new ol.source.Vector({wrapX: true})
        const geojson = new ol.format.GeoJSON()
        const feature = geojson.readFeature(this.props.geojson.features[0], {
            'featureProjection': 'EPSG:3857',
            'dataProjection': 'EPSG:4326'
        })
        source.addFeature(feature)
        const layer = new ol.layer.Vector({
            source: source,
        })
        const area = feature.getGeometry().getArea() / 1000000
        const area_str = numeral(area).format('0,0')
        this.props.updateExportInfo({
            ...this.props.exportInfo,
            area_str: area_str + ' sq km'
        });
    }

    _initializeOpenLayers() {
        const base = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true
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
            target: 'infoMap',
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
        const feature = geojson.readFeature(this.props.geojson.features[0], {
            'featureProjection': 'EPSG:3857',
            'dataProjection': 'EPSG:4326'
        });
        source.addFeature(feature)
        const layer = new ol.layer.Vector({
            source: source,
        });

        this._map.addLayer(layer)
        this._map.getView().fit(source.getExtent(), this._map.getSize())
    }

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

    render() {
        const style ={
            underlineStyle: {
                width: 'calc(100% - 10px)',
                left: '5px'
            },
            window: {
                height: window.innerHeight - 180
            }
        }
        const providers = this.props.providers.filter((provider) => {
            return provider.display != false;
        });

        return (
            <div className={styles.root} style={style.window}>
                <CustomScrollbar>
                    <form className={styles.form} onSubmit={this.onSubmit} style={style.window}>
                        <Paper className={styles.paper} zDepth={2} rounded>
                            <div id='mainHeading' className={styles.heading}>Enter General Information</div>
                            <TextField
                                id='nameField' 
                                name="exportName"
                                ref="exportName"
                                underlineStyle={style.underlineStyle}
                                underlineFocusStyle={style.underlineStyle}
                                onChange={this.onNameChange}
                                defaultValue={this.props.exportInfo.exportName}
                                hintText="Datapack Name"
                                style={{backgroundColor: 'whitesmoke', width: '100%',  marginTop: '15px'}}
                                inputStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                hintStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                maxLength={100}
                            />
                            <TextField
                                id='descriptionField'
                                underlineStyle={style.underlineStyle}
                                underlineFocusStyle={style.underlineStyle}
                                name="datapackDescription"
                                onChange={this.onDescriptionChange}
                                defaultValue={this.props.exportInfo.datapackDescription}
                                hintText="Description"
                                multiLine={true}
                                style={{backgroundColor: 'whitesmoke', width: '100%', marginTop: '15px'}}
                                textareaStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                hintStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                maxLength={1000}
                            />
                            <TextField
                                id='projectField'
                                underlineStyle={style.underlineStyle}
                                underlineFocusStyle={style.underlineStyle}
                                name="projectName"
                                onChange={this.onProjectChange}
                                defaultValue={this.props.exportInfo.projectName}
                                hintText="Project Name"
                                style={{backgroundColor: 'whitesmoke', width: '100%',  marginTop: '15px'}}
                                inputStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                hintStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                maxLength={100}
                            />
                            <div className={styles.checkbox}>
                                <Checkbox
                                    name="makePublic"
                                    onCheck={this.toggleCheckbox.bind(this)}
                                    defaultChecked={this.props.exportInfo.makePublic}
                                    style={{left: '0px', paddingLeft: '5px'}}
                                    label="Make Public"
                                    checkedIcon={<ActionCheckCircle style={{fill: '#55ba63'}} />}
                                    uncheckedIcon={<UncheckedCircle style={{fill: '4598bf'}}/>}
                                />
                            </div>
                            
                            <div id="layersHeader" className={styles.heading}>Select Data Sources</div>
                            <div id='layersSubheader' className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                            <div className={styles.sectionBottom}>
                                <List className={styles.list}>
                                    {providers.map((provider, ix) => {
                                        return <ListItem
                                            key={provider.uid}
                                            style={{backgroundColor: ix % 2 == 0 ? 'whitesmoke': 'white'}}
                                            nestedListStyle={{padding: '0px'}}
                                            primaryText={provider.name}
                                            leftCheckbox={<Checkbox
                                                name={provider.name}
                                                style={{left: '0px', paddingLeft: '5px'}}
                                                defaultChecked={this.props.exportInfo.providers.map(x => x.name).indexOf(provider.name) == -1 ? false : true}
                                                onCheck={this.onChangeCheck.bind(this)}
                                                checkedIcon={
                                                    <ActionCheckCircle
                                                        style={{fill: '#55ba63', paddingLeft: '5px'}}
                                                    />
                                                }
                                                uncheckedIcon={
                                                    <UncheckedCircle
                                                        style={{fill: '#4598bf', paddingLeft: '5px'}}
                                                    />
                                                }
                                            />}
                                            initiallyOpen={false}
                                            primaryTogglesNestedList={false}
                                            nestedItems={[
                                                    <ListItem
                                                        key={1}
                                                        primaryText={<div style={{whiteSpace: 'pre-wrap'}}>{provider.service_description}</div>}
                                                        style={{backgroundColor: ix % 2 == 0 ? 'whitesmoke': 'white', fontSize: '16px'}}
                                                    />
                                                ]}
                                            />
                                    })}
                                </List>
                            </div>

                            <div id='projectionHeader' className={styles.heading}>Select Projection</div>
                            <div className={styles.sectionBottom}>
                                <div id='projectionCheckbox' className={styles.checkboxLabel}>
                                    <Checkbox
                                        label="EPSG:4326 - World Geodetic System 1984 (WGS84)"
                                        name="EPSG:4326"
                                        checked={true}
                                        style={{display:'inlineBlock'}}
                                        disabled={true}
                                        checkedIcon={<ActionCheckCircle />}
                                    /><Info onTouchTap={this.handleProjectionsOpen.bind(this)} style={{marginLeft:'10px',height:'24px', width:'24px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
                                    <BaseDialog
                                        show={this.state.projectionsDialogOpen}
                                        title='Projection Information'
                                        onClose={this.handleProjectionsClose.bind(this)}
                                    ><div style={{paddingBottom:'10px', wordWrap: 'break-word'}}>
                                        All geospatial data provided by EventKit are in the World Geodetic System 1984 (WGS 84) projection. This projection is also commonly known by its EPSG code: 4326. Additional projection support will be added in subsequent versions.
                                    </div>
                                    </BaseDialog>
                                </div>
                            </div>

                            <div id='formatsHeader' className={styles.heading}>Select Export File Formats</div>
                            <div className={styles.sectionBottom}>
                                <div id='formatsCheckbox' className={styles.checkboxLabel}>
                                    <Checkbox
                                        label="Geopackage (.gpkg)"
                                        style={{display:'inlineBlock'}}
                                        name="Geopackage"
                                        checked={true}
                                        disabled={true}
                                        checkedIcon={<ActionCheckCircle />}
                                    /><Info onTouchTap={this.handleFormatsOpen.bind(this)} style={{marginLeft:'10px',height:'24px', width:'24px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
                                    <BaseDialog
                                        show={this.state.formatsDialogOpen}
                                        title='Format Information'
                                        onClose={this.handleFormatsClose.bind(this)}
                                    ><div style={{paddingBottom:'20px', wordWrap: 'break-word'}}>
                                        EventKit provides all geospatial data in the GeoPackage (.gpkg) format. Additional format support will be added in subsequent versions.</div>
                                    </BaseDialog>
                                </div>
                            </div>

                            <div className={styles.mapCard}>
                                <Card expandable={true}
                                    onExpandChange={this.expandedChange.bind(this)}>
                                    <CardHeader
                                        title="Selected Area of Interest"
                                        actAsExpander={false}
                                        showExpandableButton={true}
                                        textStyle={{paddingRight: '6px'}}>
                                        <a onClick={this.props.handlePrev}
                                           style={{fontSize: '15px', fontWeight: 'normal', verticalAlign: 'top', cursor: 'pointer'}}>
                                            Edit
                                        </a>
                                    </CardHeader>
                                    <CardText expandable={true}>
                                        <div id="infoMap" className={styles.map}></div>
                                    </CardText>
                                </Card>
                            </div>
                        </Paper>
                    </form>
                </CustomScrollbar>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportInfo: state.exportInfo,
        providers: state.providers,
        nextEnabled: state.stepperNextEnabled,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportInfo) => {
            dispatch(updateExportInfo(exportInfo))
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled())
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled())
        }
    }
}

ExportInfo.contextTypes = {
    config: React.PropTypes.object
}

ExportInfo.propTypes = {
    geojson: PropTypes.object.isRequired,
    exportInfo: PropTypes.object.isRequired,
    providers: PropTypes.array.isRequired,
    nextEnabled: PropTypes.bool.isRequired,
    handlePrev: PropTypes.func.isRequired,
    updateExportInfo: PropTypes.func.isRequired,
    setNextDisabled: PropTypes.func.isRequired,
    setNextEnabled: PropTypes.func.isRequired
}

export default connect(
    mapStateToProps, 
    mapDispatchToProps
)(ExportInfo)
