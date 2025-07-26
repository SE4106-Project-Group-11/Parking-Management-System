// models/ParkingSlot.js - FIXED VERSION WITH DEBUGGING
const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    },
    totalSlots: {
        type: Number,
        required: true,
        default: 100
    },
    occupiedSlots: {
        type: Number,
        required: true,
        default: 0
    },
    verifiedEntries: [{
        userId: {
            type: String,
            required: true
        },
        permitId: {
            type: String,
            required: true
        },
        entryTime: {
            type: Date,
            default: Date.now
        },
        userName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['entered', 'exited'],
            default: 'entered'
        }
    }]
}, {
    timestamps: true
});

// Index for efficient date queries
parkingSlotSchema.index({ date: 1 });

// MAIN METHOD - Use this for QR code verified users
parkingSlotSchema.statics.saveVerifiedUserEntry = async function(userData) {
    try {
        console.log('🔍 Starting saveVerifiedUserEntry with data:', userData);
        
        // Validate required fields
        if (!userData || !userData.userId || !userData.permitId || !userData.userName) {
            throw new Error('Missing required user data: userId, permitId, and userName are required');
        }

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        console.log('📅 Looking for parking slot between:', today, 'and', tomorrow);
        
        // Find or create today's parking slot document
        let slot = await this.findOne({ 
            date: { $gte: today, $lt: tomorrow } 
        });
        
        if (!slot) {
            console.log('📝 Creating new parking slot document for today');
            slot = new this({
                date: today,
                totalSlots: 100,
                occupiedSlots: 0,
                verifiedEntries: []
            });
            await slot.save();
            console.log('✅ New parking slot document created');
        } else {
            console.log('📋 Found existing parking slot document');
        }
        
        // Check for duplicate entry (user already entered today)
        const existingEntry = slot.verifiedEntries.find(
            entry => entry.userId === userData.userId && entry.status === 'entered'
        );
        
        if (existingEntry) {
            console.log('⚠️ User already has an active entry today');
            throw new Error('User has already entered today');
        }
        
        // Add new verified entry
        const newEntry = {
            userId: userData.userId,
            permitId: userData.permitId,
            userName: userData.userName,
            entryTime: new Date(),
            status: 'entered'
        };
        
        console.log('➕ Adding new entry:', newEntry);
        
        slot.verifiedEntries.push(newEntry);
        slot.occupiedSlots += 1;
        
        // Mark the array as modified (important for MongoDB)
        slot.markModified('verifiedEntries');
        
        console.log('💾 Saving to database...');
        const savedSlot = await slot.save();
        
        console.log('✅ Successfully saved! Current occupied slots:', savedSlot.occupiedSlots);
        console.log('📊 Total entries today:', savedSlot.verifiedEntries.length);
        
        return savedSlot;
        
    } catch (error) {
        console.error('❌ Error in saveVerifiedUserEntry:', error.message);
        console.error('📋 Stack trace:', error.stack);
        throw error;
    }
};

// Method to get today's parking data
parkingSlotSchema.statics.getTodaysParkingData = async function() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        let slot = await this.findOne({ 
            date: { $gte: today, $lt: tomorrow } 
        });
        
        if (!slot) {
            // Create new slot for today if doesn't exist
            slot = new this({
                date: today,
                totalSlots: 100,
                occupiedSlots: 0,
                verifiedEntries: []
            });
            await slot.save();
        }
        
        return slot;
    } catch (error) {
        console.error('❌ Error getting today\'s parking data:', error);
        throw error;
    }
};

// Instance method to add verified entry (alternative approach)
parkingSlotSchema.methods.addVerifiedEntry = async function(userData, userName) {
    try {
        console.log('🚗 Adding entry for:', { userData, userName });
        
        // Validate input
        if (!userData || !userData.userId || !userData.permitId) {
            throw new Error('Invalid user data provided');
        }
        
        // Check if user already entered today
        const existingEntry = this.verifiedEntries.find(
            entry => entry.userId === userData.userId && entry.status === 'entered'
        );
        
        if (existingEntry) {
            throw new Error('User has already entered today');
        }
        
        // Add new entry
        const newEntry = {
            userId: userData.userId,
            permitId: userData.permitId,
            userName: userName || userData.userName,
            status: 'entered',
            entryTime: new Date()
        };
        
        this.verifiedEntries.push(newEntry);
        this.occupiedSlots += 1;
        this.markModified('verifiedEntries');
        
        console.log('💾 Saving entry to database...');
        await this.save();
        console.log('✅ Entry saved successfully. Occupied slots:', this.occupiedSlots);
        
        return this;
        
    } catch (error) {
        console.error('❌ Error adding verified entry:', error);
        throw error;
    }
};

// Method to mark exit
parkingSlotSchema.methods.markExit = async function(userId) {
    try {
        console.log('🚪 Marking exit for user:', userId);
        
        const entryIndex = this.verifiedEntries.findIndex(
            entry => entry.userId === userId && entry.status === 'entered'
        );
        
        if (entryIndex === -1) {
            throw new Error('No active entry found for this user');
        }
        
        // Mark as exited
        this.verifiedEntries[entryIndex].status = 'exited';
        this.occupiedSlots = Math.max(0, this.occupiedSlots - 1);
        this.markModified('verifiedEntries');
        
        console.log('💾 Saving exit to database...');
        await this.save();
        console.log('✅ Exit saved successfully. Occupied slots:', this.occupiedSlots);
        
        return this;
        
    } catch (error) {
        console.error('❌ Error marking exit:', error);
        throw error;
    }
};

// Method to get counts
parkingSlotSchema.methods.getCounts = function() {
    const activeEntries = this.verifiedEntries.filter(entry => entry.status === 'entered');
    const exitedEntries = this.verifiedEntries.filter(entry => entry.status === 'exited');
    
    return {
        totalSlots: this.totalSlots,
        occupiedSlots: this.occupiedSlots,
        availableSlots: this.totalSlots - this.occupiedSlots,
        totalEntriesToday: this.verifiedEntries.length,
        currentlyInside: activeEntries.length,
        exitedToday: exitedEntries.length,
        verifiedUserCount: this.occupiedSlots
    };
};

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);