import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import { RadioButton } from 'material-ui/RadioButton'

class ExportInfo extends React.Component {
    render() {


        const styles = {

        };

        return (
            <div>
                <RadioButton value="pickup" label="Pickup"/>
                <RadioButton value="delivery" label="Delivery"/>


            </div>


        )
    }
}


ExportInfo.propTypes = {

}



export default ExportInfo
