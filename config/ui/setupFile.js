/* eslint-disable import/no-extraneous-dependencies */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import theme from './eventkit_cloud/ui/static/ui/app/styles/eventkit_theme';

global.window.resizeTo = (width, height) => {
    global.window.innerWidth = width || global.window.innerWidth;
    global.window.innerHeight = height || global.window.innerHeight;
    global.window.dispatchEvent(new Event('resize'));
};

global.eventkit_test_props = {
    theme: { ...theme },
    width: 'xl',
};

Enzyme.configure({ adapter: new Adapter() });
