import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { RadioButton } from 'material-ui/RadioButton'
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
                <div className={styles.heading}>Enter General Information</div>
                <form>
                    <div>
                        <Field name="datapackName"
                               className={styles.textField}
                               component={TextField}
                               floatingLabelText="Name"
                               hintText="Name"
                               ref="name" withRef/>
                    </div>
                    <div>
                        <Field
                            name="description"
                            component={TextField}
                            hintText="Description"
                            floatingLabelText="Description"
                            multiLine={true}
                            rows={2}/>
                    </div>
                    <div>
                        <Field
                            name="projectName"
                            component={TextField}
                            hintText="Project Name"
                            floatingLabelText="Project Name"/>
                    </div>
                    <div>
                        <RadioButton value="public" label="Make Public"/>
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
