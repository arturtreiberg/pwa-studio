import React from 'react';
import { arrayOf, shape, string } from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { mergeClasses } from '@magento/venia-ui/lib/classify';

import defaultClasses from './billingInformation.css';

const BillingInformation = props => {
    const { data, classes: propsClasses } = props;
    const {
        city,
        country_code,
        firstname,
        lastname,
        postcode,
        region_id,
        street
    } = data;
    const classes = mergeClasses(defaultClasses, propsClasses);

    return (
        <div className={classes.root}>
            <div className={classes.heading}>
                <FormattedMessage
                    id="orderDetails.billingInformationLabel"
                    defaultMessage="Billing Information"
                />
            </div>
            <div className={classes.name}>
                <span>{`${firstname} ${lastname}`}</span>
            </div>
            <div className={classes.addressLine1}>{street}</div>
            <div className={classes.addressLine2}>
                {`${city}, ${region_id}, ${postcode}`}
            </div>
            <div className={classes.country}>{country_code}</div>
        </div>
    );
};

export default BillingInformation;

BillingInformation.propTypes = {
    classes: shape({
        root: string,
        heading: string,
        name: string,
        addressLine1: string,
        addressLine2: string,
        country: string
    }),
    data: shape({
        city: string,
        country_code: string,
        firstname: string,
        lastname: string,
        postcode: string,
        region_id: string,
        street: arrayOf(string)
    })
};
