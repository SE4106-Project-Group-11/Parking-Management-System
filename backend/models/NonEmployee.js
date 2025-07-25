const mongoose = require('mongoose');

const nonEmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    nic: { type: String, required: true, unique: true },
    telNo: { type: String, required: true },
    address: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    permitType: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'nonemployee' },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },

    // ▼▼▼ ADD THESE LINES ▼▼▼
    permits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permit'
    }],
    violations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Violation'
    }],
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }]
});

module.exports = mongoose.model('NonEmployee', nonEmployeeSchema);