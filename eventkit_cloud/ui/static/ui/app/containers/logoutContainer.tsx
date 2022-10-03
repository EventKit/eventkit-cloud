import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../actions/userActions';

export const Logout = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(logout());
    }, []);


    const styles = {
        wholeDiv: {
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            marginBottom: '0px',
        },
        root: {
            justifyContent: 'space-around',
            display: 'flex',
            flexWrap: 'wrap',
            height: 'calc(100vh - 95px)',
        },
    };

    return (
        <div style={styles.wholeDiv}>
            <div style={styles.root} />
        </div>
    );
};

export default Logout;
