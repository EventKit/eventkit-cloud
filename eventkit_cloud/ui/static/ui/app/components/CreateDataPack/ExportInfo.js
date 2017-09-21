import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import 'openlayers/dist/ol.css';
import numeral from 'numeral';
import ol from 'openlayers';
import { RadioButton } from 'material-ui/RadioButton';
import { List, ListItem} from 'material-ui/List';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import CustomScrollbar from '../../components/CustomScrollbar';
import {updateExportInfo, stepperNextEnabled, stepperNextDisabled, exportInfoNotDone} from '../../actions/exportsActions.js';
import debounce from 'lodash/debounce';
import Info from 'material-ui/svg-icons/action/info';
import BaseDialog from '../BaseDialog';
import CustomTextField from "../CustomTextField";


export class ExportInfo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            expanded: false,
            formatsDialogOpen: false,
            projectionsDialogOpen: false,
            licenseDialogOpen: false,
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
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT
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

    setLicenseOpen = () => {
        this.setState({licenseDialogOpen: true});
    }

    handleLicenseClose = () => {
        this.setState({licenseDialogOpen: false});
    }

    render() {
        const style ={
            underlineStyle: {
                width: 'calc(100% - 10px)',
                left: '5px'
            },
            window: {
                height: window.innerHeight - 180
            },
            root: {
                width:'100%',
                height: window.innerHeight - 180,
                backgroundImage: 'url('+require('../../../images/topoBackground.jpg')+')',
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap'
            },
            form: {
                margin: '0 auto',
                width:  window.innerWidth < 800 ? '90%' : '60%',
                height: window.innerHeight - 180
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '10px'
            },
            subHeading : {
                fontSize: '16px',
                color: 'black',
                alignContent: 'flex-start'
            },
            sectionBottom : {
                paddingBottom: '50px'
            },
            checkboxLabel: {
                display: 'inline-flex',
            },
            mapCard : {
                paddingBottom: '20px'
            },
            map : {
                width: '100%',
            }
        }

        const providers = this.props.providers.filter((provider) => {
            return provider.display != false;
        });

        return (
            <div style={style.root}>
                <CustomScrollbar>
                    <form onSubmit={this.onSubmit} style={style.form} className={'qa-ExportInfo-form'}>
                        <Paper className={'qa-ExportInfo-Paper'} style={{margin: '0px auto', padding: '20px', marginTop: '30px', marginBottom: '30px', width: '100%', maxWidth: '700px'}} zDepth={2} rounded>
                            <div id='mainHeading' className={'qa-ExportInfo-mainHeading'} style={style.heading}>Enter General Information</div>
                            <CustomTextField
                                className={'qa-ExportInfo-input-name'}
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
                            <CustomTextField
                                className={'qa-ExportInfo-input-description'}
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
                            <CustomTextField
                                className={'qa-ExportInfo-input-project'}
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
                            <div>
                                <Checkbox
                                    className={'qa-ExportInfo-CheckBox-publish'}
                                    name="makePublic"
                                    onCheck={this.toggleCheckbox.bind(this)}
                                    defaultChecked={this.props.exportInfo.makePublic}
                                    style={{left: '0px', paddingLeft: '5px', margin: '30px 0px'}}
                                    label="Make Public"
                                    labelStyle={{fontWeight: 'normal', fontSize:'16px'}}
                                    checkedIcon={<ActionCheckCircle className={'qa-ExportInfo-ActionCheckCircle'} style={{fill: '#55ba63'}} />}
                                    uncheckedIcon={<UncheckedCircle className={'qa-ExportInfo-UncheckedCircle'} style={{fill: '4598bf'}}/>}
                                />
                            </div>
                            
                            <div id="layersHeader" className={'qa-ExportInfo-layersHeader'} style={style.heading}>Select Data Sources</div>
                            <div id='layersSubheader' style={style.subHeading}>You must choose <strong>at least one</strong></div>
                            <div style={style.sectionBottom}>
                                <List className={'qa-ExportInfo-List'} style={{width: '100%', fontSize: '16px'}}>
                                    {providers.map((provider, ix) => {
                                        // Show license if one exists.
                                        const nestedItems = [];
                                        if (provider.license) {
                                            nestedItems.push(
                                                <ListItem
                                                    key={nestedItems.length}
                                                    disabled={true}
                                                    primaryText={
                                                        <div style={{whiteSpace: 'pre-wrap'}}>
                                                            <i>
                                                                Use of this data is governed by <a
                                                                                                    onClick={this.setLicenseOpen}
                                                                                                    style={{cursor: 'pointer', color: '#4598bf'}}
                                                                                                >
                                                                                                    {provider.license.name}
                                                                                                </a>
                                                            </i>
                                                            <BaseDialog
                                                                show={this.state.licenseDialogOpen}
                                                                title={provider.license.name}
                                                                onClose={this.handleLicenseClose}
                                                            >
                                                                <div style={{whiteSpace: 'pre-wrap'}}>{provider.license.text}</div>
                                                            </BaseDialog>
                                                        </div>
                                                    }
                                                    style={{fontSize: '13px', borderTop: '1px solid rgb(224, 224, 224)', paddingLeft: '66px', marginLeft: '0'}}
                                                />
                                            );
                                        }
                                        nestedItems.push(
                                            <ListItem
                                                className={'qa-ExportInfo-ListItem-provServDesc'}
                                                key={nestedItems.length}
                                                primaryText={<div style={{whiteSpace: 'pre-wrap'}}>{provider.service_description}</div>}
                                                disabled={true}
                                                style={{fontSize: '13px', borderTop: '1px solid rgb(224, 224, 224)', paddingLeft: '44px', marginLeft: '0'}}
                                            />
                                        );

                                        const backgroundColor = (ix % 2 === 0) ? 'whitesmoke' : 'white';

                                        return <ListItem
                                            className={'qa-ExportInfo-ListItem'}
                                            key={provider.uid}
                                            style={{backgroundColor: backgroundColor, fontWeight: 'normal', padding: '16px 16px 16px 45px', fontSize: '16px', marginBottom:'0'}}
                                            nestedListStyle={{padding: '0px', backgroundColor: backgroundColor}}
                                            primaryText={provider.name}
                                            leftCheckbox={<Checkbox
                                                className={'qa-ExportInfo-CheckBox-provider'}
                                                name={provider.name}
                                                style={{left: '0px', paddingLeft: '5px'}}
                                                defaultChecked={this.props.exportInfo.providers.map(x => x.name).indexOf(provider.name) == -1 ? false : true}
                                                onCheck={this.onChangeCheck.bind(this)}
                                                checkedIcon={
                                                    <ActionCheckCircle
                                                        className={'qa-ExportInfo-ActionCheckCircle-provider'}
                                                        style={{fill: '#55ba63', paddingLeft: '5px'}}
                                                    />
                                                }
                                                uncheckedIcon={
                                                    <UncheckedCircle
                                                        className={'qa-ExportInfo-UncheckedCircle-provider'}
                                                        style={{fill: '#4598bf', paddingLeft: '5px'}}
                                                    />
                                                }
                                            />}
                                            initiallyOpen={false}
                                            primaryTogglesNestedList={false}
                                            nestedItems={nestedItems}
                                            />
                                    })}
                                </List>
                            </div>

                            <div id='projectionHeader' className={'qu-ExportInfo-projectionHeader'} style={style.heading}>Select Projection</div>
                            <div style={style.sectionBottom}>
                                <div id='projectionCheckbox' style={style.checkboxLabel}>
                                    <Checkbox
                                        className={'qa-ExportInfo-CheckBox-projection'}
                                        label="EPSG:4326 - World Geodetic System 1984 (WGS84)"
                                        name="EPSG:4326"
                                        checked={true}
                                        labelStyle={{fontWeight: 'normal', fontSize:'16px', width:'90%'}}
                                        style={{display:'inlineBlock'}}
                                        disabled={true}
                                        checkedIcon={<ActionCheckCircle className={'qa-ExportInfo-ActionCheckCircle-projection'}/>}
                                    /><Info className={'qa-ExportInfo-Info-projection'} onTouchTap={this.handleProjectionsOpen.bind(this)} style={{marginLeft:'10px',height:'24px', width:'24px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
                                    <BaseDialog
                                        show={this.state.projectionsDialogOpen}
                                        title='Projection Information'
                                        onClose={this.handleProjectionsClose.bind(this)}
                                    ><div style={{paddingBottom:'10px', wordWrap: 'break-word'}} className={'qa-ExportInfo-dialog-projection'}>
                                        All geospatial data provided by EventKit are in the World Geodetic System 1984 (WGS 84) projection. This projection is also commonly known by its EPSG code: 4326. Additional projection support will be added in subsequent versions.
                                    </div>
                                    </BaseDialog>
                                </div>
                            </div>

                            <div id='formatsHeader' className={'qu-ExportInfo-formatsHeader'} style={style.heading}>Select Export File Formats</div>
                            <div style={style.sectionBottom}>
                                <div id='formatsCheckbox' style={style.checkboxLabel}>
                                    <Checkbox
                                        className={'qa-ExportInfo-CheckBox-formats'}
                                        label="Geopackage (.gpkg)"
                                        labelStyle={{fontWeight: 'normal', fontSize:'16px', width:'90%'}}
                                        style={{display:'inlineBlock'}}
                                        name="Geopackage"
                                        checked={true}
                                        disabled={true}
                                        checkedIcon={<ActionCheckCircle className={'qa-ExportInfo-ActionCheckCircle-formats'} />}
                                    /><Info className={'qa-ExportInfo-Info-formats'} onTouchTap={this.handleFormatsOpen.bind(this)} style={{marginLeft:'10px',height:'24px', width:'24px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
                                    <BaseDialog
                                        show={this.state.formatsDialogOpen}
                                        title='Format Information'
                                        onClose={this.handleFormatsClose.bind(this)}
                                    ><div style={{paddingBottom:'20px', wordWrap: 'break-word'}}  className={'qa-ExportInfo-dialog-formats'}>
                                        EventKit provides all geospatial data in the GeoPackage (.gpkg) format. Additional format support will be added in subsequent versions.</div>
                                    </BaseDialog>
                                </div>
                            </div>

                            <div style={style.mapCard}>
                                <Card expandable={true}
                                      className={'qa-ExportInfo-Card-map'}
                                    onExpandChange={this.expandedChange.bind(this)}>
                                    <CardHeader
                                        className={'qa-ExportInfo-CardHeader-map'}
                                        title="Selected Area of Interest"
                                        actAsExpander={false}
                                        showExpandableButton={true}
                                        style={{padding: '12px 10px 10px', backgroundColor: 'rgba(179, 205, 224, .2)'}}
                                        textStyle={{paddingRight: '6px', fontWeight: 'bold', fontSize: '18px'}}>
                                        <a onClick={this.props.handlePrev}
                                           style={{fontSize: '15px', fontWeight: 'normal', verticalAlign: 'top', cursor: 'pointer'}}>
                                            Edit
                                        </a>
                                    </CardHeader>
                                    <CardText
                                        className={'qa-ExportInfo-CardText-map'}
                                        expandable={true}
                                        style={{padding: '5px', backgroundColor: 'rgba(179, 205, 224, .2)'}}>
                                        <div id="infoMap" style={style.map}></div>
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
