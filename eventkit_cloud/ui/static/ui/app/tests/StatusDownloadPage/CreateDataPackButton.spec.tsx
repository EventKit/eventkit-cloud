import * as React from 'react';
import * as sinon from 'sinon';
import {mount} from 'enzyme';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import CreateDataPackButton from "../../components/StatusDownloadPage/CreateDataPackButton";
import {Button, MuiThemeProvider} from "@material-ui/core";
import {Theme} from "@material-ui/core/styles";

jest.mock('../../components/StatusDownloadPage/RunFileContext', () => {
    return {
        useRunContext: () => {
            return {run: {status: 'COMPLETED'}}
        }
    }
});

jest.mock('../../components/Dialog/BaseDialog', () => 'dialog');
jest.mock('../../components/common/CenteredPopup', () => 'centeredPopup');

jest.mock('@material-ui/core/styles', () => ({
    withStyles: styles => component => component,
    withTheme: theme => component => component,
}));

describe('CreateDataPackButton component', () => {
    const defaultProps = () => ({
        fontSize: '12px',
        providerTaskUids: ['thisistotallyauid'],
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let wrapper;
    let instance;
    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<CreateDataPackButton {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should job processing when job is not complete.', () => {
        jest.mock('../../components/StatusDownloadPage/RunFileContext', () => {
            return {
                useRunContext: () => {
                    return {run: {status: 'somethingotherthancompleted'}}
                }
            }
        });
        expect(wrapper.find(Button).html()).toContain('CREATE DATAPACK');
    });

    it('should display create text by default when job is done.', () => {
        expect(wrapper.find(Button).html()).toContain('CREATE DATAPACK');
    });

    it('should disable button after click and render fake button.', () => {
        const getButton = wrapper.find('#CompleteDownload').hostNodes();
        expect(wrapper.find('#qa-CreateDataPackButton-fakeButton')).toHaveLength(0);
        expect(wrapper.find('#CompleteDownload').hostNodes().props().disabled).toBe(false);
        getButton.simulate('click');
        return new Promise(resolve => setImmediate(resolve)).then(() => {
            expect(wrapper.find('#CompleteDownload').hostNodes().props().disabled).toBe(true);
            expect(wrapper.find('#qa-CreateDataPackButton-fakeButton')).toHaveLength(1);
        });
    });
});
