import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Radiology Lab API',
            version: '1.0.0',
            description: 'API documentation for the Radiology Lab Management System',
            contact: {
                name: 'API Support',
                email: 'support@radiologylab.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error'
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            example: 100
                        },
                        page: {
                            type: 'integer',
                            example: 1
                        },
                        limit: {
                            type: 'integer',
                            example: 10
                        },
                        totalPages: {
                            type: 'integer',
                            example: 10
                        },
                        hasNextPage: {
                            type: 'boolean',
                            example: true
                        },
                        hasPrevPage: {
                            type: 'boolean',
                            example: false
                        }
                    }
                },
                Patient: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        firstName: {
                            type: 'string',
                            example: 'John'
                        },
                        lastName: {
                            type: 'string',
                            example: 'Doe'
                        },
                        dateOfBirth: {
                            type: 'string',
                            format: 'date',
                            example: '1990-01-01'
                        },
                        gender: {
                            type: 'string',
                            enum: ['Male', 'Female', 'Other'],
                            example: 'Male'
                        },
                        phoneNumber: {
                            type: 'string',
                            example: '+1234567890'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@example.com'
                        },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                zipCode: { type: 'string' }
                            }
                        },
                        referredBy: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439012'
                        }
                    }
                },
                Doctor: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439012'
                        },
                        firstName: {
                            type: 'string',
                            example: 'Jane'
                        },
                        lastName: {
                            type: 'string',
                            example: 'Smith'
                        },
                        specialization: {
                            type: 'string',
                            example: 'Radiology'
                        },
                        licenseNumber: {
                            type: 'string',
                            example: 'MD123456'
                        },
                        phoneNumber: {
                            type: 'string',
                            example: '+1234567890'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'jane.smith@example.com'
                        },
                        referralCount: {
                            type: 'integer',
                            example: 150
                        }
                    }
                },
                Appointment: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439013'
                        },
                        patient: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        doctor: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439012'
                        },
                        date: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-03-20T10:00:00Z'
                        },
                        status: {
                            type: 'string',
                            enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'],
                            example: 'scheduled'
                        },
                        scans: {
                            type: 'array',
                            items: {
                                type: 'string',
                                example: '507f1f77bcf86cd799439014'
                            }
                        },
                        paymentStatus: {
                            type: 'string',
                            enum: ['pending', 'partial', 'completed'],
                            example: 'pending'
                        },
                        totalAmount: {
                            type: 'number',
                            example: 150.00
                        }
                    }
                },
                Scan: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439014'
                        },
                        category: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439015'
                        },
                        patient: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        radiologist: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439016'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
                            example: 'pending'
                        },
                        results: {
                            type: 'string',
                            example: 'Normal findings'
                        },
                        notes: {
                            type: 'string',
                            example: 'Patient was cooperative during the scan'
                        }
                    }
                },
                ScanCategory: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439015'
                        },
                        name: {
                            type: 'string',
                            example: 'X-Ray'
                        },
                        description: {
                            type: 'string',
                            example: 'Standard X-Ray scan'
                        },
                        price: {
                            type: 'number',
                            example: 100.00
                        },
                        duration: {
                            type: 'integer',
                            example: 30
                        },
                        preparationInstructions: {
                            type: 'string',
                            example: 'No food 4 hours before scan'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                Stock: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439017'
                        },
                        itemName: {
                            type: 'string',
                            example: 'X-Ray Film'
                        },
                        category: {
                            type: 'string',
                            enum: ['X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other'],
                            example: 'X-Ray Film'
                        },
                        quantity: {
                            type: 'integer',
                            example: 100
                        },
                        unit: {
                            type: 'string',
                            enum: ['piece', 'box', 'pack', 'bottle', 'kit'],
                            example: 'box'
                        },
                        minQuantity: {
                            type: 'integer',
                            example: 20
                        },
                        supplier: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                contactPerson: { type: 'string' },
                                phoneNumber: { type: 'string' },
                                email: { type: 'string', format: 'email' }
                            }
                        },
                        expiryDate: {
                            type: 'string',
                            format: 'date',
                            example: '2024-12-31'
                        },
                        location: {
                            type: 'string',
                            example: 'Storage Room A'
                        }
                    }
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./routes/*.js'] // Path to the API routes
};

export const specs = swaggerJsdoc(options); 