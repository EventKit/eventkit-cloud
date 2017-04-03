import React, {PropTypes, Component} from 'react'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import ContentCreate from 'material-ui/svg-icons/content/create';
import NotificationSync from 'material-ui/svg-icons/notification/sync';

export class StatusFilter extends Component {
    constructor(props) {
        super(props);
    }

    render () {
        const styles = {
            drawerSection: {width: '100%', paddingLeft: '10px', paddingRight: '10px', lineHeight: '36px'},
        }
        return (
            <div style={styles.drawerSection}>
                <p style={{width: '100%', margin: '0px'}}><strong>Export Status</strong></p>
                <div style={{width: '100px', height: '87px', display: 'inline-block'}}>
                    <RadioButtonGroup
                        name={'status'}
                        onChange={this.props.onChange}
                        valueSelected={this.props.valueSelected}>
                        <RadioButton
                            style={{width: '100px', float: 'left'}}
                            iconStyle={{fill: 'grey', marginRight: '5px'}}
                            labelStyle={{color: 'grey'}}
                            value={'COMPLETED'}
                            label={'Complete'}
                        />
                        <RadioButton
                            style={{width: '100px', float: 'left'}}
                            iconStyle={{fill: 'grey', marginRight: '5px'}}
                            labelStyle={{color: 'grey'}}
                            value={'INCOMPLETE'}
                            label={'Incomplete'}
                        />
                        <RadioButton
                            style={{width: '100px', float: 'left'}}
                            iconStyle={{fill: 'grey', marginRight: '5px'}}
                            labelStyle={{color: 'grey'}}
                            value={'SUBMITTED'}
                            label={'Running'}
                        />
                    </RadioButtonGroup>
                </div>
                <div style={{width: '60px', height: '87px', display: 'inline-block', float: 'right'}}>
                    <p style={{width: '60px', height: '29px', margin: '0px'}}/>
                    <ContentCreate style={{float: 'right', marginLeft: '20px', fill: '#f4D225', height: '26px', marginBottom: '2px'}}/>
                    <NotificationSync style={{float: 'right', marginLeft: '20px', fill: '#f4D225', height: '26px', marginBottom: '2px'}}/>
                </div>
            </div>
        )
    }
}

StatusFilter.propTypes = {
   valueSelected: React.PropTypes.string,
   onChange: React.PropTypes.func.isRequired,
}

export default StatusFilter;
