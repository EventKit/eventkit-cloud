import { unmountComponentAtNode } from 'react-dom';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { mount } from 'enzyme';
import { useAsyncRequest, ApiStatuses } from '../../utils/hooks/api';

let container = null;
beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement('div');
    document.body.appendChild(container);
});

afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
});

const apiUrl = '/api/fake_url';

function ApiHookTester() {
    const [{ status, response }, requestCaller] = useAsyncRequest();
    const makeRequest = () => requestCaller({
        url: apiUrl,
        method: 'get',
        data: {},
    });

    if (status === ApiStatuses.hookActions.NOT_FIRED) {
        return (
            <div>
                {/* eslint-disable-next-line react/button-has-type */}
                <button onClick={makeRequest}>Request not fired.</button>
            </div>
        );
    }
    if (status === 'success') {
        return (
            <div>
                <div>{status}</div>
                <div>{response.data}</div>
            </div>
        );
    }
    return (<div>{status}</div>);
}

it('should render correctly based on status', () => {
    const mock = new MockAdapter(axios, { delayResponse: 1 });
    mock.onGet(apiUrl).reply(500);

    const wrapper = mount(<ApiHookTester />);
    expect(wrapper.find('div').html()).toContain('Request not fired.');

    const getButton = wrapper.find('button');
    getButton.simulate('click');
    expect(wrapper.find('div').html()).toContain('fetching');
});
