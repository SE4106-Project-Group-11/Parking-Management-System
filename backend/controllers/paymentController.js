// backend/controllers/paymentController.js
const Payment = require('../models/Payment');

// --- CRITICAL CHECK: Ensure STRIPE_SECRET_KEY is loaded and valid ---
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || stripeSecretKey === 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE') {
    console.error("CRITICAL ERROR: STRIPE_SECRET_KEY is not set or is still the placeholder in .env!");
    // Throw an error to prevent the server from starting with a misconfigured Stripe key
    throw new Error("STRIPE_SECRET_KEY is not defined or is a placeholder. Please check your .env file.");
}
const stripe = require('stripe')(stripeSecretKey); // Use the validated key

// For fetching user details (Employee, Visitor, NonEmployee models)
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
                amount: amount / 100, // Store in LKR (divide by 100 if Stripe sent in cents)
                mode: 'card', // Specific to card payment via Stripe
                date: new Date(),
                transactionId: paymentIntent.id, // Store Stripe's transaction ID
                gatewayResponse: paymentIntent, // Store full response for auditing
                status: 'paid' // Mark as paid
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


// Removed: exports.initiatePayherePayment and exports.handlePayhereIPN (as per previous instructions for Stripe-only)



