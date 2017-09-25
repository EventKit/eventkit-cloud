import React, {PropTypes, Component} from 'react'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';

export class PermissionsFilter extends Component {
    constructor(props) {
        super(props);
    }

    render () {
        const styles = {
            drawerSection: {
                width: '100%', 
                height: '94px', 
                paddingLeft: '10px', 
                paddingRight: '10px', 
                lineHeight: '36px'
            },
            person: {
                float: 'right', 
                marginLeft: '20px', 
                fill: 'grey', 
                height: '26px', 
                marginBottom: '2px'
            },
            group: {
                float: 'right', 
                marginLeft: '20px', 
                fill: '#bcdfbb', 
                height: '26px',
                marginBottom: '2px'
            }
        }
        return (
            <div style={styles.drawerSection}>
                <p  className={'qa-PermissionsFilter-p'}style={{width: '100%', margin: '0px'}}><strong >Permissions</strong></p>
                <div style={{width: '100px', height: '58px', display: 'inline-block'}}>
                    <RadioButtonGroup
                            className={'qa-PermissionsFilter-RadioButtonGroup'}
                            name={"permissions"} 
                            onChange={this.props.onChange}
                            valueSelected={this.props.valueSelected}>
                        <RadioButton
                            className={'qa-PermissionsFilter-RadioButton-private'}
                            style={{width:'100px', float: 'left'}}
                            iconStyle={{fill: 'grey', marginRight: '5px'}}
                            labelStyle={{color: 'grey'}}
                            value={'False'}
                            label={"Private"}
                        />
                        <RadioButton
                            className={'qa-PermissionsFilter-RadioButton-public'}
                            style={{width:'100px', float: 'left'}}
                            iconStyle={{fill: 'grey', marginRight: '5px'}}
                            labelStyle={{color: 'grey'}}
                            value={"True"}
                            label={"Public"}
                        />
                    </RadioButtonGroup>
                </div>
                <div style={{width: '60px', height: '58px', display: 'inline-block', float: 'right'}}>
                    <SocialPerson className={'qa-PermissionsFilter-SocialPerson'} style={styles.person}/>
                    <SocialGroup className={'qa-PermissionsFilter-SocialGroup'} style={styles.group}/>
                </div>
            </div>
        )
    }
}

PermissionsFilter.propTypes = {
    valueSelected: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
}

export default PermissionsFilter;
