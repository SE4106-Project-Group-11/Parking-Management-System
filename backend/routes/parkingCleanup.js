// Create this file: utils/parkingCleanup.js
const cron = require('node-cron');
const ParkingSlot = require('../models/ParkingSlot');

// Reset parking data daily at midnight
const scheduleDailyReset = () => {
    // Run at 00:01 AM every day
    cron.schedule('1 0 * * *', async () => {
        try {
            console.log('Starting daily parking reset...');
            
            // Optional: Clean up old records (keep last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const deletedCount = await ParkingSlot.deleteMany({
                date: { $lt: thirtyDaysAgo }
            });
            
            console.log(`Daily parking reset completed. Cleaned up ${deletedCount.deletedCount} old records.`);
        } catch (error) {
            console.error('Error during daily parking reset:', error);
        }
    });
    
    console.log('Daily parking reset job scheduled successfully');
};

module.exports = {
    scheduleDailyReset
};