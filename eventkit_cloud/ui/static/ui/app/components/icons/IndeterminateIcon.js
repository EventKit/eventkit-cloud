import React from 'react';
import pure from 'recompose/pure';
import SvgIcon from 'material-ui/SvgIcon';

let IndeterminateIcon = (props) => (
    <SvgIcon {...props}>
        <path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z" />
        <rect x="9.8" y="9.8" width="4.5" height="4.5"/>
    </SvgIcon>
);

IndeterminateIcon = pure(IndeterminateIcon);
IndeterminateIcon.displayName = 'IndeterminateIcon';
IndeterminateIcon.muiName = 'SvgIcon';

export default IndeterminateIcon;
