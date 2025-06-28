import Audit from '../models/Audit.js';

/**
 * Creates an audit log entry.
 * @param {object} options - The options for creating the audit log.
 * @param {string} options.user - The ID of the user performing the action.
 * @param {string} options.action - The action being performed (e.g., 'CREATE', 'UPDATE').
 * @param {string} options.entityId - The ID of the entity being changed.
 * @param {string} [options.entity='Appointment'] - The entity type.
 * @param {object} [options.changes] - The changes that were made.
 */
export const logAudit = async ({ user, action, entity = 'Appointment', entityId, changes }) => {
    try {
        await Audit.create({
            user,
            action,
            entity,
            entityId,
            changes
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Depending on requirements, you might want to throw the error
        // or handle it silently. For now, we'll log it.
    }
}; 