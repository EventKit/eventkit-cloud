import React, {Component} from 'react';
import QuickTourSection from './QuickTourSection';

export class QuickTour extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        return (
            <div style={{...this.props.containerStyle}}>
                <h4><strong>{this.props.header}</strong></h4>
                {this.props.tourSections.map((section, ix) => {
                    return (
                        <QuickTourSection 
                            key={ix}
                            steps={section.steps}
                            sectionTitle={section.sectionTitle}
                        />
                    )
                })}
            </div>
        )
    };
};

QuickTour.propTypes = {
    header: React.PropTypes.string.isRequired,
    tourSections: React.PropTypes.array.isRequired,
    containerStyle: React.PropTypes.object,
}

export default QuickTour;
