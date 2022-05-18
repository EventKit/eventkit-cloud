import {render} from "@testing-library/react";
import {Step1Validator} from "../../components/CreateDataPack/ExportValidation";
import {useJobValidationContext} from "../../components/CreateDataPack/context/JobValidation";

jest.mock('../../components/CreateDataPack/context/JobValidation', () => {
    return {
        useJobValidationContext: jest.fn(),
    };
});

const getControllers = () => {
    return {
        setNextDisabled: jest.fn(),
        setNextEnabled: jest.fn(),
        walkthroughClicked: false,
        nextEnabled: false,
    };
};

describe('Step Validator', () => {

    const setup = (overrides = {} as any,
                   jobValidation = {}) => {
        (useJobValidationContext as any).mockImplementation(() => {
            return {...jobValidation}
        });
        const rendered = render(<Step1Validator {...overrides} />);
        function _rerender(props: any) {
            return rendered.rerender(<Step1Validator {...props}/>);
        }
        return {
            ...rendered,
            rerender: _rerender,
        }
    };

    it('should setDisabled when the aoiArea is too large', function () {
        const props = {
            ...getControllers(),
        };
        setup({...props}, {
            aoiHasArea: false,
        });
        expect(props.setNextDisabled).toHaveBeenCalledTimes(1);
        expect(props.setNextEnabled).not.toHaveBeenCalled();
        setup({...props}, {
            aoiHasArea: true,
        });
        expect(props.setNextEnabled).toHaveBeenCalled();
    });
});
