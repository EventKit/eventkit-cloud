import * as React from 'react'
import {
    CLASSIFICATION_BANNER_BACKGROUND,
    CLASSIFICATION_BANNER_FOREGROUND,
    CLASSIFICATION_BANNER_TEXT,
} from '../config'
//import styles from './ClassificationBanner.css'


export const ClassificationBanner = () => (
    <div

        style={{backgroundColor: 'green',
            color: 'white', 'zIndex': 9999, position: 'absolute', left: 0, right: 0, 'lineHeight':'25px', 'backgroundColor': 'green', 'fontSize': '14px', 'textAlign': 'center'
  }}>
        {'UNCLASSIFIED'}
    </div>
)