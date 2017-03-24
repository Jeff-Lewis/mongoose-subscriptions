'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const main = require('../../../src');
const Plan = main.Plan;
const Coupon = main.Coupon;
const CouponAmount = main.Schema.Coupon.CouponPercent;
const SubscriptionSchema = main.Schema.Subscription;

describe('Schema/Coupon/Amount', function () {
    before(function() {
        this.SubscriptionTest = mongoose.model('SubscriptionTest', SubscriptionSchema);
    });

    beforeEach(function() {
        const plan = new Plan({
            processor: { id: 'test1', state: 'saved' },
            name: 'Test',
            price: 19.90,
            currency: 'USD',
            billingFrequency: 1,
        });

        this.subscription = {
            _id: 'four',
            plan: plan,
            status: 'Active',
            descriptor: {
                name: 'Tst*Mytest',
                phone: 8899039032,
                url: 'example.com',
            },
            price: 19.90,
            paymentMethodId: 'three',
            processor: { id: 'gzsxjb', state: 'saved' },
        };
    });

    it('coupon amount should return valid result based on the subscription', function () {
        const coupon = new Coupon.CouponAmount({
            amount: 10
        });

        assert.deepEqual(coupon.currentAmount(this.subscription), coupon.amount)
    });

    it('coupon amount should return the full price when amount is more than the subscription price', function () {
        const coupon = new Coupon.CouponAmount({
            amount: 20
        });

        assert.deepEqual(coupon.currentAmount(this.subscription), this.subscription.price)
    });
});
