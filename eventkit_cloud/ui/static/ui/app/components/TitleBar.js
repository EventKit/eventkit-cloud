
import * as React from 'react'
import styles from './TitleBar.css';


export const TitleBar = () => (
    <div className={styles.titleBar}>
        <div className={styles.mainMenu}>
            {'MAIN MENU'}
        </div>
        <div className={styles.logo}>
            {'I AM LOGO'}
        </div>
    </div>
)