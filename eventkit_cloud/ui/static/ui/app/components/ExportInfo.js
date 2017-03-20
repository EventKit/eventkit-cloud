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
import {updateExportInfo, stepperNextEnabled, stepperNextDisabled} from '../actions/exportsActions.js'


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
        this.onChange = this.onChange.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
    }

    onChange(event) {
        console.log(this.state)
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
            const providers = this.state.providers
            let index

            // check if the check box is checked or unchecked
            if (e.target.checked) {
                // add the numerical value of the checkbox to options array
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

    onSubmit(e) {
        e.preventDefault()
        //this.props.updateExportInfo(this.state.exportName, this.state.datapackDescription, this.state.projectName, this.state.makePublic, this.state.area, this.state.area_str)
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)}
    }
    componentDidMount() {
        if (this.props.exportName == ''){
            this.props.setNextDisabled()
        }
        this.setArea();
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers()
            }
        }
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.setExportPackageFlag != false) {
            this.props.updateExportInfo(this.state.exportName, this.state.datapackDescription, this.state.projectName, this.state.makePublic, this.state.providers, this.state.area_str, this.state.layers)
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
                width: 'calc(100% - 10px)'
            }
        }
        const providers = this.props.providers

        return (
            <div className={styles.wholeDiv}>
            <div className={styles.root}>

                <form className={styles.form} onSubmit={this.onSubmit} >
                    <Paper className={styles.paper} zDepth={2} rounded>

                <div id='mainHeading' className={styles.heading}>Enter General Information</div>
                    <div className={styles.fieldWrapper}>
                        <TextField name="exportName"
                               underlineStyle={style.underlineStyle}
                               underlineFocusStyle={style.underlineStyle}
                               onChange={this.onChange}
                               //value={this.state.exportName}
                               hintText="Datapack Name"
                               className={styles.textField}
                               />
                    </div>
                    <div className={styles.fieldWrapperLarge}>
                        <TextField
                            underlineStyle={style.underlineStyle}
                            underlineFocusStyle={style.underlineStyle}
                            name="datapackDescription"
                            onChange={this.onChange}
                            //value={this.state.datapackDescription}
                            hintText="Description"
                            multiLine={true}
                            rows={2}/>
                    </div>
                    <div className={styles.fieldWrapper}>
                        <TextField
                            underlineStyle={style.underlineStyle}
                            underlineFocusStyle={style.underlineStyle}
                            name="projectName"
                            onChange={this.onChange}
                            //value={this.state.projectName}
                            hintText="Project Name"
                            className={styles.textField}/>
                    </div>
                    <div className={styles.checkbox}>
                        <Checkbox
                            name="makePublic"
                            onCheck={this.toggleCheckbox.bind(this)}
                            checked={!!this.state.makePublic}

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
                            {/*<ListItem
                                primaryText="OpenStreetMap Tiles"
                                leftIcon={<Checkbox
                                    name="osmTiles"
                                    onCheck={this.toggleCheckbox.bind(this)}
                                    checked={this.state.osmTiles}
                                    className={styles.checkboxColor}
                                    checkedIcon={<ActionCheckCircle />}
                                    uncheckedIcon={<UncheckedCircle />}
                                />}
                                initiallyOpen={false}
                                primaryTogglesNestedList={true}
                                nestedItems={[
                                    <ListItem
                                      key={1}
                                      primaryText="bla blah blah blaaaaaaah blahalklasdfjlaksjdf asdldkfjasldfj asdlkfklsadfjlkasdfjlkasddfjlkasdfjlkasdfjlkdsajflkasdf"

                                    />
                                ]}
                            />
                            <ListItem
                                primaryText="DigitalGlobe Satellite Imagery Foundation Mosaic"
                                leftIcon={ <Checkbox
                                    name="digitalGlobe"
                                    onCheck={this.toggleCheckbox.bind(this)}
                                    checked={this.state.digitalGlobe}
                                    className={styles.checkboxColor}
                                    checkedIcon={<ActionCheckCircle />}
                                    uncheckedIcon={<UncheckedCircle />}
                                />}
                                initiallyOpen={false}
                                primaryTogglesNestedList={true}
                                nestedItems={[
                                    <ListItem
                                      key={1}
                                      primaryText="bla blah blah blaaaaaaah blahalklasdfjlaksjdf asdldkfjasldfj asdlkfklsadfjlkasdfjlkasddfjlkasdfjlkasdfjlkdsajflkasdf"

                                    />
                                ]}
                            />*/}


                        </div>

                    <div className={styles.heading}>Select Export File Formats</div>
                        {/*<div className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                    <div style={{marginTop: '15px'}} className={styles.subHeading}><strong>Recommended</strong></div>*/}
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
                        {/*
                        <div className={styles.checkboxLabel}>
                            <Field name="esriShape"
                                   component={Checkbox}
                                   className={styles.checkboxColor}
                                   checkedIcon={<ActionCheckCircle />}
                                   uncheckedIcon={<UncheckedCircle />}
                                   label="Esri Shapefile (.shp)"/>
                        </div>
                        <List className={styles.listBottom}>
                        <ListItem
                            value={1}
                            primaryText="Other Format Options"
                            nestedItems={[
                                <ListItem
                                key={1}
                                primaryText="GeoTiff (.tiff)"
                                leftAvatar={<Field name="geoTiff"
                                checkedIcon={<ActionCheckCircle />}
                               uncheckedIcon={<UncheckedCircle />}
                               component={Checkbox}/>}
                               className={styles.checkboxColor}
                              />,
                              <ListItem
                                key={2}
                                primaryText="Google Earth (.kmz)"
                                leftAvatar={<Field name="googleEarth"
                                checkedIcon={<ActionCheckCircle />}
                               uncheckedIcon={<UncheckedCircle />}
                               component={Checkbox}/>}
                               className={styles.checkboxColor}
                              />,
                              <ListItem
                                key={3}
                                primaryText="SQLite (.sqlite)"
                                leftAvatar={<Field name="sqlite"
                                checkedIcon={<ActionCheckCircle />}
                               uncheckedIcon={<UncheckedCircle />}
                               component={Checkbox}/>}
                               className={styles.checkboxColor}
                              />,
                              <ListItem
                                key={4}
                                primaryText="OSMAnd (.obf)"
                                leftAvatar={<Field name="osmand"
                                checkedIcon={<ActionCheckCircle />}
                               uncheckedIcon={<UncheckedCircle />}
                               component={Checkbox}/>}
                               className={styles.checkboxColor}
                              />
                            ]}
                        />
                            </List>*/}
                     </div>

                        <div className={styles.mapCard}>
                            <Card expandable={true}
                                  onExpandChange={this.expandedChange.bind(this)}>
                                <CardHeader
                                    title="Selected Area of Interest"
                                    actAsExpander={true}
                                    showExpandableButton={true}
                                />
                                <CardText expandable={true}> <div id="infoMap" className={styles.map} >

                                </div>


                                </CardText>
                            </Card>
                        </div>
                    </Paper>
                </form>

            </div>
            </div>


        )
    }
}
function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        geojson: state.aoiInfo.geojson,
        setExportPackageFlag: state.setExportPackageFlag,
        exportName: state.exportInfo.exportName,
        datapackDescription: state.exportInfo.datapackDescription,
        projectName: state.exportInfo.projectName,
        makePublic: state.exportInfo.makePublic,
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

    }
}

ExportInfo.propTypes = {
    geojson:         React.PropTypes.object,
    providers:       PropTypes.array.isRequired,

}

ExportInfo.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
}

ExportInfo =  reduxForm({
    form: 'exportInfo',
    initialValues: {
    }
})(ExportInfo)

export default connect(
    mapStateToProps, 
    mapDispatchToProps
)(ExportInfo)
