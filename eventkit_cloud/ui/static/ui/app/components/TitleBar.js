
import * as React from 'react'
import styles from './TitleBar.css';
import logo from '../../images/logo_white_medium.png'


export const TitleBar = () => (
    <div className={styles.titleBar}>
        <div className={styles.mainMenu}>
            {'MAIN MENU'}
        </div>
        <div className={styles.logo}>
            <img src={logo}/>
        </div>
    </div>
)