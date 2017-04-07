const mongoose = require('mongoose');
const Address = require('./Address');
const PaymentMethod = require('./PaymentMethod');
const Subscription = require('./Subscription');
const Transaction = require('./Transaction');
const ProcessorItem = require('./ProcessorItem');
const SubscriptionStatus = require('./Statuses/SubscriptionStatus');

const Schema = mongoose.Schema;

const Customer = new Schema({
    processor: {
        type: ProcessorItem,
        default: ProcessorItem,
    },
    ipAddress: String,
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: /^([\w-.+]+@([\w-]+\.)+[\w-]{2,6})?$/,
    },
    phone: String,
    addresses: [Address],
    paymentMethods: [PaymentMethod],
    defaultPaymentMethodId: String,
    subscriptions: [Subscription],
    transactions: [Transaction],
});

const paymentMethods = Customer.path('paymentMethods');
const transactions = Customer.path('transactions');

paymentMethods.discriminator('CreditCard', PaymentMethod.CreditCard);
paymentMethods.discriminator('PayPalAccount', PaymentMethod.PayPalAccount);
paymentMethods.discriminator('ApplePayCard', PaymentMethod.ApplePayCard);
paymentMethods.discriminator('AndroidPayCard', PaymentMethod.AndroidPayCard);

transactions.discriminator('TransactionCreditCard', Transaction.TransactionCreditCard);
transactions.discriminator('TransactionPayPalAccount', Transaction.TransactionPayPalAccount);
transactions.discriminator('TransactionApplePayCard', Transaction.TransactionApplePayCard);
transactions.discriminator('TransactionAndroidPayCard', Transaction.TransactionAndroidPayCard);

Customer.methods.markChanged = function markChanged() {
    if (this.processor.id && this.isModified('name email phone ipAddress defaultPaymentMethodId')) {
        this.processor.state = ProcessorItem.CHANGED;
    }

    ['addresses', 'subscriptions', 'paymentMethods'].forEach((collectionName) => {
        this[collectionName].forEach((item, index) => {
            if (item.processor.id && this.isModified(`${collectionName}.${index}`)) {
                item.processor.state = ProcessorItem.CHANGED;
            }
        });
    });

    return this;
};

Customer.methods.cancelProcessor = function cancelProcessor(processor, id) {
    return processor.cancelSubscription(this, id).then(customer => customer.save());
};

Customer.methods.refundProcessor = function refundProcessor(processor, id, amount) {
    return processor.refundTransaction(this, id, amount).then(customer => customer.save());
};

Customer.methods.loadProcessor = function loadProcessor(processor) {
    return processor.load(this).then(customer => customer.save());
};

Customer.methods.saveProcessor = function saveProcessor(processor) {
    this.markChanged();
    return processor.save(this).then(customer => customer.save());
};

Customer.methods.activeSubscriptionForPlan = function activeSubscriptionForPlan(plan, date) {
    return this
        .activeSubscriptions(date)
        .find(sub => plan.processorId === sub.plan.processorId);
};

Customer.methods.activeSubscriptionLikePlan = function activeSubscriptionLikePlan(plan, date) {
    return this
        .activeSubscriptions(date)
        .find(sub => plan.level <= sub.plan.level);
};

Customer.methods.subscribeToPlan = function subscribeToPlan(plan, nonce, addressData) {
    const address = this.addresses.create(addressData);
    const paymentMethod = this.paymentMethods.create({
        billingAddressId: address._id,
        nonce,
    });
    const subscription = this.subscriptions.create({
        plan,
        paymentMethodId: paymentMethod._id,
        price: plan.price,
    });

    this.addresses.push(address);
    this.paymentMethods.push(paymentMethod);
    this.subscriptions.push(subscription);
    this.defaultPaymentMethodId = paymentMethod._id;

    return subscription;
};

Customer.methods.validSubscriptions = function validSubscriptions(activeDate) {
    const date = activeDate || new Date();

    return this.subscriptions
        .filter(item => item.paidThroughDate >= date)
        .sort((a, b) => b.plan.level - a.plan.level);
};

Customer.methods.activeSubscriptions = function activeSubscriptions(activeDate) {
    return this
        .validSubscriptions(activeDate)
        .filter(item => item.status === SubscriptionStatus.ACTIVE);
};

Customer.methods.subscription = function subscription(activeDate) {
    return this.validSubscriptions(activeDate)[0];
};

module.exports = Customer;
