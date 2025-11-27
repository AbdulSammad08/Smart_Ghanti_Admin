const mongoose = require('mongoose');
const BeneficialAllotment = require('../models/BeneficialAllotment');
const OwnershipTransfer = require('../models/OwnershipTransfer');
const SecondaryOwnership = require('../models/SecondaryOwnership');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await BeneficialAllotment.deleteMany({});
    await OwnershipTransfer.deleteMany({});
    await SecondaryOwnership.deleteMany({});

    // Sample Beneficial Allotments
    const beneficialAllotments = [
      {
        userId: new mongoose.Types.ObjectId(),
        userName: "John Doe",
        userEmail: "john.doe@example.com",
        beneficiaryName: "Jane Doe",
        allotmentType: "Full",
        sharePercentage: 100,
        effectiveDate: new Date(),
        __v: 0
      },
      {
        userId: new mongoose.Types.ObjectId(),
        userName: "Mike Johnson",
        userEmail: "mike.johnson@example.com",
        beneficiaryName: "Sarah Johnson",
        allotmentType: "Partial",
        sharePercentage: 75,
        effectiveDate: new Date(),
        __v: 1
      }
    ];

    // Sample Ownership Transfers
    const ownershipTransfers = [
      {
        userId: new mongoose.Types.ObjectId(),
        userName: "Alice Smith",
        userEmail: "alice.smith@example.com",
        currentOwner: "alice.smith@example.com",
        newOwner: "bob.smith@example.com",
        propertyAddress: "123 Main Street, City",
        reason: "Family transfer",
        __v: 0
      },
      {
        userId: new mongoose.Types.ObjectId(),
        userName: "David Wilson",
        userEmail: "david.wilson@example.com",
        currentOwner: "david.wilson@example.com",
        newOwner: "emma.wilson@example.com",
        propertyAddress: "456 Oak Avenue, Town",
        reason: "Inheritance transfer",
        __v: 1
      }
    ];

    // Sample Secondary Ownerships
    const secondaryOwnerships = [
      {
        userId: new mongoose.Types.ObjectId(),
        userName: "Robert Brown",
        userEmail: "robert.brown@example.com",
        secondaryOwnerName: "Lisa Brown",
        ownershipPercentage: 50,
        relationshipType: "Spouse",
        documentNumber: "DOC001",
        __v: 0
      },
      {
        userId: new mongoose.Types.ObjectId(),
        userName: "Carlos Garcia",
        userEmail: "carlos.garcia@example.com",
        secondaryOwnerName: "Maria Garcia",
        ownershipPercentage: 30,
        relationshipType: "Child",
        documentNumber: "DOC002",
        __v: 1
      }
    ];

    // Insert data
    await BeneficialAllotment.insertMany(beneficialAllotments);
    await OwnershipTransfer.insertMany(ownershipTransfers);
    await SecondaryOwnership.insertMany(secondaryOwnerships);

    console.log('Sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();