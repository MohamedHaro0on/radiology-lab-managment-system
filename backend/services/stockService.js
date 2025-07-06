import Stock from '../models/Stock.js';
import Scan from '../models/Scan.js';
import { errors } from '../utils/errorHandler.js';

/**
 * Deduct stock items based on appointment scans
 * @param {Array} appointmentScans - Array of scan objects with scan ID and quantity
 * @param {string} branchId - Branch ID where the appointment is conducted
 * @returns {Object} - Result of stock deduction with details
 */
export const deductStockForAppointment = async (appointmentScans, branchId) => {
    try {
        console.log('--- [deductStockForAppointment] Starting stock deduction for scans:', appointmentScans);
        console.log('--- [deductStockForAppointment] Branch ID:', branchId);

        const deductionResults = {
            success: true,
            deductedItems: [],
            errors: [],
            totalItemsDeducted: 0
        };

        // Process each scan in the appointment
        for (const scanItem of appointmentScans) {
            const { scan: scanId, quantity: appointmentQuantity } = scanItem;

            console.log('--- [deductStockForAppointment] Processing scan:', scanId, 'with quantity:', appointmentQuantity);

            // Get scan details
            const scan = await Scan.findById(scanId);
            if (!scan) {
                const error = `Scan not found: ${scanId}`;
                console.error('--- [deductStockForAppointment]', error);
                deductionResults.errors.push(error);
                deductionResults.success = false;
                continue;
            }

            // Process each item in the scan
            for (const scanItemDetail of scan.items) {
                const { item: itemName, quantity: itemQuantityPerScan } = scanItemDetail;
                const totalQuantityNeeded = itemQuantityPerScan * appointmentQuantity;

                console.log('--- [deductStockForAppointment] Item:', itemName, 'Quantity needed:', totalQuantityNeeded);

                // Find stock item by name and branch
                const stockItem = await Stock.findOne({
                    name: { $regex: new RegExp(`^${itemName}$`, 'i') }, // Case-insensitive exact match
                    branch: branchId,
                    isActive: true
                });

                if (!stockItem) {
                    const error = `Stock item not found: ${itemName} in branch ${branchId}`;
                    console.error('--- [deductStockForAppointment]', error);
                    deductionResults.errors.push(error);
                    deductionResults.success = false;
                    continue;
                }

                // Check if enough stock is available
                if (stockItem.quantity < totalQuantityNeeded) {
                    const error = `Insufficient stock for ${itemName}. Available: ${stockItem.quantity}, Needed: ${totalQuantityNeeded}`;
                    console.error('--- [deductStockForAppointment]', error);
                    deductionResults.errors.push(error);
                    deductionResults.success = false;
                    continue;
                }

                // Deduct the quantity from stock
                try {
                    await stockItem.subtractQuantity(totalQuantityNeeded);

                    deductionResults.deductedItems.push({
                        itemName: stockItem.name,
                        quantityDeducted: totalQuantityNeeded,
                        remainingQuantity: stockItem.quantity,
                        unit: stockItem.unit,
                        stockItemId: stockItem._id
                    });

                    deductionResults.totalItemsDeducted += totalQuantityNeeded;

                    console.log('--- [deductStockForAppointment] Successfully deducted:', itemName, 'Quantity:', totalQuantityNeeded, 'Remaining:', stockItem.quantity);
                } catch (error) {
                    const errorMsg = `Failed to deduct stock for ${itemName}: ${error.message}`;
                    console.error('--- [deductStockForAppointment]', errorMsg);
                    deductionResults.errors.push(errorMsg);
                    deductionResults.success = false;
                }
            }
        }

        console.log('--- [deductStockForAppointment] Stock deduction completed. Success:', deductionResults.success);
        console.log('--- [deductStockForAppointment] Items deducted:', deductionResults.deductedItems.length);
        console.log('--- [deductStockForAppointment] Errors:', deductionResults.errors.length);

        return deductionResults;
    } catch (error) {
        console.error('--- [deductStockForAppointment] Unexpected error:', error);
        return {
            success: false,
            deductedItems: [],
            errors: [`Unexpected error: ${error.message}`],
            totalItemsDeducted: 0
        };
    }
};

/**
 * Check stock availability for appointment scans
 * @param {Array} appointmentScans - Array of scan objects with scan ID and quantity
 * @param {string} branchId - Branch ID where the appointment will be conducted
 * @returns {Object} - Stock availability check result
 */
export const checkStockAvailability = async (appointmentScans, branchId) => {
    try {
        console.log('--- [checkStockAvailability] Checking stock availability for scans:', appointmentScans);
        console.log('--- [checkStockAvailability] Branch ID:', branchId);

        const availabilityResult = {
            available: true,
            unavailableItems: [],
            availableItems: [],
            totalItemsNeeded: 0
        };

        // Process each scan in the appointment
        for (const scanItem of appointmentScans) {
            const { scan: scanId, quantity: appointmentQuantity } = scanItem;

            // Get scan details
            const scan = await Scan.findById(scanId);
            if (!scan) {
                availabilityResult.unavailableItems.push({
                    itemName: `Scan ${scanId}`,
                    reason: 'Scan not found'
                });
                availabilityResult.available = false;
                continue;
            }

            // Process each item in the scan
            for (const scanItemDetail of scan.items) {
                const { item: itemName, quantity: itemQuantityPerScan } = scanItemDetail;
                const totalQuantityNeeded = itemQuantityPerScan * appointmentQuantity;

                // Find stock item by name and branch
                const stockItem = await Stock.findOne({
                    name: { $regex: new RegExp(`^${itemName}$`, 'i') },
                    branch: branchId,
                    isActive: true
                });

                if (!stockItem) {
                    availabilityResult.unavailableItems.push({
                        itemName: itemName,
                        reason: 'Item not found in stock',
                        quantityNeeded: totalQuantityNeeded
                    });
                    availabilityResult.available = false;
                } else if (stockItem.quantity < totalQuantityNeeded) {
                    availabilityResult.unavailableItems.push({
                        itemName: itemName,
                        reason: 'Insufficient quantity',
                        quantityNeeded: totalQuantityNeeded,
                        quantityAvailable: stockItem.quantity,
                        unit: stockItem.unit
                    });
                    availabilityResult.available = false;
                } else {
                    availabilityResult.availableItems.push({
                        itemName: itemName,
                        quantityNeeded: totalQuantityNeeded,
                        quantityAvailable: stockItem.quantity,
                        unit: stockItem.unit
                    });
                }

                availabilityResult.totalItemsNeeded += totalQuantityNeeded;
            }
        }

        console.log('--- [checkStockAvailability] Availability check completed. Available:', availabilityResult.available);
        return availabilityResult;
    } catch (error) {
        console.error('--- [checkStockAvailability] Error:', error);
        return {
            available: false,
            unavailableItems: [{ itemName: 'System Error', reason: error.message }],
            availableItems: [],
            totalItemsNeeded: 0
        };
    }
}; 