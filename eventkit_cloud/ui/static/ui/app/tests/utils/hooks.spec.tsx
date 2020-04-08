import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { mount } from 'enzyme';
import { useAsyncRequest } from '../../utils/hooks';


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

    if (!status) {
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

//
// it('should render correctly based on status', async () => {
//     const mock = new MockAdapter(axios, { delayResponse: 1 });
//     mock.onGet(apiUrl).reply(500);
//     act(() => {
//         render(<ApiHookTester />, container);
//     });
//     expect(container.querySelector('div').textContent).toContain('Request not fired.');
//     const button = container.querySelector('button');
//     expect(button.textContent).toBe('Request not fired.');
//
//     act(() => {
//         button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
//     });
//     expect(container.querySelector('div').textContent).toContain('fetching');
// });


it('should render correctly based on status', async () => {
    const mock = new MockAdapter(axios, { delayResponse: 1 });
    mock.onGet(apiUrl).reply(500);

    const wrapper = mount(<ApiHookTester />);
    expect(wrapper.find('div').html()).toContain('Request not fired.');

    const getButton = wrapper.find('button');
    getButton.simulate('click');
    return new Promise(resolve => setImmediate(resolve)).then(() => {
        expect(wrapper.find('div').html()).toContain('fetching');
    });
});
