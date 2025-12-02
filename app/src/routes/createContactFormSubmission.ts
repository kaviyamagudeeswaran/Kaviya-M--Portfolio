import type express from 'express';
import logger from '../utils/logger';
import { ContactFormSubmission } from '../models/contact_form_submission';

interface ContactFormSubmissionInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormSubmissionResponse {
  contact_form_submission_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submission_timestamp: number; // Unix timestamp in seconds
}

const createContactFormSubmission = (): express.RequestHandler => {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as Partial<ContactFormSubmissionInput>;

      // Validate name
      if (!body.name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }
      if (typeof body.name !== 'string') {
        res.status(400).json({ error: 'Name must be a string' });
        return;
      }
      if (body.name.trim().length === 0) {
        res.status(400).json({ error: 'Name cannot be empty' });
        return;
      }

      // Validate email
      if (!body.email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      if (typeof body.email !== 'string') {
        res.status(400).json({ error: 'Email must be a string' });
        return;
      }
      if (body.email.trim().length === 0) {
        res.status(400).json({ error: 'Email cannot be empty' });
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        res.status(400).json({ error: 'Email must be a valid email address' });
        return;
      }

      // Validate subject
      if (!body.subject) {
        res.status(400).json({ error: 'Subject is required' });
        return;
      }
      if (typeof body.subject !== 'string') {
        res.status(400).json({ error: 'Subject must be a string' });
        return;
      }
      if (body.subject.trim().length === 0) {
        res.status(400).json({ error: 'Subject cannot be empty' });
        return;
      }

      // Validate message
      if (!body.message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      if (typeof body.message !== 'string') {
        res.status(400).json({ error: 'Message must be a string' });
        return;
      }
      if (body.message.trim().length === 0) {
        res.status(400).json({ error: 'Message cannot be empty' });
        return;
      }

      // Create the contact form submission
      const createdSubmission = await ContactFormSubmission.create(
        body.name.trim(),
        body.email.trim(),
        body.subject.trim(),
        body.message.trim()
      );

      if (!createdSubmission) {
        const error = new Error('Failed to create contact form submission');
        next(error);
        return;
      }

      // Fetch the created submission from the database to ensure we return what was saved
      const savedSubmission = await ContactFormSubmission.get_by_id(createdSubmission.id);

      if (!savedSubmission) {
        const error = new Error('Failed to retrieve created contact form submission');
        next(error);
        return;
      }

      // Prepare the response
      const response: ContactFormSubmissionResponse = {
        contact_form_submission_id: savedSubmission.id,
        name: savedSubmission.name,
        email: savedSubmission.email,
        subject: savedSubmission.subject,
        message: savedSubmission.message,
        submission_timestamp: savedSubmission.submission_timestamp,
      };

      res.status(201).json(response);
      return;
    } catch (e) {
      next(e);
    }
  };
  return handler;
};

export default createContactFormSubmission;
