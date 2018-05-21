import React, { PropTypes } from 'react';
import AppBar from 'material-ui/AppBar';
import BreadcrumbStepper from './BreadcrumbStepper';

export class CreateExport extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const pageTitle = "Create DataPack";
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
        };

        return (
            <div>
                <AppBar
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{marginTop: '2px'}}
                    iconElementLeft={<p style={{display: 'none'}}/>}
                />
                <BreadcrumbStepper
                    router={this.props.router}
                    routes={this.props.routes}
                />
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

CreateExport.propTypes = {
    router: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
};

export default CreateExport;
