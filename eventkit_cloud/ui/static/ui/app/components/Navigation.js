import React, {PropTypes} from 'react';
import { Link, IndexLink } from 'react-router';
import styles from './Navigation.css'


export const Navigation = () => (
    <nav className={styles.root}>
        <IndexLink className={styles.link} to="/"
                   ><strong>Home</strong></IndexLink>
        <br/>
        <Link className={styles.link} to="/exports" >Exports</Link>
        <br/>
        <Link className={styles.link} to="/about">About</Link>
    </nav>
)
