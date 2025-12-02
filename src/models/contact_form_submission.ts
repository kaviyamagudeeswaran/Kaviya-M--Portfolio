import { ObjectId } from 'mongodb';
import { database } from '../utils/database';
import logger from '../utils/logger';

export class ContactFormSubmission {
  public id: string; // Represents the MongoDB _id as a string
  public name: string;
  public email: string;
  public subject: string;
  public message: string;
  public submission_timestamp: number; // Unix timestamp in seconds

  constructor(
    id: string,
    name: string,
    email: string,
    subject: string,
    message: string,
    submission_timestamp: number
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.subject = subject;
    this.message = message;
    this.submission_timestamp = submission_timestamp;
  }

  /**
   * Creates a ContactFormSubmission instance from a MongoDB document.
   * @param doc The MongoDB document.
   * @returns A new ContactFormSubmission instance, or null if the document is invalid.
   */
  static fromDocument(doc: any): ContactFormSubmission | null {
    if (!doc) {
      return null;
    }
    return new ContactFormSubmission(
      doc._id.toHexString(),
      doc.name,
      doc.email,
      doc.subject,
      doc.message,
      doc.submission_timestamp
    );
  }

  /**
   * Converts the ContactFormSubmission instance to a MongoDB document format.
   * @returns An object suitable for insertion or update in MongoDB.
   */
  toDocument(): Omit<ContactFormSubmission, 'id'> {
    return {
      name: this.name,
      email: this.email,
      subject: this.subject,
      message: this.message,
      submission_timestamp: this.submission_timestamp,
    };
  }

  /**
   * Creates a new contact form submission in the database.
   * @param name The name of the submitter.
   * @param email The email of the submitter.
   * @param subject The subject of the message.
   * @param message The body of the message.
   * @returns The created ContactFormSubmission instance, or null if creation failed.
   */
  static async create(
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<ContactFormSubmission | null> {
    try {
      const db = await database.getDb();
      const collection = db.collection<Omit<ContactFormSubmission, 'id'>>('contact_form_submissions');
      const submission_timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds

      const newSubmissionData = {
        name,
        email,
        subject,
        message,
        submission_timestamp,
      };

      const result = await collection.insertOne(newSubmissionData);

      if (result.acknowledged && result.insertedId) {
        return new ContactFormSubmission(
          result.insertedId.toHexString(),
          name,
          email,
          subject,
          message,
          submission_timestamp
        );
      }
      return null;
    } catch (error) {
      logger.error(`Error creating contact form submission: ${error}`);
      return null;
    }
  }

  /**
   * Retrieves a contact form submission by its ID.
   * @param id The string ID of the submission.
   * @returns The ContactFormSubmission instance, or null if not found.
   */
  static async get_by_id(id: string): Promise<ContactFormSubmission | null> {
    try {
      const db = await database.getDb();
      const collection = db.collection<Omit<ContactFormSubmission, 'id'>>('contact_form_submissions');
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      return ContactFormSubmission.fromDocument(doc);
    } catch (error) {
      logger.error(`Error getting contact form submission by id ${id}: ${error}`);
      return null;
    }
  }

  /**
   * Updates an existing contact form submission.
   * @param id The ID of the submission to update.
   * @param updateFields An object containing the fields to update.
   * @returns The updated ContactFormSubmission instance, or null if not found or update failed.
   */
  static async update(id: string, updateFields: Partial<Omit<ContactFormSubmission, 'id'>>): Promise<ContactFormSubmission | null> {
    try {
      const db = await database.getDb();
      const collection = db.collection<Omit<ContactFormSubmission, 'id'>>('contact_form_submissions');

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      return ContactFormSubmission.fromDocument(result);
    } catch (error) {
      logger.error(`Error updating contact form submission with id ${id}: ${error}`);
      return null;
    }
  }

  /**
   * Deletes a contact form submission by its ID.
   * @param id The ID of the submission to delete.
   * @returns True if the submission was deleted, false otherwise.
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const db = await database.getDb();
      const collection = db.collection<Omit<ContactFormSubmission, 'id'>>('contact_form_submissions');
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      logger.error(`Error deleting contact form submission with id ${id}: ${error}`);
      return false;
    }
  }
}
