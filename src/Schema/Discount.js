'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ProcessorItem = require('./ProcessorItem');
const DiscountAmount = require('./Discount/Amount');
const DiscountPercent = require('./Discount/Percent');
const DiscountInviter = require('./Discount/Inviter');
const DiscountCoupon = require('./Discount/Coupon');
const originalValue = require('../utils').originalValue;

const Discount = new Schema({
    amount: Number,
    processor: {
        type: ProcessorItem,
        default: ProcessorItem,
    },
    numberOfBillingCycles: {
        type: Number,
        default: 1,
        min: 1,
    },
    group: {
        type: String,
        default: 'General',
    },
    name: String,
}, { _id: false });

Discount.DiscountAmount = DiscountAmount;
Discount.DiscountPercent = DiscountPercent;
Discount.DiscountInviter = DiscountInviter;
Discount.DiscountCoupon = DiscountCoupon;

Discount.plugin(originalValue, { fields: ['processor'] })

module.exports = Discount;