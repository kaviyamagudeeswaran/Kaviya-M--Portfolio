export default class ClientAPI {
  // Helper method for common fetch operations
  async fetchJSON(endpoint, options = {}) {
    const url = `${endpoint}`;

    // Get the auth token from cookie
    const authToken = this.getCookie("storm_app_token");

    // Build headers
    const headers = {
      // Only include Content-Type for requests with body
      ...(options.body && {
        "Content-Type": "application/json",
      }),
      // Add auth header if token exists
      ...(authToken && {
        Authorization: `Bearer ${authToken}`,
      }),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Request failed with status ${response.status}`,
      );
    }

    return data;
  }

  // Helper method to get cookie by name
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  /**
   * List Contact Form Submissions
   * 
   * Request: GET /api/contact_form_submissions
   * No query parameters
   * No request body
   * 
   * Response: {
   *   contact_form_submissions: [
   *     {
   *       name: string,
   *       email: string,
   *       subject: string,
   *       message: string,
   *       submission_timestamp: number (unix epoch in seconds)
   *     }
   *   ]
   * }
   */
  async listContactFormSubmissions() {
    return await this.fetchJSON('/api/contact_form_submissions', {
      method: 'GET'
    });
  }

  /**
   * Creates a new contact form submission.
   * 
   * Request:
   * POST /api/contact_form_submissions
   * Body: {
   *   name: string,
   *   email: string,
   *   subject: string,
   *   message: string
   * }
   * 
   * Response (201 Created):
   * {
   *   contact_form_submission_id: number,
   *   name: string,
   *   email: string,
   *   subject: string,
   *   message: string,
   *   submission_timestamp: number
   * }
   * 
   * @param {Object} contactFormSubmission - The contact form submission data
   * @param {string} contactFormSubmission.name - Name of the person submitting the form
   * @param {string} contactFormSubmission.email - Email address of the person submitting the form
   * @param {string} contactFormSubmission.subject - Subject of the contact message
   * @param {string} contactFormSubmission.message - The main body of the message
   * @returns {Promise<Object>} The created contact form submission with ID and timestamp
   */
  async createContactFormSubmission(contactFormSubmission) {
    const response = await this.fetchJSON('/api/contact_form_submissions', {
      method: 'POST',
      body: JSON.stringify({
        name: contactFormSubmission.name,
        email: contactFormSubmission.email,
        subject: contactFormSubmission.subject,
        message: contactFormSubmission.message
      })
    });

    return response;
  }

  /**
   * Retrieves a contact form submission by its ID.
   * 
   * Request:
   * - Path parameter: contact_form_submission_id (number)
   * 
   * Response (200 OK):
   * {
   *   contact_form_submission_id: number,
   *   name: string,
   *   email: string,
   *   subject: string,
   *   message: string,
   *   submission_timestamp: number // Unix timestamp in seconds
   * }
   * 
   * @param {number} contactFormSubmissionId - The ID of the contact form submission to retrieve
   * @returns {Promise<Object>} The contact form submission data
   * @throws {Error} If the contact form submission is not found or request fails
   */
  async getContactFormSubmission(contactFormSubmissionId) {
    const endpoint = `/api/contact_form_submissions/${contactFormSubmissionId}`;
    
    return await this.fetchJSON(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get GitHub Profile
   * 
   * Request:
   * - Query Parameters:
   *   - username (string, required): GitHub username to fetch profile for
   * 
   * Response (200 OK):
   * {
   *   login: string,
   *   id: number,
   *   avatar_url: string,
   *   html_url: string,
   *   name: string,
   *   company: string,
   *   location: string,
   *   bio: string,
   *   public_repos: number,
   *   followers: number,
   *   following: number,
   *   created_at: string,
   *   updated_at: string
   * }
   * 
   * @param {string} username - GitHub username to fetch profile for
   * @returns {Promise<Object>} GitHub profile data
   * @throws {Error} If the request fails
   */
  async getGitHubProfile(username) {
    const queryParams = new URLSearchParams({ username });
    const endpoint = `/api/github_profile?${queryParams.toString()}`;
    
    return await this.fetchJSON(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Search Recipes
   * 
   * Request:
   * - Query Parameters:
   *   - ingredients (string, required): Ingredients to search for
   * 
   * Response (200 OK):
   * {
   *   recipes: [
   *     {
   *       title: string,
   *       ingredients: string[],
   *       instructions: string,
   *       image_url: string,
   *       source_url: string
   *     }
   *   ]
   * }
   */
  async searchRecipes(ingredients) {
    const queryParams = new URLSearchParams({
      ingredients: ingredients
    });

    const endpoint = `/api/recipes?${queryParams.toString()}`;
    
    return await this.fetchJSON(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Fetches the current storm user.
   * @async
   * @returns {Promise<{ userId: string, role: string, email: string, name: string }>} A promise that resolves to an object containing the user's ID and name, role and email.
   */
  async getCurrentAuthUser() {
      return await this.fetchJSON(`/api/storm/me`);
  }

  /**
   * Retrieves weather data for a specific city.
   * 
   * Request:
   * - Query Parameters:
   *   - city (string, required): The city name to get weather data for
   * 
   * Response (200 OK):
   * {
   *   current: {
   *     temperature: number,
   *     humidity: number,
   *     description: string,
   *     icon: string
   *   },
   *   forecast: [
   *     {
   *       timestamp: number,
   *       temperature: number,
   *       description: string,
   *       icon: string
   *     }
   *   ],
   *   past: [
   *     {
   *       timestamp: number,
   *       temperature: number,
   *       description: string,
   *       icon: string
   *     }
   *   ]
   * }
   */
  async getWeatherData(city) {
    const queryParams = new URLSearchParams({ city });
    const endpoint = `/api/weather?${queryParams.toString()}`;
    
    return await this.fetchJSON(endpoint, {
      method: 'GET'
    });
  }
}