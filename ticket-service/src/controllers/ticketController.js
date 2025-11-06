const { validationResult } = require('express-validator');
const ticketModel = require('../models/ticketModel');
const axios = require('axios');
const ServiceRegistry = require('../services/serviceRegistry');

/**
 * Create a new ticket
 */
const createTicket = async (req, res) => {
  try {
    // Check if req.user exists (authentication check)
    if (!req.user) {
      console.error('Authentication failed: No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Authenticated user attempting to create ticket:', req.user);

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority } = req.body;
    const userId = parseInt(req.user.id, 10);
    console.log('userId parsed:', userId, typeof userId);
    
    if (!userId) {
      console.error('Invalid user ID in token');
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    console.log('Creating ticket with data:', { title, description, category, priority, userId });

    // Validate that the user exists
    const userExists = await ServiceRegistry.verifyUserExists(userId);
    if (!userExists) {
      console.error(`User ${userId} does not exist`);
      return res.status(400).json({ 
        message: 'Invalid user ID - user does not exist'
      });
    }

    // Convert category to system_id (no validation needed)
    const systemId = parseInt(category, 10);

    // Calculate deadline based on priority
    // HIGH: 2 days, MEDIUM: 7 days, LOW: 14 days
    const deadline = new Date();
    const priorityDays = {
      'high': 2,
      'medium': 7,
      'low': 14
    };
    const daysToAdd = priorityDays[priority.toLowerCase()] || 7;
    deadline.setDate(deadline.getDate() + daysToAdd);
    
    const newTicket = await ticketModel.createTicket({
      title,
      priority,
      deadline_date: deadline,
      flag_status: 'open',
      solve_status: 'not_solved',
      request: description,
      request_author_id: userId,
      system_id: systemId
    });

    console.log('Ticket created successfully:', newTicket);

    // Fetch complete ticket data with user details
    const completeTicket = await ServiceRegistry.getCompleteTicketData(newTicket.id, ticketModel);

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: completeTicket || newTicket
    });
  } catch (error) {
    console.error('Error in createTicket:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      // Admins and moderators can see all tickets
      if (userRole === 'admin' || userRole === 'moderator') {
        tickets = await ticketModel.getAllTickets();
      } else {
        // Regular users possono vedere solo i propri ticket
        // Se vuoi implementare questa funzione, serve ticketModel.getTicketsByUserId(userId)
        tickets = await ticketModel.getAllTickets({ authorId: userId });
      }
    } else {
      // Unauthenticated users can see all public tickets
      tickets = await ticketModel.getAllTickets(); // Puoi filtrare qui se vuoi
    }
    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Error in getAllTickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all tickets with extended information - Admin/Moderator only
 */
const getAllTicketsAdmin = async (req, res) => {
  try {
    // Check for admin or moderator role
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
      return res.status(403).json({ message: 'Access denied: Requires admin or moderator privileges' });
    }
    
    console.log('Admin/Moderator retrieving all tickets');
    
    // Get query parameters
    let { status, priority, assignedTo, category, page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = (page - 1) * limit;

    // Build filter object
    const filters = {};
    if (status) filters.flag_status = status;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assigned_developer_id = assignedTo;
    if (category) filters.system_id = category;

    // Recupera tutti i ticket con i filtri
    const tickets = await ticketModel.getAllTickets(filters);
    const totalCount = tickets.length;
    const pagedTickets = tickets.slice(offset, offset + limit);

    // Get complete data for each ticket
    const ticketsWithDetails = await Promise.all(pagedTickets.map(async ticket => {
      return await ServiceRegistry.getCompleteTicketData(ticket.id, ticketModel);
    }));

    res.status(200).json({
      success: true,
      count: ticketsWithDetails.length,
      total: totalCount,
      page,
      pages: Math.ceil(totalCount / limit),
      tickets: ticketsWithDetails
    });
  } catch (error) {
    console.error('Error in getAllTicketsAdmin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a specific ticket by ID
 */
const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Get ticket with all related data using the ServiceRegistry
    const ticket = await ServiceRegistry.getCompleteTicketData(ticketId, ticketModel);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is authenticated
    if (req.user) {
      // Check if user has permission to view this ticket (for sensitive data)
      const userId = req.user.id;
      const userRole = req.user.role;
      
      if (userRole !== 'admin' && userRole !== 'moderator' && ticket.request_author_id !== userId) {
        // For authenticated non-admin users who don't own the ticket, we could restrict some sensitive fields
        // But still allow them to see the basic ticket information
        delete ticket.author_email;
        delete ticket.developer_email;
        // Add more fields to hide if necessary
      }
    } else {
      // For unauthenticated users, filter out sensitive fields
      delete ticket.author_email;
      delete ticket.developer_email;
      // Add more fields to hide if necessary
    }
    
    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Error in getTicketById:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Determine what can be updated based on role
    let updates = {};
    
    if (userRole === 'admin' || userRole === 'moderator') {
      // Admins and moderators can update all fields
      const { title, description, category, priority, status, assigned_to } = req.body;
      
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (category) updates.category = category;
      if (priority) updates.priority = priority;
      if (status) updates.status = status;
      if (assigned_to) updates.assigned_to = assigned_to;
      
    } else if (ticket.request_author_id === userId) {
      // Regular users can only update title, description, category, and priority of their own tickets
      // And only if the ticket is not already being worked on
      if (ticket.flag_status !== 'open') {
        return res.status(403).json({
          message: 'You cannot update this ticket as it is already being processed'
        });
      }
      
      const { title, description, category, priority } = req.body;
      
      if (title) updates.title = title;
      if (description) updates.request = description;
      if (category) updates.system_id = category;
      if (priority) updates.priority = priority;
      
    } else {
      return res.status(403).json({
        message: 'You do not have permission to update this ticket'
      });
    }
    
    // Update the ticket
    const updatedTicket = await ticketModel.updateTicket(ticketId, updates);

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
 * Update a ticket with admin privileges
 */
const updateTicketAdmin = async (req, res) => {
  try {
    // Check for admin or moderator role
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
      return res.status(403).json({ message: 'Access denied: Requires admin or moderator privileges' });
    }
    
    const { ticketId } = req.params;
    console.log(`Admin/Moderator updating ticket ${ticketId}`);
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if ticket exists
    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Extract fields from request body
    const { 
      title, 
      description, 
      category, 
      priority, 
      flag_status, 
      solve_status, 
      assigned_developer_id,
      answer
    } = req.body;
    
    // Build update fields
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.request = description;
    if (category) updateFields.system_id = category;
    if (priority) updateFields.priority = priority;
    if (flag_status) updateFields.flag_status = flag_status;
    if (solve_status) updateFields.solve_status = solve_status;
    if (assigned_developer_id !== undefined) {
      // Validate that the developer exists
      if (assigned_developer_id !== null) {
        const developerExists = await ServiceRegistry.verifyUserExists(assigned_developer_id);
        if (!developerExists) {
          return res.status(400).json({ 
            success: false,
            message: 'Developer does not exist'
          });
        }
      }
      updateFields.assigned_developer_id = assigned_developer_id;
      updateFields.assigned_by = req.user.id;
      updateFields.assigned_date = new Date();
    }
    if (answer) updateFields.answer = answer;
    
    // Track ticket closing and calculate score
    if (flag_status === 'closed' && ticket.flag_status !== 'closed') {
      updateFields.closed_by = req.user.id;
      updateFields.closed_date = new Date();
      
      // Calculate and award points if ticket is solved and has an assigned developer
      if (solve_status === 'solved' && ticket.assigned_developer_id) {
        try {
          const score = calculateTicketScore(ticket.priority, ticket.opening_date, ticket.deadline_date);
          console.log(`Awarding ${score} points to developer ${ticket.assigned_developer_id} for solving ticket ${ticketId}`);
          
          await ServiceRegistry.updateUserScore(ticket.assigned_developer_id, score);
        } catch (error) {
          console.error('Error awarding score:', error);
          // Don't fail the ticket update if score update fails
        }
      }
    }
    
    // Include audit information
    updateFields.updated_by = req.user.id;
    updateFields.update_date = new Date();
    
    // Update ticket
    const updatedTicket = await ticketModel.updateTicket(ticketId, updateFields);
    
    // Get complete ticket data
    const completeTicket = await ServiceRegistry.getCompleteTicketData(ticketId, ticketModel);
    
    res.status(200).json({ 
      success: true,
      message: 'Ticket updated successfully',
      ticket: completeTicket 
    });
  } catch (error) {
    console.error('Error in updateTicketAdmin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Calculate score based on ticket priority and resolution time
 * @param {string} priority - Ticket priority (high, medium, low)
 * @param {Date} openingDate - When the ticket was opened
 * @param {Date} deadline - Ticket deadline
 * @returns {number} Calculated score
 */
const calculateTicketScore = (priority, openingDate, deadline) => {
  // Base points by priority
  const priorityPoints = {
    'high': 100,
    'medium': 50,
    'low': 25
  };
  
  const basePoints = priorityPoints[priority?.toLowerCase()] || 25;
  
  // Calculate days taken to resolve
  const openDate = new Date(openingDate);
  const deadlineDate = new Date(deadline);
  const closedDate = new Date(); // Current time (when ticket is being closed)
  
  const totalDays = Math.ceil((deadlineDate - openDate) / (1000 * 60 * 60 * 24));
  const daysTaken = Math.ceil((closedDate - openDate) / (1000 * 60 * 60 * 24));
  
  // Calculate bonus/penalty based on completion time
  let timeMultiplier = 1.0;
  
  if (daysTaken <= totalDays * 0.5) {
    // Completed in first half: 50% bonus
    timeMultiplier = 1.5;
  } else if (daysTaken <= totalDays) {
    // Completed before deadline: no bonus/penalty
    timeMultiplier = 1.0;
  } else if (daysTaken <= totalDays * 1.5) {
    // Up to 50% over deadline: 25% penalty
    timeMultiplier = 0.75;
  } else {
    // More than 50% over deadline: 50% penalty
    timeMultiplier = 0.5;
  }
  
  const finalScore = Math.round(basePoints * timeMultiplier);
  
  console.log(`Score calculation: priority=${priority}, basePoints=${basePoints}, daysTaken=${daysTaken}, totalDays=${totalDays}, multiplier=${timeMultiplier}, finalScore=${finalScore}`);
  
  return finalScore;
};

/**
 * Delete a ticket
 */
const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Check if ticket exists
    const ticket = await ticketModel.getTicketById(ticketId);
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
    
    await ticketModel.deleteTicket(ticketId);
    
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTicket:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Rate a resolved ticket
 * Only the ticket requester can rate their own ticket
 */
const rateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    // Check if ticket exists and get its data
    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Only the ticket requester can rate
    const userId = req.user.id;
    if (ticket.request_author_id !== userId) {
      return res.status(403).json({
        message: 'Only the ticket requester can rate this ticket'
      });
    }
    
    // Check if ticket is closed and solved
    if (ticket.flag_status !== 'closed' || ticket.solve_status !== 'solved') {
      return res.status(400).json({
        message: 'You can only rate tickets that are closed and marked as solved'
      });
    }
    
    // Check if ticket is already rated
    const existingRating = await ticketModel.getTicketRating(ticketId);
    if (existingRating) {
      return res.status(400).json({
        message: 'This ticket has already been rated'
      });
    }
    
    // Create the rating
    const newRating = await ticketModel.createTicketRating({
      ticket_id: ticketId,
      rating: parseInt(rating, 10),
      comment: comment || null,
      rated_by: userId
    });
    
    // Update user rank if there's an assigned developer
    if (ticket.assigned_developer_id) {
      try {
        // Call user-service to update rank
        await ServiceRegistry.updateUserRank(ticket.assigned_developer_id, rating);
        console.log(`Updated rank for user ${ticket.assigned_developer_id} with rating ${rating}`);
      } catch (error) {
        console.error('Error updating user rank:', error);
        // Don't fail the request if rank update fails
      }
    }
    
    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });
  } catch (error) {
    console.error('Error in rateTicket:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get rating for a ticket
 */
const getTicketRating = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const rating = await ticketModel.getTicketRating(ticketId);
    
    if (!rating) {
      return res.status(404).json({ message: 'No rating found for this ticket' });
    }
    
    res.status(200).json({ rating });
  } catch (error) {
    console.error('Error in getTicketRating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getAllTicketsAdmin,
  getTicketById,
  updateTicket,
  updateTicketAdmin,
  deleteTicket,
  rateTicket,
  getTicketRating
};