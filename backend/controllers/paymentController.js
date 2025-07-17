// backend/controllers/paymentController.js
const Payment = require('../models/Payment');

// --- Conditionally initialize Stripe based on environment variable ---
let stripe = null; // Declare stripe as a mutable variable
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (stripeSecretKey && stripeSecretKey !== 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE') {
    try {
        stripe = require('stripe')(stripeSecretKey);
        console.log("Stripe initialized successfully.");
    } catch (error) {
        console.error("ERROR: Failed to initialize Stripe. Check STRIPE_SECRET_KEY in .env:", error.message);
        // Do NOT throw here, just log the error and leave 'stripe' as null
    }
} else {
    console.warn("WARNING: STRIPE_SECRET_KEY is not set or is still the placeholder in .env. Stripe payments will not work.");
}

// For fetching user details (Employee, Visitor, NonEmployee models) - keep these imports
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const NonEmployee = require('../models/NonEmployee');


exports.createPayment = async (req, res) => {
    try {
        const { amount, mode, paymentType } = req.body;
        if (!amount || !mode) {
            return res.status(400).json({ success: false, message: 'Amount and mode are required' });
        }

        const payment = await Payment.create({
            userId:     req.user.id,
            userType:   req.user.role,
            paymentType,
            amount,
            mode,
            date:       new Date()
        });

        res.status(201).json({ success: true, message: 'Payment recorded', payment });
    } catch (err) {
        console.error('createPayment:', err);
        res.status(500).json({ success: false, message: 'Server error creating payment record' });
    }
};

exports.getMyPayments = async (req, res) => {
    try {
        const payments = await Payment
            .find({ userId: req.user.id })
            .sort('-date');
        res.json({ success: true, payments });
    } catch (err) {
        console.error('getMyPayments:', err);
        res.status(500).json({ success: false, message: 'Server error fetching payments' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment
            .find()
            .sort('-date');
        res.json({ success: true, payments });
    } catch (err) {
        console.error('getAllPayments:', err);
        res.status(500).json({ success: false, message: 'Server error fetching all payments' });
    }
};

exports.processStripePayment = async (req, res) => {
    // Check if Stripe was successfully initialized
    if (!stripe) {
        console.error("Stripe is not initialized. Cannot process payment.");
        return res.status(500).json({ success: false, message: "Payment gateway not configured. Please contact support." });
    }

    const { paymentMethodId, amount, paymentType, displayPaymentId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!paymentMethodId || !amount || amount <= 0 || !paymentType) {
        return res.status(400).json({ success: false, message: 'Missing payment details.' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents/lowest currency unit
            currency: 'lkr', // Use LKR or your desired currency
            payment_method: paymentMethodId,
            confirmation_method: 'automatic',
            confirm: true,
            description: `Payment for ${paymentType} by ${userRole} (ID: ${userId}) - ${displayPaymentId}`,
            return_url: 'http://localhost:5000/pages/employee/payment-management.html' // Adjust if using dummy domain or live
        });

        if (paymentIntent.status === 'succeeded') {
            const payment = await Payment.create({
                userId: userId,
                userType: userRole,
                paymentType: paymentType,
                amount: amount / 100,
                mode: 'card',
                date: new Date(),
                transactionId: paymentIntent.id,
                gatewayResponse: paymentIntent,
                status: 'paid'
            });

            res.status(200).json({
                success: true,
                message: 'Payment succeeded!',
                payment: payment,
                stripeResponse: paymentIntent
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment failed or requires action.',
                stripeResponse: paymentIntent
            });
        }
    } catch (error) {
        console.error('Stripe payment processing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process payment with Stripe.',
            details: error
        });
    }
};

exports.getPaymentById = async (req, res) => {
    console.log("Backend: getPaymentById function entered.");
    try {
        const paymentId = req.params.id;
        console.log("Backend: Fetching payment with ID:", paymentId);

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            console.warn("Backend: Payment record not found for ID:", paymentId);
            return res.status(404).json({ success: false, message: 'Payment record not found.' });
        }

        console.log("Backend: Payment found:", payment);
        res.status(200).json({ success: true, payment: payment });

    } catch (error) {
        console.error('Backend: getPaymentById error in catch block:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error fetching payment details.' });
    }
};