import React, {Component} from 'react';
import Checkbox from 'material-ui/Checkbox';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import ToggleCheckBox from 'material-ui/svg-icons/toggle/check-box';
import ToggleCheckBoxOutlineBlank from 'material-ui/svg-icons/toggle/check-box-outline-blank';

export class UserLicense extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        const styles = {
            card: {boxShadow: 'none', marginBottom: '10px'},
            checkbox: {width: '24px', display: 'inline-block', verticalAlign: 'middle', marginRight: '10px'},
            cardText: {margin: '10xp, 0px', border: '2px solid #dedede'}
        }

        return (
            <Card 
                initiallyExpanded={true} 
                style={styles.card}
            >
                <CardHeader
                    style={{backgroundColor: 'whitesmoke'}}
                    title={
                        <div>
                            <Checkbox 
                                style={styles.checkbox}
                                checked={this.props.checked}
                                onCheck={(e,v) => {this.props.onCheck(this.props.license.slug, v)}}
                                checkedIcon={<ToggleCheckBox style={{fill: '4498c0'}}/>}
                                uncheckedIcon={<ToggleCheckBoxOutlineBlank style={{fill: 'grey'}}/>}
                            />
                            <span style={{lineHeight: '24px'}}>
                                {'I agree to the '}<strong>{this.props.license.name}</strong>
                            </span>
                        </div>
                    }
                    actAsExpander={false}
                    showExpandableButton={true}
                />
                <CardText expandable={true} style={styles.cardText}>
                    {this.props.license.text}
                </CardText>
            </Card>
        );
    };
};

UserLicense.PropTypes = {
    license: React.PropTypes.object.isRequired,
    checked: React.PropTypes.bool.isRequired,
    onCheck: React.PropTypes.func.isRequired,
};

export default UserLicense;
