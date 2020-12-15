import * as React from 'react';
import {render} from "@testing-library/react";
import {
    StepValidator,
    hasDisallowedSelection,
    hasRequiredFields
} from "../../components/CreateDataPack/ExportValidation";
import {useJobValidationContext} from "../../components/CreateDataPack/context/JobValidation";

jest.mock('../../components/CreateDataPack/context/JobValidation', () => {
    return {
        useJobValidationContext: jest.fn(),
    };
});


describe('Step Validator', () => {

    const getExportInfo = () => {
        return {
            exportName: '',
            datapackDescription: '',
            projectName: '',
            providers: [{slug: 'osm', max_selection: 100,}],
            providerInfo: {
                'osm': {
                    availability: {
                        status: 'STAT'
                    },
                }
            },
            exportOptions: {
                'osm': {
                    minZoom: 0,
                    maxZoom: 2,
                }
            },
            projections: [],
            visibility: 'PRIVATE',
        };
    }

    const getExportInfoFilledOut = () => {
        return {
            ...getExportInfo(),
            exportOptions: {
                'osm': {
                    minZoom: 0,
                    maxZoom: 2,
                    formats: ['gpkg'],
                }
            },
            exportName: 'name',
            datapackDescription: 'desc',
            projectName: 'pname',
            projections: [4326],
        };
    }

    const getControllers = () => {
        return {
            setNextDisabled: jest.fn(),
            setNextEnabled: jest.fn(),
            walkthroughClicked: false,
            nextEnabled: false,
        };
    }


    const getJobValidationInfo = () => {
        return {
            dataSizeInfo: {
                haveAvailableEstimates: ['osm'],
                providerEstimates: {
                    osm: {
                        time: {
                            value: 60,
                            units: 'seconds',
                        },
                        size: {
                            value: 10,
                            units: 'MB',
                        }
                    }
                },
                exceedingSize: [],
                noMaxDataSize: [],
            },
            aoiHasArea: true,
            aoiArea: 50,
            estimatesAreLoading: false,
        };
    }

    const setup = (overrides = {} as any,
                   jobValidation = {}) => {
        (useJobValidationContext as any).mockImplementation(() => {
            return {...jobValidation}
        });
        const rendered = render(<StepValidator {...overrides} />);

        function _rerender(props: any) {
            return rendered.rerender(<StepValidator {...props}/>);
        }

        return {
            ...rendered,
            rerender: _rerender,
        }
    };

    it('should setDisabled by default', function () {
        const props = {
            ...getControllers(),
            nextEnabled: true,
            exportInfo: getExportInfo(),
        };
        setup(props, getJobValidationInfo());
        expect(props.setNextDisabled).toHaveBeenCalledTimes(2);
        expect(props.setNextEnabled).not.toHaveBeenCalled();
    });

    it('should setEnabled', function () {
        const props = {
            ...getControllers(),
            exportInfo: getExportInfoFilledOut(),
        };
        setup(props, getJobValidationInfo());
        expect(props.setNextEnabled).toHaveBeenCalled();
        // Disable is always called once on mount so we can't check NOT been called
        expect(props.setNextDisabled).toHaveBeenCalledTimes(1);
    });

    it('should setDisabled when the aoiArea is too large', function () {
        const props = {
            ...getControllers(),
            nextEnabled: true,
            exportInfo: getExportInfo(),
        };
        setup(props,
            {
                ...getJobValidationInfo(),
                aoiArea: 1000,
            }
        );
        expect(props.setNextDisabled).toHaveBeenCalledTimes(2);
        expect(props.setNextEnabled).not.toHaveBeenCalled();
    });
});
