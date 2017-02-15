import * as React from 'react'
import {
    CLASSIFICATION_BANNER_BACKGROUND,
    CLASSIFICATION_BANNER_FOREGROUND,
    CLASSIFICATION_BANNER_TEXT,
} from '../config'
import styles from './ClassificationBanner.css';


class ClassificationBanner extends React.Component {
    render() {

        return (

    <div className={styles.classificationbanner}>
        {'UNCLASSIFIED'}
    </div>
        )
    }
}
export default ClassificationBanner