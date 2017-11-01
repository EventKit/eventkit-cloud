import React, {PropTypes, Component} from 'react'
import Warning from 'material-ui/svg-icons/alert/warning'
import CustomScrollbar from '../CustomScrollbar';
import BaseDialog from '../BaseDialog';

export class TaskError extends React.Component {
    constructor(props) {
        super(props)
        this.handleTaskErrorClose = this.handleTaskErrorClose.bind(this);
        this.handleTaskErrorOpen = this.handleTaskErrorOpen.bind(this);
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
        const styles = {
            errorText: {
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#ce4427',
                cursor: 'pointer',
            }
        }
        let task = this.props.task;
        const errors = task.errors;

        let error;
        if(errors.length != 0) {
            error = errors.filter((error) => {
                return error.exception != null;
            });
        }

        return (
            <span  className={'qa-TaskError-errorLink'}>
                <a 
                    onClick={() => {this.handleTaskErrorOpen()}} 
                    style={styles.errorText}
                >
                    ERROR
                </a>

                <BaseDialog
                    className={'qa-TaskError-BaseDialog'}
                    show={this.state.taskErrorDialogOpen}
                    title={<strong id='error-title'>{task.name} has <strong style={{color: '#ce4427'}}>1 error. </strong></strong>}
                    onClose={this.handleTaskErrorClose}
                >
                    <div className={'qa-TaskError-div-errorData'} id='error-data'>
                        <Warning className={'qa-TaskError-Warning'} style={{marginRight: '10px', display:'inlineBlock', fill:'#e8ac90', verticalAlign: 'bottom'}}/>
                        {error!= null ? error[0].exception : ''}
                    </div>
                </BaseDialog>

            </span>
        )
    }
}

TaskError.propTypes = {
    task: PropTypes.object.isRequired,
}

export default TaskError;

