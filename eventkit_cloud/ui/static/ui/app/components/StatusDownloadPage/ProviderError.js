import React, {PropTypes, Component} from 'react'
import '../tap_events'
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning'

export class ProviderError extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            providerErrorDialogOpen: false,
        }
    }

    handleProviderErrorOpen() {
        this.setState({providerErrorDialogOpen: true});
    };

    handleProviderErrorClose() {
        this.setState({providerErrorDialogOpen: false});
    };


    render() {
        //TODO: To test, comment out props call and uncomment out hard coded fake error.
        //AND In ProviderRow.js, within the getProviderStatus function, uncomment out the hard coded provider status.
        //let provider = this.props.provider;

        //fake an error
        let provider ={
            uid: "55e3d844-2139-46ed-a029-9253d52ffb1f",
            url: "http://cloud.eventkit.dev/api/provider_tasks/55e3d844-2139-46ed-a029-9253d52ffb1f",
            name: "OpenStreetMap Data (Themes)",
            tasks: [
            {
                uid: "1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
                url: "http://cloud.eventkit.dev/api/tasks/1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
                name: "OSM Data (.gpkg)",
                status: "CANCELED",
                progress: 0,
                estimated_finish: null,
                started_at: null,
                finished_at: null,
                duration: null,
                result: null,
                errors: [
                    {
                        exception: "OpenStreetMap Data (Themes) was canceled by admin."
                    }
                ],
                display: true
            },
            {
                uid: "cfb971d4-432d-48ba-ba36-cce314228fba",
                url: "http://cloud.eventkit.dev/api/tasks/cfb971d4-432d-48ba-ba36-cce314228fba",
                name: "QGIS Project file (.qgs)",
                status: "CANCELED",
                progress: 0,
                estimated_finish: null,
                started_at: null,
                finished_at: null,
                duration: null,
                result: null,
                errors: [
                    {
                        exception: "OpenStreetMap Data (Themes) was canceled by admin."
                    }
                ],
                display: true
            },
            {
                uid: "aff6ccb9-6bc3-4080-aeb9-d599780949d5",
                url: "http://cloud.eventkit.dev/api/tasks/aff6ccb9-6bc3-4080-aeb9-d599780949d5",
                name: "Area of Interest (.geojson)",
                status: "CANCELED",
                progress: 0,
                estimated_finish: null,
                started_at: null,
                finished_at: "2017-07-17T16:33:47.519125Z",
                duration: null,
                result: null,
                errors: [
                    {
                        exception: "OpenStreetMap Data (Themes) was canceled by admin."
                    }
                ],
                display: false
            },
            {
                uid: "47d8f8a6-9611-4fc7-8f1b-210d3ff87198",
                url: "http://cloud.eventkit.dev/api/tasks/47d8f8a6-9611-4fc7-8f1b-210d3ff87198",
                name: "Area of Interest (.gpkg)",
                status: "CANCELED",
                progress: 0,
                estimated_finish: null,
                started_at: null,
                finished_at: null,
                duration: null,
                result: null,
                errors: [
                    {
                        exception: "OpenStreetMap Data (Themes) was canceled by admin."
                    }
                ],
                display: false
            }
        ],
            status: "CANCELED",
            display: true
        };

        //const errors = task.errors;
        //let errors = [];

        //fake array to test for more than 3 errors.
        let errors = ['1','2','3','4'];

        provider.tasks.forEach((column) => {
            if(column.display == true) {
                if(column.errors.length != 0) {
                    let error = column.errors[0].exception;
                    errors.push(error);
                }
            }
        });

        let errorData;
        if(errors.length > 3){
            errorData =  <div>
                <strong>{provider.name} has {errors.length} error(s).</strong>
                    <div style={{marginTop:'15px'}}>The first three errors:
                    </div>
                    {errors.slice(0,3).map((error, index) => (
                        <div style={{marginTop:'15px'}} key={index} >
                            <Warning style={{marginRight: '10px', display:'inlineBlock', fill:'#ce4427', verticalAlign: 'bottom'}}/>
                            {error}
                            <Divider style={{marginTop: '5px'}}/>
                        </div>
                    ))}
                    <div style={{marginTop:'15px'}}><strong>You may want to restart processing the files or contact an administrator.
                    </strong></div>

            </div>
        }
        else {
            errorData = <div> <strong>{provider.name} has {errors.length} error(s) </strong>
                {errors.map((error, index) => (
                    <div style={{marginTop:'25px'}} key={index} >
                        <Warning style={{marginRight: '10px', display:'inlineBlock', fill:'#ce4427', verticalAlign: 'bottom'}}/>
                        {error}
                        <Divider style={{marginTop: '15px'}}/>
                    </div>
                ))}

            </div>
        }


        const providerErrorActions = [
            <RaisedButton
                style={{margin: '10px'}}
                labelStyle={{color: 'whitesmoke', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: '#4598bf'}}
                disableTouchRipple={true}
                label="Close"
                primary={false}
                onTouchTap={this.handleProviderErrorClose.bind(this)}
            />,
        ];

        return (
            <span><a onClick={() => {this.handleProviderErrorOpen()}} style={{
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#ce4427',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}>ERROR</a>
            <Warning onClick={() => {this.handleProviderErrorOpen()}} style={{marginLeft:'10px', cursor: 'pointer', display:'inlineBlock', fill:'#ce4427', verticalAlign: 'bottom'}}/>
            <Dialog
                contentStyle={{width:'40%'}}
                actions={providerErrorActions}
                modal={false}
                open={this.state.providerErrorDialogOpen}
                onRequestClose={this.handleProviderErrorClose.bind(this)}
            >
                {errorData}

    </Dialog></span>

        )
    }
}

ProviderError.propTypes = {
    provider: PropTypes.object.isRequired,
}

export default ProviderError;


