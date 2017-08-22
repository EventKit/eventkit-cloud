import React, {PropTypes, Component} from 'react'
import '../tap_events'
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import Warning from 'material-ui/svg-icons/alert/warning'
import CustomScrollbar from '../CustomScrollbar';

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
        //             exception: "OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin. OpenStreetMap Data (Themes) was canceled by admin."
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
                contentStyle={{width:'70%', minWidth:'300px', maxWidth:'610px'}}
        actions={taskErrorActions}
        modal={false}
        open={this.state.taskErrorDialogOpen}
        onRequestClose={this.handleTaskErrorClose.bind(this)}
    >
                <div><div style={{marginBottom:'15px'}}><strong>{task.name} has <strong style={{color:'#ce4427'}}>1 error(s).</strong> </strong></div>
                    <CustomScrollbar style={{height: '200px', overflowX: 'hidden', width:'100%'}}>
                    <div style={{marginTop:'25px', width:'95%'}}><Warning style={{marginRight: '10px', display:'inlineBlock', fill:'#e8ac90', verticalAlign: 'bottom'}}/>{error!= null ? error[0].exception : ''}</div>
                    </CustomScrollbar></div>
    </Dialog></span>

        )
    }
}

TaskError.propTypes = {
    task: PropTypes.object.isRequired,
}

export default TaskError;

