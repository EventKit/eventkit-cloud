import React, {Component} from 'react';

export class InfoParagraph extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        if (!this.props.header || !this.props.body) {
            return null;
        }

        return (
            <div>
                <h4 style={this.props.headerStyle}><strong>{this.props.header}</strong></h4>
                <div id={this.props.header} style={this.props.bodyStyle}>
                    {this.props.body}
                </div>
            </div>
        )
    };
};

InfoParagraph.propTypes = {
    header: React.PropTypes.string.isRequired,
    body: React.PropTypes.string.isRequired,
    headerStyle: React.PropTypes.object,
    bodyStyle: React.PropTypes.object,
}

export default InfoParagraph;
