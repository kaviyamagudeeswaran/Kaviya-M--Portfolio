import { database } from "./utils/database";
import { ClientSession, Db, ObjectId } from "mongodb";
import logger from "./utils/logger";
import { ContactFormSubmission } from "./models/contact_form_submission";

// Insert mock submissions into the collection
async function insertMockData(db: Db, session: ClientSession) {
  const collection = db.collection<Omit<ContactFormSubmission, "id">>(
    "contact_form_submissions"
  );

  const mockSubmissions: Omit<ContactFormSubmission, "id">[] = [
    {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@example.com",
      subject: "Collaboration Opportunity",
      message:
        "Hi Kaviya, I came across your portfolio and I'm impressed with your full-stack development skills. I'd like to discuss a potential collaboration on a MERN stack project. Please let me know if you're interested.",
      submission_timestamp: Math.floor(Date.now() / 1000) - 86400 * 7,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@techcorp.com",
      subject: "Job Opportunity - Senior Full Stack Developer",
      message:
        "Hello Kaviya, We are looking for a talented Full Stack Developer to join our team. Your experience with React, Node.js, and MongoDB aligns perfectly with our requirements. Would you be available for a discussion?",
      submission_timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Arun Patel",
      email: "arun.patel@startup.io",
      subject: "Freelance Project Inquiry",
      message:
        "Hi, I'm working on a weather application and noticed your weather project in your portfolio. I'd love to discuss a freelance opportunity to build something similar with additional features. Let me know your availability.",
      submission_timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Sneha Reddy",
      email: "sneha.reddy@designstudio.com",
      subject: "UI/UX Collaboration",
      message:
        "Hello Kaviya, I'm a UI/UX designer and I'm impressed by your portfolio design. I'd like to collaborate on some projects where we can combine our skills. Are you open to freelance work?",
      submission_timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Vikram Singh",
      email: "vikram.singh@gmail.com",
      subject: "Question about GitHub Profile Finder",
      message:
        "Hey Kaviya, I really liked your GitHub Profile Finder project. I'm a beginner developer and would love to know more about how you implemented it. Could you share some insights or resources?",
      submission_timestamp: Math.floor(Date.now() / 1000) - 86400,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Meera Iyer",
      email: "meera.iyer@webagency.com",
      subject: "Portfolio Website Development",
      message:
        "Hi Kaviya, Our agency is looking for a developer to build portfolio websites for our clients. Your portfolio is exactly the kind of quality we're looking for. Would you be interested in taking on such projects?",
      submission_timestamp: Math.floor(Date.now() / 1000) - 43200,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Karthik Menon",
      email: "karthik.menon@example.com",
      subject: "Mentorship Request",
      message:
        "Hello Kaviya, I'm a student learning full-stack development and I'm really inspired by your work. Would you be open to mentoring or providing guidance on my learning journey? I'd really appreciate any help.",
      submission_timestamp: Math.floor(Date.now() / 1000) - 21600,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Divya Nair",
      email: "divya.nair@techsolutions.in",
      subject: "Recipe Finder App - Partnership",
      message:
        "Hi Kaviya, I run a food blog and I'm interested in integrating a recipe finder feature similar to your project. Would you be interested in discussing a partnership or custom development work?",
      submission_timestamp: Math.floor(Date.now() / 1000) - 7200,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Arjun Desai",
      email: "arjun.desai@innovate.com",
      subject: "Speaking Opportunity at Tech Conference",
      message:
        "Hello Kaviya, We're organizing a tech conference in Coimbatore and would love to have you as a speaker to share your experience as a Full Stack Developer. Please let us know if you'd be interested.",
      submission_timestamp: Math.floor(Date.now() / 1000) - 3600,
      toDocument: function () {
        return { ...this };
      },
    },
    {
      name: "Lakshmi Krishnan",
      email: "lakshmi.k@devteam.com",
      subject: "Budget Tracking App Inquiry",
      message:
        "Hi Kaviya, I saw your budget tracking application and I'm interested in having a similar app developed for our small business. Could we schedule a call to discuss the requirements and pricing?",
      submission_timestamp: Math.floor(Date.now() / 1000) - 1800,
      toDocument: function () {
        return { ...this };
      },
    },
  ];

  await collection.insertMany(mockSubmissions, { session });
}

// Flag to ensure we only try to populate once per process
let populationAttempted = false;

/**
 * Populates the database with mock data for the App
 */
async function populate_with_mock_data(): Promise<void> {
  if (populationAttempted) {
    logger.info("Population already attempted in this process, skipping");
    return;
  }

  populationAttempted = true;

  const db = await database.getDb();
  const mockDataCollection = db.collection("mock_data_execution");

  try {
    const result = await mockDataCollection.updateOne(
      { _id: new ObjectId("000000000000000000000001") },
      {
        $setOnInsert: {
          executed: true,
          timestamp: Math.floor(Date.now() / 1000),
          instance: `instance-${Math.random().toString(36).substring(2, 15)}`,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount === 0) {
      logger.info("Mock data flag already exists, skipping execution");
      return;
    }

    const userId = "storm_preview_user";
    logger.info(`Starting mock data population for ${userId}...`);

    const client = await database.getClient();
    const session = await client.startSession();

    try {
      await session.withTransaction(async () => {
        await insertMockData(db, session);

        await mockDataCollection.updateOne(
          { _id: new ObjectId("000000000000000000000001") },
          {
            $set: {
              completed: true,
              completedTimestamp: Math.floor(Date.now() / 1000),
            },
          },
          { session }
        );

        logger.info("Successfully populated mock data");
      });
    } catch (error) {
      logger.error("Failed to populate mock data during transaction:", error);

      try {
        await mockDataCollection.updateOne(
          { _id: new ObjectId("000000000000000000000001") },
          {
            $set: {
              failed: true,
              failedTimestamp: Math.floor(Date.now() / 1000),
              error: (error as Error).toString(),
            },
          }
        );
      } catch (updateError) {
        logger.error("Failed to update error state:", updateError);
      }

      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    if ((error as any).code === 11000) {
      logger.info("Another process is handling population, skipping");
      return;
    }

    logger.error("Failed to initialize mock data population:", error);
    throw error;
  }
}

// never change this!
export default populate_with_mock_data;
