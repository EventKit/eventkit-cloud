import React from 'react';
import CustomScrollbar from '../CustomScrollbar';

function BrowserWarning() {
    const styles = {
        wholeDiv: {
            width: '100%',
            height: window.innerHeight - 95,
            backgroundColor: '#111823',
        },
        text: {
            color: '#fff',
            margin: '30px',
            textAlign: 'center',
        },
    };

    return (
        <div style={styles.wholeDiv} className="qa-BrowserWarning">
            <CustomScrollbar style={{ height: window.innerHeight - 95 }}>
                <div style={styles.text} className="qa-BrowserWarning-text">
                    The browser you are using is not supported by EventKit.<br />
                     EventKit works on most modern browsers,
                     but IE versions prior to 10 will not work.<br />
                     Please use a different browser or version to access EventKit
                     (we recommend Chrome).
                </div>
            </CustomScrollbar>
        </div>
    );
}

export default BrowserWarning;
