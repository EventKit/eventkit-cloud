import React, {Component} from 'react';

export class ThreeStepInfo extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        const styles = {
            threeStepCaption: {
                backgroundColor: '#4598bf', 
                padding: '5px', 
                color: '#fff', 
                minHeight: '50px', 
                width: '95%',
            }
        };

        if(this.props.steps.length != 3) {
            return null;
        }

        return ( 
            <table style={{...this.props.tableStyle, borderCollapse: 'collapse', fontSize: window.innerWidth > 991 ? '16px': '14px'}}>
                <tbody>
                    <tr>
                        <td style={{verticalAlign: 'top'}}>
                            <img 
                                src={this.props.steps[0].img}
                                style={{display: 'block', width: '95%', marginRight: '5%'}}
                            />
                            <div style={{...styles.threeStepCaption, marginRight: '5%'}}>{this.props.steps[0].caption}</div>
                        </td>
                        <td style={{verticalAlign: 'top', margin: '0px 5px'}}>
                            <img 
                                src={this.props.steps[1].img}
                                style={{display: 'block', width: '95%', margin: 'auto'}}
                            />
                            <div style={{...styles.threeStepCaption, margin: 'auto'}}>{this.props.steps[1].caption}</div>
                        </td>
                        <td style={{verticalAlign: 'top'}}>
                            <img 
                                src={this.props.steps[2].img}
                                style={{display: 'block', width: '95%', marginLeft: '5%'}}
                            />
                            <div style={{...styles.threeStepCaption, marginLeft: '5%'}}>{this.props.steps[2].caption}</div>
                        </td>
                    </tr>
                </tbody>
            </table>             
        )
    };
};

ThreeStepInfo.propTypes = {
    steps: React.PropTypes.arrayOf(React.PropTypes.shape({
        img: React.PropTypes.obj,
        caption: React.PropTypes.string,
    })).isRequired,
    tableStyle: React.PropTypes.object,
}

export default ThreeStepInfo;
