import React from 'react';
import pure from 'recompose/pure';
import SvgIcon from 'material-ui/SvgIcon';

const icon = props => (
    <SvgIcon {...props}>
        <path d="M20.4,19.6c-0.1,0-0.1-0.1-0.2-0.1l-0.3-7.4c0.6-0.3,1-1,1-1.8c0-1.1-0.9-1.9-2-1.9c-0.2,0-0.3,0-0.4,0.1L13,3.4
        c0.1-0.2,0.1-0.5,0.1-0.7c0-1.1-0.9-1.9-2-1.9c-1.1,0-1.9,0.9-1.9,2c0,0.2,0,0.3,0.1,0.4L3.8,9C3.7,9,3.5,9,3.4,9
        c-1.1,0-1.9,0.9-1.9,2c0,1.1,0.9,1.9,2,1.9c0.4,0,0.7-0.1,1-0.3l12.6,8.8c0.1,0.4,0.3,0.7,0.6,1c0.8,0.7,2,0.7,2.8-0.1
        S21.2,20.3,20.4,19.6z M5.4,10.8c0-0.1,0-0.3-0.1-0.4l5.4-5.7c0.2,0,0.3,0.1,0.5,0.1c0.1,0,0.1,0,0.2,0l5.7,5.3
        c0,0.2-0.1,0.3-0.1,0.5c0,0.7,0.4,1.2,0.9,1.6l0.3,7.2c-0.1,0.1-0.3,0.1-0.4,0.2L5.4,10.8z"
        />
    </SvgIcon>
);

const IrregularPolygon = pure(icon);
IrregularPolygon.displayName = 'IrregularPolygon';
IrregularPolygon.muiName = 'SvgIcon';

export default IrregularPolygon;
