import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import AppBar from 'material-ui/AppBar'
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
import primaryStyles from '../styles/constants.css'


class ExportInfo extends React.Component {
    render() {
        const pageTitle = "Create Datapack"
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                marginTop: '25px'
            },
        };

        return (
            <div>


                <AppBar className={primaryStyles.sectionTitle} style={styles.appBar} title={pageTitle}
                        iconElementLeft={<p></p>}
                />

                <div>

                </div>

                <div >

                </div>

            </div>


        )
    }
}


ExportInfo.propTypes = {

}



export default ExportInfo
