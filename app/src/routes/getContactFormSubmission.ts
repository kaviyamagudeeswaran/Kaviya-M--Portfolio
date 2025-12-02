import type express from 'express';
import logger from '../utils/logger';
import { ContactFormSubmission } from '../models/contact_form_submission';

interface ContactFormSubmissionResponse {
  contact_form_submission_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submission_timestamp: number;
}

const getContactFormSubmission = (): express.RequestHandler => {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      const contactFormSubmissionId = req.params.contact_form_submission_id;

      // Validate that the ID is provided
      if (!contactFormSubmissionId) {
        res.status(400).json({ error: 'Contact form submission ID is required' });
        return;
      }

      // Retrieve the contact form submission from the database
      const submission = await ContactFormSubmission.get_by_id(contactFormSubmissionId);

      // Check if the submission exists
      if (!submission) {
        res.status(404).json({ error: 'Contact form submission with the given ID not found' });
        return;
      }

      // Prepare the response
      const response: ContactFormSubmissionResponse = {
        contact_form_submission_id: submission.id,
        name: submission.name,
        email: submission.email,
        subject: submission.subject,
        message: submission.message,
        submission_timestamp: submission.submission_timestamp,
      };

      res.status(200).json(response);
      return;
    } catch (e) {
      next(e);
    }
  };
  return handler;
};

export default getContactFormSubmission;
