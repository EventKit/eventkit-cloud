import * as React from 'react';

export interface Props {
    className?: string;
    text: any;
}

export class Warning extends React.Component<Props, {}> {
    render() {
        const bodyStyle = {
            backgroundColor: '#f8e6dd',
            width: '100%',
            margin: '5px 0px',
            lineHeight: '25px',
            padding: '16px',
            textAlign: 'center' as 'center',
        };

        return (
            <div className="qa-Warning-text" style={bodyStyle}>
                {this.props.text}
            </div>
        );
    }
}

export default Warning;
