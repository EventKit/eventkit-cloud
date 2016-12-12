import * as React from 'react'
import {
    CLASSIFICATION_BANNER_BACKGROUND,
    CLASSIFICATION_BANNER_FOREGROUND,
    CLASSIFICATION_BANNER_TEXT,
} from '../config'
import styles from './ClassificationBanner.css';


export const ClassificationBanner = () => (
    <div className={styles.classificationbanner}>
        {'UNCLASSIFIED'}
    </div>
)