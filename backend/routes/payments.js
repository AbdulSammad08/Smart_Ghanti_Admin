const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const PAYMENT_IMAGES_CONTAINER = process.env.PAYMENT_IMAGES_CONTAINER || 'payment-images';

let blobServiceClient;
if (AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
}
// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    const db = mongoose.connection.db;
    const payments = await db.collection('payments').find({}).toArray();
    console.log(`📊 Retrieved ${payments.length} payments`);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single payment by ID (for debugging)
router.get('/debug/:id', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const paymentId = new mongoose.Types.ObjectId(req.params.id);
    const payment = await db.collection('payments').findOne({ _id: paymentId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found', id: req.params.id });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active subscriptions
router.get('/active', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const activePayments = await db.collection('payments').find({ __v: 1 }).toArray();
    res.json(activePayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { action } = req.body;
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');
    
    console.log(`🔄 Updating payment ID: ${req.params.id}, Action: ${action}`);
    
    // Convert string ID to ObjectId if it's a valid MongoDB ObjectId
    let paymentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID format' });
    }
    paymentId = new mongoose.Types.ObjectId(paymentId);
    
    // First, check if payment exists
    const existingPayment = await paymentsCollection.findOne({ _id: paymentId });
    if (!existingPayment) {
      console.log(`❌ Payment not found: ${paymentId}`);
      return res.status(404).json({ message: 'Payment not found', id: req.params.id });
    }
    
    console.log(`✅ Found payment:`, existingPayment.userName);
    
    // Update status in Cosmos DB
    const result = await paymentsCollection.updateOne(
      { _id: paymentId },
      { 
        $set: { 
          __v: action === 'confirm' ? 1 : 0,
          status: action === 'confirm' ? 'approved' : 'pending',
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`📝 Update result:`, result);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (result.modifiedCount === 0) {
      console.log('⚠️  No changes made to payment');
    } else {
      console.log(`✅ Payment ${paymentId} updated successfully`);
    }
    
    // If payment is confirmed, update user's subscription information
    if (action === 'confirm') {
      try {
        const usersCollection = db.collection('users_v2');
        
        console.log(`\n========== USER UPDATE PROCESS ==========`);
        console.log(`🔍 Payment Details:`, {
          userName: existingPayment.userName,
          contactNumber: existingPayment.contactNumber,
          plan: existingPayment.planSelected,
          billingCycle: existingPayment.billingCycle
        });
        
        // First check if user exists
        const userExists = await usersCollection.findOne({ 
          $or: [
            { name: existingPayment.userName },
            { phone: existingPayment.contactNumber }
          ]
        });
        
        if (userExists) {
          console.log(`✅ Found user:`, {
            id: userExists._id,
            email: userExists.email,
            name: userExists.name,
            phone: userExists.phone,
            currentStatus: userExists.subscriptionStatus
          });
        } else {
          console.log(`❌ User NOT found in users_v2`);
          // List all users to help debug
          const allUsers = await usersCollection.find({}).project({ name: 1, email: 1, phone: 1 }).limit(10).toArray();
          console.log(`📋 First 10 users in database:`, allUsers);
          console.log(`⚠️  Cannot update subscription - user does not exist`);
          console.log(`========================================\n`);
        }
        
        if (!userExists) {
          console.log(`⚠️  Skipping user update - no matching user found`);
        } else {
          // Calculate subscription dates based on billing cycle
          const startDate = new Date();
          const endDate = new Date();
          
          if (existingPayment.billingCycle === 'Monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (existingPayment.billingCycle === 'Yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else if (existingPayment.billingCycle === 'Quarterly') {
            endDate.setMonth(endDate.getMonth() + 3);
          }
          
          console.log(`📅 Subscription dates:`, {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          });
          
          // Update user subscription information
          const userUpdateResult = await usersCollection.updateOne(
            { _id: userExists._id },
            {
              $set: {
                subscriptionStatus: 'active',
                subscriptionPlan: existingPayment.planSelected,
                subscriptionStartDate: startDate,
                subscriptionEndDate: endDate,
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`📝 Update operation result:`, {
            matched: userUpdateResult.matchedCount,
            modified: userUpdateResult.modifiedCount,
            acknowledged: userUpdateResult.acknowledged
          });
          
          if (userUpdateResult.modifiedCount > 0) {
            console.log(`✅ User subscription SUCCESSFULLY updated!`);
            
            // Verify the update
            const verifyUser = await usersCollection.findOne({ _id: userExists._id });
            console.log(`🔍 Verified user subscription:`, {
              status: verifyUser.subscriptionStatus,
              plan: verifyUser.subscriptionPlan,
              start: verifyUser.subscriptionStartDate,
              end: verifyUser.subscriptionEndDate
            });
          } else {
            console.log(`⚠️  Update matched but no fields changed (already up to date?)`);
          }
        }
        
        console.log(`========================================\n`);
        
      } catch (userUpdateError) {
        console.error(`❌ ERROR during user update:`, userUpdateError);
        console.error(`Stack trace:`, userUpdateError.stack);
        // Don't fail the whole request if user update fails
      }
    }
    
    // Fetch and return updated payment
    const updatedPayment = await paymentsCollection.findOne({ _id: paymentId });
    res.json(updatedPayment);
    
  } catch (error) {
    console.error('❌ Error updating payment:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Serve receipt files

// Serve receipt files from Azure Blob Storage
router.get('/receipt/:filename', async (req, res) => {
  let filename = req.params.filename;
  filename = decodeURIComponent(filename);
  filename = filename.split('/').pop().split('\\').pop();

  if (!blobServiceClient) {
    return res.status(500).json({ message: 'Azure Storage not configured' });
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(PAYMENT_IMAGES_CONTAINER);
    const blobClient = containerClient.getBlobClient(filename);
    const exists = await blobClient.exists();
    if (!exists) {
      console.error('❌ Receipt not found in Azure Blob Storage:', filename);
      return res.status(404).json({ message: 'Receipt file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the blob to the response
    const downloadBlockBlobResponse = await blobClient.download();
    downloadBlockBlobResponse.readableStreamBody.pipe(res);
  } catch (err) {
    console.error('❌ Error serving receipt from Azure Blob Storage:', err.message);
    res.status(500).json({ message: 'Error retrieving receipt file' });
  }
});

module.exports = router;