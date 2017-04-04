import React, {PropTypes, Component} from 'react'
import Checkbox from 'material-ui/Checkbox';
import ContentCreate from 'material-ui/svg-icons/content/create';
import NotificationSync from 'material-ui/svg-icons/notification/sync';

export class StatusFilter extends Component {
    constructor(props) {
        super(props);
        this.onCheck
    }

    render () {
        const styles = {
            drawerSection: {width: '100%', paddingLeft: '10px', paddingRight: '10px', lineHeight: '36px'},
        }
        return (
            <div style={styles.drawerSection}>
                <p style={{width: '100%', margin: '0px'}}><strong>Export Status</strong></p>
                <div style={{width: '180px', height: '87px'}}>
                    <Checkbox
                        label={'Complete'}
                        style={{width: '100px', float: 'left'}}
                        iconStyle={{fill: 'grey', marginRight: '5px'}}
                        labelStyle={{color: 'grey'}}
                        onCheck={(e, v)=> {this.props.onChange({completed: v})}}
                    />
                    <p style={{width: '60px', height: '29px', margin: '0px'}}/>
                    
                    <Checkbox
                        label={'Incomplete'}
                        style={{width: '100px', float: 'left'}}
                        iconStyle={{fill: 'grey', marginRight: '5px'}}
                        labelStyle={{color: 'grey'}}
                        onCheck={(e, v)=> {this.props.onChange({incomplete: v})}}
                        checked={this.props.incomplete}
                    />
                    <ContentCreate style={{float: 'right', marginLeft: '20px', fill: '#f4D225', height: '26px', marginBottom: '2px'}}/>
                    
                    <Checkbox
                        label={'Running'}
                        style={{width: '100px', float: 'left'}}
                        iconStyle={{fill: 'grey', marginRight: '5px'}}
                        labelStyle={{color: 'grey'}}
                        onCheck={(e, v)=> {this.props.onChange({running: v})}}
                        checked={this.props.running}
                    />
                    <NotificationSync style={{float: 'right', marginLeft: '20px', fill: '#f4D225', height: '26px', marginBottom: '2px'}}/>
                </div>
            </div>
        )
    }
}

StatusFilter.propTypes = {
   onChange: React.PropTypes.func.isRequired,
   completed: React.PropTypes.bool.isRequired,
   incomplete: React.PropTypes.bool.isRequired,
   running: React.PropTypes.bool.isRequired
}

export default StatusFilter;

