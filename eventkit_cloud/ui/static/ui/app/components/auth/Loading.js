import React from 'react'
import CircularProgress from 'material-ui/CircularProgress';

export default function Loading() {
  const constainerStyle = {
    backgroundImage: 'url('+require('../../../images/ek_topo_pattern.png')+')', 
    height: window.innerHeight - 95, 
    width: window.innerWidth, 
    display: 'inline-flex'
  };
  return <div  className={'qa-loading-body'}
      style={constainerStyle}
    >
      <CircularProgress 
          style={{margin: 'auto', display: 'block'}} 
          color={'#4598bf'}
          size={50}
      />
    </div>
}
