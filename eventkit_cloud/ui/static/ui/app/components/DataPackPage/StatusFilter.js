import React, {PropTypes, Component} from 'react'
import Checkbox from 'material-ui/Checkbox';
import AlertError from 'material-ui/svg-icons/alert/error';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';

export class StatusFilter extends Component {
    constructor(props) {
        super(props);
        this.onCheck
    }

    render () {
        const styles = {
            drawerSection: {
                width: '100%', 
                paddingLeft: '10px', 
                paddingRight: '10px', 
                lineHeight: '36px'
            },
            check: {
                float: 'right', 
                marginLeft: '20px', 
                color: '#bcdfbb', 
                marginBottom: '2px'
            },
            sync: {
                float: 'right', 
                marginLeft: '20px', 
                fill: '#f4D225', 
                height: '26px', 
                marginBottom: '2px'
            },
            error: {
                float: 'right', 
                marginLeft: '20px', 
                fill: '#ce4427', 
                height: '21px', 
                marginBottom: '4px', 
                marginTop: '4px', 
                opacity: '0.6'
            }
        }
        return (
            <div style={styles.drawerSection}>
                <p className={'qa-StatusFilter-p'} style={{width: '100%', margin: '0px'}}><strong>Export Status</strong></p>
                <div style={{width: '180px', height: '87px'}}>
                    <Checkbox
                        className={'qa-StatusFilter-Checkbox-complete'}
                        label={'Complete'}
                        style={{width: '100px', float: 'left'}}
                        iconStyle={{fill: 'grey', marginRight: '5px'}}
                        labelStyle={{color: 'grey'}}
                        onCheck={(e, v)=> {this.props.onChange({completed: v})}}
                        checked={this.props.completed}
                    />
                    <NavigationCheck className={'qa-StatusFilter-NavigationCheck'} style={styles.check}/>
                    
                    <Checkbox
                        className={'qa-StatusFilter-Checkbox-running'}
                        label={'Running'}
                        style={{width: '100px', float: 'left'}}
                        iconStyle={{fill: 'grey', marginRight: '5px'}}
                        labelStyle={{color: 'grey'}}
                        onCheck={(e, v)=> {this.props.onChange({submitted: v})}}
                        checked={this.props.submitted}
                    />
                    <NotificationSync className={'qa-StatusFilter-NotificationSync'}style={styles.sync}/>

                    <Checkbox
                        className={'qa-StatusFilter-Checkbox-error'}
                        label={'Error'}
                        style={{width: '100px', float: 'left'}}
                        iconStyle={{fill: 'grey', marginRight: '5px'}}
                        labelStyle={{color: 'grey'}}
                        onCheck={(e, v)=> {this.props.onChange({incomplete: v})}}
                        checked={this.props.incomplete}
                    />
                    <AlertError className={'qa-StatusFilter-AlertError'}style={styles.error}/>
                </div>
            </div>
        )
    }
}

StatusFilter.propTypes = {
   onChange: React.PropTypes.func.isRequired,
   completed: React.PropTypes.bool.isRequired,
   incomplete: React.PropTypes.bool.isRequired,
   submitted: React.PropTypes.bool.isRequired
}

export default StatusFilter;

