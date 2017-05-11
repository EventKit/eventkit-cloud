import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import 'openlayers/dist/ol.css'
import numeral from 'numeral'
import ol from 'openlayers'
import { reduxForm, Field } from 'redux-form'
import { RadioButton } from 'material-ui/RadioButton'
import { List, ListItem} from 'material-ui/List'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card'
import TextField from 'material-ui/TextField'
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle'
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import Paper from 'material-ui/Paper'
import Checkbox from 'material-ui/Checkbox'
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../components/tap_events'
import styles from '../styles/ExportInfo.css'
import CustomScrollbar from '../components/CustomScrollbar';
import {updateExportInfo, stepperNextEnabled, stepperNextDisabled, exportInfoNotDone} from '../actions/exportsActions.js'


export class ExportInfo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            exportName: '',
            datapackDescription: '',
            projectName: '',
            makePublic: false,
            providers: [],
            area: 0,
            area_str: '',
            expanded: false,
            layers: 'Geopackage',
        }
        this.onChange = this.onChange.bind(this);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    onChange(event) {

        console.log(this.state);
        this.setState({[event.target.name]: event.target.value}, function () {
            if (!this.state.exportName || !this.state.datapackDescription || !this.state.projectName || !this.state.providers.length > 0) {
                this.props.setNextDisabled()
            }
            else {
                this.props.setNextEnabled()
            }
        })

    }

    onChangeCheck(e){
            // current array of providers
            const providers = this.state.providers;
            let index;

            // check if the check box is checked or unchecked
            if (e.target.checked) {
                // add the provider to the array
                providers.push(e.target.name)
            } else {
                // or remove the value from the unchecked checkbox from the array
                index = providers.indexOf(e.target.name)
                providers.splice(index, 1)
            }
            // update the state with the new array of options
            this.setState({ providers: providers } ,function (){
            if (!this.state.exportName || !this.state.datapackDescription || !this.state.projectName || !this.state.providers.length > 0) {
                this.props.setNextDisabled()
            }
            else {
                this.props.setNextEnabled()
            }
        })

    }
    toggleCheckbox(event, checked) {

        this.setState({makePublic: checked})
    }

    expandedChange(expanded) {
        this.setState({expanded: expanded})
    }


    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)}
    }
    componentDidMount() {
        this.props.setExportInfoNotDone();
        if (this.props.exportInfo.exportName == ''){
            this.props.setNextDisabled()
        }
        this.setArea();
        if (this.state.exportName == "" && this.props.exportInfo.exportName != ""){
            this.setState({
                exportName : this.props.exportInfo.exportName,
                datapackDescription: this.props.exportInfo.datapackDescription,
                projectName: this.props.exportInfo.projectName,
                makePublic: this.props.exportInfo.makePublic,
                providers: this.props.exportInfo.providers,
            })
        }

    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers()
            }
        }

    }

    componentWillMount() {
        this.screenSizeUpdate();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.setExportPackageFlag != false) {
            this.props.updateExportInfo(this.state.exportName, this.state.datapackDescription, this.state.projectName, this.state.makePublic, this.state.providers, this.state.area_str, this.state.layers)
            this.props.incrementStepper();
        }
    }

    setArea() {
        const source = new ol.source.Vector()
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
        this.setState({area: area, area_str: area_str + ' sq km'})

    }
    _initializeOpenLayers() {
        var osm = new ol.layer.Tile({
            source: new ol.source.OSM()
        })

        this._map = new ol.Map({
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false
            }),
            layers: [osm],
            target: 'infoMap',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            })
        })
        const source = new ol.source.Vector()
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

        this._map.addLayer(layer)
        this._map.getView().fit(source.getExtent(), this._map.getSize())

    }
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
        const providers = this.props.providers

        return (
            <div className={styles.root} style={style.window}>
                <CustomScrollbar>
                    <form className={styles.form} onSubmit={this.onSubmit} style={style.window}>
                        <Paper className={styles.paper} zDepth={2} rounded>
                            <div id='mainHeading' className={styles.heading}>Enter General Information</div>
                                <TextField name="exportName"
                                    ref="exportName"
                                    underlineStyle={style.underlineStyle}
                                    underlineFocusStyle={style.underlineStyle}
                                    onChange={this.onChange}
                                    defaultValue={this.props.exportInfo.exportName}
                                    hintText="Datapack Name"
                                    style={{backgroundColor: 'whitesmoke', width: '100%',  marginTop: '15px'}}
                                    inputStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                    hintStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                />
                                <TextField
                                    underlineStyle={style.underlineStyle}
                                    underlineFocusStyle={style.underlineStyle}
                                    name="datapackDescription"
                                    onChange={this.onChange}
                                    defaultValue={this.props.exportInfo.datapackDescription}
                                    hintText="Description"
                                    multiLine={true}
                                    rows={2}
                                    style={{backgroundColor: 'whitesmoke', width: '100%', marginTop: '15px'}}
                                    textareaStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                    hintStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                />
                                <TextField
                                    underlineStyle={style.underlineStyle}
                                    underlineFocusStyle={style.underlineStyle}
                                    name="projectName"
                                    onChange={this.onChange}
                                    defaultValue={this.props.exportInfo.projectName}
                                    hintText="Project Name"
                                    style={{backgroundColor: 'whitesmoke', width: '100%',  marginTop: '15px'}}
                                    inputStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                    hintStyle={{fontSize: '16px', paddingLeft: '5px'}}
                                />
                                <div className={styles.checkbox}>
                                    <Checkbox
                                        name="makePublic"
                                        onCheck={this.toggleCheckbox.bind(this)}
                                        //checked={!!this.state.makePublic}
                                        defaultChecked={this.props.exportInfo.makePublic}
                                        className={styles.checkboxColor}
                                        label="Make Public"
                                        checkedIcon={<ActionCheckCircle />}
                                        uncheckedIcon={<UncheckedCircle />}
                                />
                            </div>

                            <div id="layersHeader" className={styles.heading}>Select Layers</div>
                            <div className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                            <div className={styles.sectionBottom}>
                                <List className={styles.list}>
                                    {providers.map((provider) => (
                                    <ListItem
                                        key={provider.uid}
                                        primaryText={provider.name}
                                        leftCheckbox={<Checkbox
                                        name={provider.name}
                                        defaultChecked={this.props.exportInfo.providers.indexOf(provider.name) == -1 ? false : true}
                                        onCheck={this.onChangeCheck.bind(this)}
                                        className={styles.checkboxColor}
                                        checkedIcon={<ActionCheckCircle />}
                                        uncheckedIcon={<UncheckedCircle
                                        className={styles.checkboxColor}/>}
                                    />}
                                    initiallyOpen={false}
                                    primaryTogglesNestedList={false}
                                    nestedItems={[
                                            <ListItem
                                            key={1}
                                            primaryText={provider.service_description}

                                            />
                                        ]}
                                    />
                                    ))}
                                </List>
                            </div>

                    <div className={styles.heading}>Select Export File Formats</div>
                    <div className={styles.sectionBottom}>
                        <div className={styles.checkboxLabel}>
                            <Checkbox
                            label="Geopackage (.gpkg)"
                            name="Geopackage"
                            checked={true}
                            disabled={true}
                            checkedIcon={<ActionCheckCircle />}
                        />
                        </div>
                     </div>
                            <div className={styles.heading}>Select Export File Formats</div>
                            <div className={styles.sectionBottom}>
                                <div className={styles.checkboxLabel}>
                                    <Checkbox
                                        label="Geopackage (.gpkg)"
                                        name="Geopackage"
                                        checked={true}
                                        disabled={true}
                                        checkedIcon={<ActionCheckCircle />}
                                    />
                                </div>
                            </div>

                            <div className={styles.mapCard}>
                                <Card expandable={true}
                                    onExpandChange={this.expandedChange.bind(this)}>
                                    <CardHeader
                                        title="Selected Area of Interest"
                                        actAsExpander={true}
                                        showExpandableButton={true}
                                    />
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
        setExportPackageFlag: state.setExportPackageFlag,
        exportInfo: state.exportInfo,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        updateExportInfo: (exportName,
                           datapackDescription,
                           projectName,
                           makePublic,
                           providers,
                           area_str,
                           layers

                           ) => {
            dispatch(updateExportInfo(exportName,
                datapackDescription,
                projectName,
                makePublic,
                providers,
                area_str,
                layers
                ))
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled())
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled())
        },
        setExportInfoNotDone: () => {
            dispatch(exportInfoNotDone());
        }

    }
}

ExportInfo.propTypes = {
    geojson:         React.PropTypes.object,
    providers:       PropTypes.array.isRequired,
    exportInfo:     React.PropTypes.object,
    incrementStepper: React.PropTypes.func,

}

ExportInfo.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
}

ExportInfo =  reduxForm({
    form: 'exportInfo',
    destroyOnUnmount: false,
    initialValues: {
    }
})(ExportInfo)

export default connect(
    mapStateToProps, 
    mapDispatchToProps
)(ExportInfo)
