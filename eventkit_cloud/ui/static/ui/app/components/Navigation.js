import React, {PropTypes} from 'react';
import { Link, IndexLink } from 'react-router';
import styles from '../styles/Navigation.css'


export const Navigation = () => (
    <nav className={styles.root}>
        <ul>
            <li className={styles.home}>
                <IndexLink className={styles.link} activeClassName={styles.active} onlyActiveOnIndex={true} to="/exports"><i className="fa fa-book" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Datapack Library</IndexLink>
            </li>
            <li>
                <Link className={styles.link} activeClassName={styles.active} to="/create" ><i className="fa fa-plus-square" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Create Datapack</Link>
            </li>
            <li>    
                <Link className={styles.link} activeClassName={styles.active} to="/about"><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;About EventKit</Link>
            </li>
            <li>
                <Link className={styles.link} activeClassName={styles.active} to="/account"><i className="fa fa-user" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Account Settings</Link>
            </li>
            <li>
                <Link className={styles.link} activeClassName={styles.active} to="/logout"><i className="fa fa-sign-out" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;Log Out</Link>
            </li>
        </ul>
    </nav>
)
