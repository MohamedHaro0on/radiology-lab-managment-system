// Available modules and their operations
export const MODULES = {
    patients: {
        name: 'patients',
        description: 'Patient management',
        operations: ['view', 'create', 'update', 'delete']
    },
    doctors: {
        name: 'doctors',
        description: 'Doctor management',
        operations: ['view', 'create', 'update', 'delete']
    },
    appointments: {
        name: 'appointments',
        description: 'Appointment management',
        operations: ['view', 'create', 'update', 'delete']
    },
    radiologists: {
        name: 'radiologists',
        description: 'Radiologist management',
        operations: ['view', 'create', 'update', 'delete']
    },
    scans: {
        name: 'scans',
        description: 'Scan management',
        operations: ['view', 'create', 'update', 'delete']
    },
    scanCategories: {
        name: 'scanCategories',
        description: 'Scan category management',
        operations: ['view', 'create', 'update', 'delete']
    },
    stock: {
        name: 'stock',
        description: 'Stock management',
        operations: ['view', 'create', 'update', 'delete']
    },
    patientHistory: {
        name: 'patientHistory',
        description: 'Patient history management',
        operations: ['view', 'create', 'update', 'delete']
    },
    users: {
        name: 'users',
        description: 'User management',
        operations: ['view', 'create', 'update', 'delete']
    }
};

// Available operations
export const OPERATIONS = ['view', 'create', 'update', 'delete'];

// Helper function to get module names
export const getModuleNames = () => Object.keys(MODULES);

// Helper function to check if a module exists
export const isValidModule = (module) => Object.keys(MODULES).includes(module);

// Helper function to check if an operation is valid
export const isValidOperation = (operation) => OPERATIONS.includes(operation);

// Helper function to get operations for a module
export const getModuleOperations = (module) => MODULES[module]?.operations || [];

// Helper function to validate module and operation
export const validatePrivilege = (module, operation) => {
    if (!isValidModule(module)) {
        throw new Error(`Invalid module: ${module}`);
    }
    if (!isValidOperation(operation)) {
        throw new Error(`Invalid operation: ${operation}`);
    }
    if (!getModuleOperations(module).includes(operation)) {
        throw new Error(`Operation ${operation} is not allowed for module ${module}`);
    }
    return true;
}; 