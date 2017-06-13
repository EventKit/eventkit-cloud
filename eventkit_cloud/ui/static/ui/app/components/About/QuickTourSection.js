import React, {Component} from 'react';
import {Card, CardHeader, CardMedia} from 'material-ui/Card';
import ChevronLeft from 'material-ui/svg-icons/navigation/chevron-left';
import ChevronRight from 'material-ui/svg-icons/navigation/chevron-right';

export class QuickTourSection extends Component {

    constructor(props) {
        super(props);
        this.state = {
            step: 0
        }
    };


    render() {
        const styles = {
            numberStyle: {
                border: '2px solid #fff', 
                borderRadius: '50%', 
                width: '20px', 
                height: '20px', 
                textAlign: 'center', 
                fontSize: '10px', 
                display: 'inline-block', 
                marginLeft: '10px', 
                backgroundColor: '#fff', 
                color: '#4598bf'
            },
            nextImgArrow: {
                position: 'absolute', 
                width: '48px', 
                height: '48px', 
                minWidth: 'none', 
                color: '#4598bf', 
                top: 'calc(50% - 24px)'}
        };
        const stepTotal = this.props.steps.length;

        return (
            <div>
                <Card initiallyExpanded={true} style={{backgroundColor: 'whitesmoke'}}>
                    <CardHeader
                        showExpandableButton={true}
                        title={<strong>{this.props.sectionTitle}</strong>}
                    />
                    <CardMedia expandable={true} style={{padding: '0px 10px 10px 10px'}}>
                        <div>
                            <img src={this.props.steps[this.state.step].img} style={{width: '100%'}}/>
                            <ChevronLeft style={{...styles.nextImgArrow, left: '20px'}}/>
                            <ChevronRight style={{...styles.nextImgArrow, right: '20px'}}/>
                        </div>
                        <div style={{width: '100%', backgroundColor: '#4598bf', color: '#fff', padding: '7px 10px'}}>
                            <div style={{display: 'inline-block', width: `calc(100% - ${stepTotal * 30}px)`, lineHeight: '22px'}}>{this.props.steps[this.state.step].caption}</div>
                            <div style={{display: 'inline-block', width: `${stepTotal * 30}px`, verticalAlign: 'top'}}>
                                {this.props.steps.map((item, ix) => {
                                    const style = {
                                        ...styles.numberStyle, 
                                        backgroundColor: this.state.step == ix ? '#fff': 'inherit', 
                                        color: this.state.step == ix ? '#4598bf': 'inherit'
                                    } 
                                    return <div key={ix} style={style}>{ix + 1}</div>
                                })}
                            </div>
                        </div>
                    </CardMedia>
                </Card>
            </div>
        );
    };
};

QuickTourSection.PropTypes = {
    steps: React.PropTypes.arrayOf(React.PropTypes.shape({
        img: React.PropTypes.obj,
        caption: React.PropTypes.string,
    })).isRequired,
    sectionTitle: React.PropTypes.string.isRequired,
}

export default QuickTourSection;
