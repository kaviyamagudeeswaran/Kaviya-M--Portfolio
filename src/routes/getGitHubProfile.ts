import type express from 'express';
import logger from '../utils/logger';
import { tryDecodeBase64 } from '../utils/utils';

interface GitHubProfileResponse {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  company: string;
  location: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

const getGitHubProfile = (): express.RequestHandler => {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      // Validate username parameter
      const username = req.query.username as string;
      
      if (!username) {
        res.status(400).json({ error: 'Username parameter is required' });
        return;
      }

      if (typeof username !== 'string' || username.trim() === '') {
        res.status(400).json({ error: 'Username must be a non-empty string' });
        return;
      }

      // Get GitHub API key from environment variables
      const githubApiKey = tryDecodeBase64(process.env.GITHUB_API_KEY || '');
      
      if (!githubApiKey) {
        logger.error('GITHUB_API_KEY environment variable is not set');
        const error = new Error('GitHub API key is not configured');
        next(error);
        return;
      }

      // Call GitHub API
      const githubApiUrl = `https://api.github.com/users/${encodeURIComponent(username.trim())}`;
      
      logger.info(`Fetching GitHub profile for username: ${username}`);
      
      const response = await fetch(githubApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `token ${githubApiKey}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Express-API'
        }
      });

      if (response.status === 404) {
        res.status(404).json({ error: `GitHub user with username '${username}' not found` });
        return;
      }

      if (!response.ok) {
        logger.error(`GitHub API returned status ${response.status}: ${response.statusText}`);
        const error = new Error(`Failed to retrieve data from GitHub API: ${response.statusText}`);
        next(error);
        return;
      }

      const profileData = await response.json();

      // Map to GitHubProfileResponse format
      const githubProfile: GitHubProfileResponse = {
        login: profileData.login,
        id: profileData.id,
        avatar_url: profileData.avatar_url,
        html_url: profileData.html_url,
        name: profileData.name,
        company: profileData.company,
        location: profileData.location,
        bio: profileData.bio,
        public_repos: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at
      };

      logger.info(`Successfully retrieved GitHub profile for username: ${username}`);
      res.status(200).json(githubProfile);
      return;
      
    } catch (e) {
      logger.error('Error in getGitHubProfile handler:', e);
      next(e);
    }
  };
  return handler;
};

export default getGitHubProfile;
