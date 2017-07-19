import React, {PropTypes, Component} from 'react'
import '../tap_events'
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';

export class TaskError extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            taskErrorDialogOpen: false,
        }
    }

    handleTaskErrorOpen() {
        this.setState({taskErrorDialogOpen: true});
    };

    handleTaskErrorClose() {
        this.setState({taskErrorDialogOpen: false});
    };


    render() {
        //TODO: TO test, comment out props call and uncomment out hard coded fake task with errors
        //AND In ProviderRow.js, within the getTastStatus function, uncomment out the hard coded provider status.
        let task = this.props.task;

        //fake an error
        // let task ={
        //     uid: "1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
        //     url: "http://cloud.eventkit.dev/api/tasks/1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
        //     name: "OSM Data (.gpkg)",
        //     status: "CANCELED",
        //     progress: 0,
        //     estimated_finish: null,
        //     started_at: null,
        //     finished_at: null,
        //     duration: null,
        //     result: null,
        //     errors: [
        //         {
        //             exception: "OpenStreetMap Data (Themes) was canceled by admin."
        //         }
        //     ],
        //     display: true
        // }

        const errors = task.errors;
        let error;
        if(errors.length != 0) {
            error = errors.filter((error) => {
                return error.exception != null;
            });
        }

        const taskErrorActions = [
            <RaisedButton
                style={{margin: '10px'}}
                labelStyle={{color: 'whitesmoke', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: '#4598bf'}}
                disableTouchRipple={true}
                label="Close"
                primary={false}
                onTouchTap={this.handleTaskErrorClose.bind(this)}
            />,
        ];

        return (
            <span><a onClick={() => {this.handleTaskErrorOpen()}} style={{
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#ce4427',
                cursor: 'pointer',
            }}>ERROR</a>
            <Dialog
        contentStyle={{width:'40%'}}
        actions={taskErrorActions}
        modal={false}
        open={this.state.taskErrorDialogOpen}
        onRequestClose={this.handleTaskErrorClose.bind(this)}
    >
                <div><strong>There was an error with {task.name} </strong><div style={{marginTop:'25px'}}><NavigationArrowForward style={{marginRight: '10px', display:'inlineBlock', fill:'#ce4427', verticalAlign: 'bottom'}}/>{error!= null ? error[0].exception : ''}</div></div>
    </Dialog></span>

        )
    }
}

TaskError.propTypes = {
    task: PropTypes.object.isRequired,
}

export default TaskError;

