const { validationResult } = require('express-validator');
const ticketModel = require('../models/ticketModel');
const axios = require('axios');

/**
 * Create a new ticket
 */
const createTicket = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority } = req.body;
    const userId = req.user.id;

    const newTicket = await ticketModel.create({
      title,
      description,
      category,
      priority,
      status: 'open', // Default status
      created_by: userId
    });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: newTicket
    });
  } catch (error) {
    console.error('Error in createTicket:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all tickets
 */
const getAllTickets = async (req, res) => {
  try {
    let tickets;
    
    // Check if user is authenticated
    if (req.user) {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Admins and technicians can see all tickets
      if (userRole === 'admin' || userRole === 'technician') {
        tickets = await ticketModel.findAll();
      } else {
        // Regular users can only see their own tickets
        tickets = await ticketModel.findByUserId(userId);
      }
    } else {
      // Unauthenticated users can see all public tickets
      tickets = await ticketModel.findAll(); // You might want to limit what fields are returned for public users
    }
    
    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Error in getAllTickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific ticket by ID
 */
const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is authenticated
    if (req.user) {
      // Check if user has permission to view this ticket (for sensitive data)
      const userId = req.user.id;
      const userRole = req.user.role;
      
      if (userRole !== 'admin' && userRole !== 'technician' && ticket.created_by !== userId) {
        // For authenticated non-admin users who don't own the ticket, we could restrict some sensitive fields
        // But still allow them to see the basic ticket information
      }
    }
    // For unauthenticated users, we could also filter out sensitive fields here if needed
    
    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Error in getTicketById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a ticket
 */
const updateTicket = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { ticketId } = req.params;
    
    // Check if ticket exists
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Determine what can be updated based on role
    let updates = {};
    
    if (userRole === 'admin' || userRole === 'technician') {
      // Admins and technicians can update all fields
      const { title, description, category, priority, status, assigned_to } = req.body;
      
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (category) updates.category = category;
      if (priority) updates.priority = priority;
      if (status) updates.status = status;
      if (assigned_to) updates.assigned_to = assigned_to;
      
    } else if (ticket.created_by === userId) {
      // Regular users can only update title, description, category, and priority of their own tickets
      // And only if the ticket is not already being worked on
      if (ticket.status !== 'open' && ticket.status !== 'pending') {
        return res.status(403).json({
          message: 'You cannot update this ticket as it is already being processed'
        });
      }
      
      const { title, description, category, priority } = req.body;
      
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (category) updates.category = category;
      if (priority) updates.priority = priority;
      
    } else {
      return res.status(403).json({
        message: 'You do not have permission to update this ticket'
      });
    }
    
    // Update the ticket
    const updatedTicket = await ticketModel.update(ticketId, updates);
    
    res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error in updateTicket:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a ticket
 */
const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Check if ticket exists
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Only admins or the ticket creator can delete a ticket
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin' && ticket.created_by !== userId) {
      return res.status(403).json({
        message: 'You do not have permission to delete this ticket'
      });
    }
    
    await ticketModel.remove(ticketId);
    
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTicket:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket
};