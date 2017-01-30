import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { RadioButton } from 'material-ui/RadioButton'
import { List, ListItem} from 'material-ui/List'
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked';
import Paper from 'material-ui/Paper';

import {
    Checkbox,
    RadioButtonGroup,
    SelectField,
    TextField,
    Toggle
} from 'redux-form-material-ui'
import styles from './ExportInfo.css'

class ExportInfo extends React.Component {
    componentDidMount() {
        this.refs.datapackName            // the Field
            .getRenderedComponent() // on Field, returns ReduxFormMaterialUITextField
            .getRenderedComponent() // on ReduxFormMaterialUITextField, returns TextField
            .focus()                // on TextField
    }
    render() {



        return (
            <div className={styles.wholeDiv}>
            <div className={styles.root}>
                <form className={styles.form}>
                    <Paper className={styles.paper} zDepth={2} rounded>
                <div className={styles.heading}>Enter General Information</div>
                    <div className={styles.fieldWrapper}>
                        <Field name="datapackName"
                               className={styles.textField}
                               component={TextField}
                               hintText="Name"
                               ref="datapackName" withRef/>
                    </div>
                    <div className={styles.fieldWrapperLarge}>
                        <Field
                            name="description"
                            component={TextField}
                            hintText="Description"
                            multiLine={true}
                            rows={2}/>
                    </div>
                    <div className={styles.fieldWrapper}>
                        <Field
                            name="projectName"
                            component={TextField}
                            hintText="Project Name"/>
                    </div>
                    <div className={styles.checkbox}>
                        <Field name="makePublic"
                               component={Checkbox}
                               className={styles.checkboxColor}
                               label="Make Public"
                               checkedIcon={<ActionCheckCircle />}
                               uncheckedIcon={<UncheckedCircle />}
                               />
                    </div>

                    <div className={styles.heading}>Select Layers</div>
                    <div className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                    <div className={styles.sectionBottom}>
                        <List className={styles.list}>

                            <ListItem
                            primaryText="OpenStreetMap Data"
                            leftIcon={ <Field name="osmData"
                            component={Checkbox}
                            className={styles.checkboxColor}
                            checkedIcon={<ActionCheckCircle />}
                            uncheckedIcon={<UncheckedCircle className={styles.checkboxColor}/>} />}
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
                                leftIcon={<Field name="osmTiles"
                                component={Checkbox}
                                className={styles.checkboxColor}
                                checkedIcon={<ActionCheckCircle />}
                                uncheckedIcon={<UncheckedCircle />} />}
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
                                leftIcon={ <Field name="digitalGlobe" 
                                component={Checkbox}
                                className={styles.checkboxColor}
                                checkedIcon={<ActionCheckCircle />}
                                uncheckedIcon={<UncheckedCircle />} />}
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


ExportInfo.propTypes = {

}


export default reduxForm({
    form: 'exportInfo',
    initialValues: {

    }
})(ExportInfo)
