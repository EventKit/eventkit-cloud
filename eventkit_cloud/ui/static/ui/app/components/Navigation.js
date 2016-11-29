import React, {PropTypes} from 'react';
import { Link, IndexLink } from 'react-router';
import styles from './Navigation.css'


export const Navigation = () => (
    <nav className={styles.root}>
        <IndexLink className={styles.link} to="/"><i className="fa fa-book" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Home</IndexLink>
        <br/>
        <Link className={styles.link} to="/exports" ><i className="fa fa-plus-square" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Exports</Link>
        <br/>
        <Link className={styles.link} to="/about"><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;About</Link>
    </nav>
)
