import * as React from "react";

export interface Props {
    className?: string;
    text: any;
}

export const Warning = (props: Props) => {
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
            {props.text}
        </div>
    );
};

export default Warning;
