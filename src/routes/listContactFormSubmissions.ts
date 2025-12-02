import type express from 'express';
import logger from '../utils/logger';
import { database } from '../utils/database';
import { ContactFormSubmission } from '../models/contact_form_submission';

interface ContactFormSubmissionResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submission_timestamp: number;
}

interface ContactFormSubmissionsResponse {
  contact_form_submissions: ContactFormSubmissionResponse[];
}

const listContactFormSubmissions = (): express.RequestHandler => {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      logger.info('Retrieving all contact form submissions');

      const db = await database.getDb();
      const collection = db.collection<Omit<ContactFormSubmission, 'id'>>('contact_form_submissions');

      // Retrieve all contact form submissions from the database
      const docs = await collection.find({}).toArray();

      // Convert documents to ContactFormSubmission instances
      const submissions: ContactFormSubmissionResponse[] = docs
        .map(doc => ContactFormSubmission.fromDocument(doc))
        .filter((submission): submission is ContactFormSubmission => submission !== null)
        .map(submission => ({
          id: submission.id,
          name: submission.name,
          email: submission.email,
          subject: submission.subject,
          message: submission.message,
          submission_timestamp: submission.submission_timestamp,
        }));

      const response: ContactFormSubmissionsResponse = {
        contact_form_submissions: submissions,
      };

      logger.info(`Successfully retrieved ${submissions.length} contact form submissions`);
      res.status(200).json(response);
      return;
    } catch (e) {
      logger.error(`Error retrieving contact form submissions: ${e}`);
      next(e);
    }
  };
  return handler;
};

export default listContactFormSubmissions;
