import * as React from 'react';

export interface Props {
    title: any;
    body: any;
    titleStyle?: object;
    bodyStyle?: object;
}

export class InfoParagraph extends React.Component<Props, {}> {
    render() {
        const styles = {
            title: {
                textAlign: 'center' as 'center',
                ...this.props.titleStyle,
            },
            body: {
                marginBottom: '30px',
                ...this.props.bodyStyle,
            },
        };

        if (!this.props.title || !this.props.body) {
            return null;
        }

        return (
            <div className="qa-InfoParagraph-title">
                <h3 style={styles.title}><strong>{this.props.title}</strong></h3>
                <div id={this.props.title} style={styles.body} className="qa-InfoParagraph-body">
                    {this.props.body}
                </div>
            </div>
        );
    }
}

export default InfoParagraph;
