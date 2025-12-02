export declare class ContactFormSubmission {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    submission_timestamp: number;
    constructor(id: string, name: string, email: string, subject: string, message: string, submission_timestamp: number);
    /**
     * Creates a ContactFormSubmission instance from a MongoDB document.
     * @param doc The MongoDB document.
     * @returns A new ContactFormSubmission instance, or null if the document is invalid.
     */
    static fromDocument(doc: any): ContactFormSubmission | null;
    /**
     * Converts the ContactFormSubmission instance to a MongoDB document format.
     * @returns An object suitable for insertion or update in MongoDB.
     */
    toDocument(): Omit<ContactFormSubmission, 'id'>;
    /**
     * Creates a new contact form submission in the database.
     * @param name The name of the submitter.
     * @param email The email of the submitter.
     * @param subject The subject of the message.
     * @param message The body of the message.
     * @returns The created ContactFormSubmission instance, or null if creation failed.
     */
    static create(name: string, email: string, subject: string, message: string): Promise<ContactFormSubmission | null>;
    /**
     * Retrieves a contact form submission by its ID.
     * @param id The string ID of the submission.
     * @returns The ContactFormSubmission instance, or null if not found.
     */
    static get_by_id(id: string): Promise<ContactFormSubmission | null>;
    /**
     * Updates an existing contact form submission.
     * @param id The ID of the submission to update.
     * @param updateFields An object containing the fields to update.
     * @returns The updated ContactFormSubmission instance, or null if not found or update failed.
     */
    static update(id: string, updateFields: Partial<Omit<ContactFormSubmission, 'id'>>): Promise<ContactFormSubmission | null>;
    /**
     * Deletes a contact form submission by its ID.
     * @param id The ID of the submission to delete.
     * @returns True if the submission was deleted, false otherwise.
     */
    static delete(id: string): Promise<boolean>;
}
