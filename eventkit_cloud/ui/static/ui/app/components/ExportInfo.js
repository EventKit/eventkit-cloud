import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { RadioButton } from 'material-ui/RadioButton'
import { List, ListItem} from 'material-ui/List'
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
            <div className={styles.root}>
                <form>
                <div className={styles.heading}>Enter General Information</div>
                    <div>
                        <Field name="datapackName"
                               className={styles.textField}
                               component={TextField}
                               hintText="Name"
                               ref="datapackName" withRef/>
                    </div>
                    <div>
                        <Field
                            name="description"
                            component={TextField}
                            hintText="Description"
                            multiLine={true}
                            rows={2}/>
                    </div>
                    <div>
                        <Field
                            name="projectName"
                            component={TextField}
                            hintText="Project Name"/>
                    </div>
                    <div className={styles.sectionBottom}>
                        <Field name="makePublic" component={Checkbox} label="Make Public"/>
                    </div>

                    <div className={styles.heading}>Select Layers</div>
                    <div className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                    <div className={styles.sectionBottom}>
                        <List>

                            <ListItem
                            primaryText="OpenStreetMap Data"
                            leftIcon={ <Field name="osmData" component={Checkbox} />}
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
                                leftIcon={<Field name="osmTiles" component={Checkbox} />}
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
                                leftIcon={ <Field name="digitalGlobe" component={Checkbox} />}
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

                    <div className={styles.heading}>Select Export File Formats</div>
                    <div className={styles.subHeading}>You must choose <strong>at least one</strong></div>
                    <div style={{marginTop: '15px'}} className={styles.subHeading}><strong>Recommended</strong></div>
                    <div className={styles.sectionBottom}>
                        <div>
                            <Field name="geopackage" component={Checkbox} label="GeoPackage (gpkg)"/>
                        </div>
                        <div>
                            <Field name="esriShape" component={Checkbox} label="Esri Shapefile (.shp)"/>
                        </div>
                        <List>
                        <ListItem
                            value={1}
                            primaryText="Other Format Options"
                            nestedItems={[
                                <ListItem
                                key={1}
                                primaryText="GeoTiff (.tiff)"
                                leftAvatar={<Field name="geoTiff" component={Checkbox}/>}
                              />,
                              <ListItem
                                key={2}
                                primaryText="Google Earth (.kmz)"
                                leftAvatar={<Field name="googleEarth" component={Checkbox}/>}
                              />,
                              <ListItem
                                key={3}
                                primaryText="SQLite (.sqlite)"
                                leftAvatar={<Field name="sqlite" component={Checkbox}/>}
                              />,
                              <ListItem
                                key={4}
                                primaryText="OSMAnd (.obf)"
                                leftAvatar={<Field name="osmand" component={Checkbox}/>}
                              />
                            ]}
                        />
                            </List>

                    </div>
                </form>
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
