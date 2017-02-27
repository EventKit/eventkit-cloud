import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { RadioButton } from 'material-ui/RadioButton'
import { List, ListItem} from 'material-ui/List'
import TextField from 'material-ui/TextField'
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle'
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import Paper from 'material-ui/Paper'
import Checkbox from 'material-ui/Checkbox'
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../components/tap_events'
import styles from '../styles/ExportInfo.css'

class ExportInfo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            exportName: '',
            datapackDescription: '',
            projectName: '',
            makePublic: false,
            osmData: false,
            osmTiles: false,
            digitalGlobe: false,
        }
        this.onChange = this.onChange.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
    }
    onChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    toggleCheckbox(event, checked) {
        this.setState({
            [event.target.name]: checked
        });
    }

    onSubmit(e) {
        e.preventDefault()
        console.log("made it here")
        this.props.createExportRequest(this.state)
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    componentDidMount() {
        //this.refs.datapackName            // the Field
        //    .getRenderedComponent() // on Field, returns ReduxFormMaterialUITextField
        //    .getRenderedComponent() // on ReduxFormMaterialUITextField, returns TextField
        //    .focus()                // on TextField
    }
    render() {

        return (
            <div className={styles.wholeDiv}>
            <div className={styles.root}>
                <form className={styles.form} onSubmit={this.onSubmit}>
                    <Paper className={styles.paper} zDepth={2} rounded>
                <div id='mainHeading' className={styles.heading}>Enter General Information</div>
                    <div className={styles.fieldWrapper}>
                        <TextField name="exportName"
                               onChange={this.onChange}
                               value={this.state.exportName}
                               hintText="Datapack Name"
                               className={styles.textField}
                               />
                    </div>
                    <div className={styles.fieldWrapperLarge}>
                        <TextField
                            name="datapackDescription"
                            onChange={this.onChange}
                            value={this.state.datapackDescription}
                            hintText="Description"
                            multiLine={true}
                            rows={2}/>
                    </div>
                    <div className={styles.fieldWrapper}>
                        <TextField
                            name="projectName"
                            onChange={this.onChange}
                            value={this.state.projectName}
                            hintText="Project Name"
                            className={styles.textField}/>
                    </div>
                    <div className={styles.checkbox}>
                        <Checkbox
                            name="makePublic"
                            onCheck={this.toggleCheckbox.bind(this)}
                            checked={this.state.makePublic}
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
                            <ListItem
                            primaryText="OpenStreetMap Data"
                            leftIcon={<Checkbox
                                name="osmData"
                                onCheck={this.toggleCheckbox.bind(this)}
                                checked={this.state.osmData}
                                className={styles.checkboxColor}
                                checkedIcon={<ActionCheckCircle />}
                                uncheckedIcon={<UncheckedCircle
                                className={styles.checkboxColor}/>}
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
                            />
                        </List>

                        </div>
                    {/*
                    <div className={styles.heading}>Select Export File Formats</div>
                    <div className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                    <div style={{marginTop: '15px'}} className={styles.subHeading}><strong>Recommended</strong></div>
                    <div className={styles.sectionBottom}>
                        <div className={styles.checkboxLabel}>
                            <Field name="geopackage"
                                   component={Checkbox}
                                   className={styles.checkboxColor}
                                   checkedIcon={<ActionCheckCircle />}
                                   uncheckedIcon={<UncheckedCircle />}
                                   label="GeoPackage (gpkg)"/>
                        </div>
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
                            </List>
                     </div>
                     */}

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
        exportInfo: state.exportInfo,
    }
}


ExportInfo.propTypes = {
    bbox:            React.PropTypes.arrayOf(React.PropTypes.number),
    createExportRequest: React.PropTypes.func.isRequired,
}

ExportInfo.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
}

ExportInfo =  reduxForm({
    form: 'exportInfo',
    initialValues: {
    }
})(ExportInfo)

ExportInfo = connect(mapStateToProps)(ExportInfo)

export default ExportInfo
