import apiClient from '../apiClient'; // Assuming apiClient is in the parent directory

const API_ENDPOINT = '/api/links-acesso';

/**
 * Fetches all active links de acesso.
 * @returns {Promise<Array>} A promise that resolves to an array of link objects.
 */
export const getAllLinks = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINT);
    return response.data;
  } catch (error) {
    console.error('Error fetching all links de acesso:', error);
    throw error; // Re-throw to allow components to handle it
  }
};

/**
 * Fetches a single link de acesso by its ID.
 * @param {string|number} id The ID of the link to fetch.
 * @returns {Promise<Object>} A promise that resolves to the link object.
 */
export const getLinkById = async (id) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching link de acesso with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new link de acesso.
 * @param {Object} linkData The data for the new link.
 * @param {string} linkData.nome_sistema
 * @param {string} linkData.url_acesso
 * @param {string} [linkData.usuario]
 * @param {string} [linkData.senha] - Password in plain text
 * @param {string} [linkData.observacoes]
 * @returns {Promise<Object>} A promise that resolves to the created link object.
 */
export const createLink = async (linkData) => {
  try {
    const response = await apiClient.post(API_ENDPOINT, linkData);
    return response.data;
  } catch (error) {
    console.error('Error creating link de acesso:', error);
    throw error;
  }
};

/**
 * Updates an existing link de acesso.
 * @param {string|number} id The ID of the link to update.
 * @param {Object} linkData The data to update the link with.
 * @param {string} [linkData.nome_sistema]
 * @param {string} [linkData.url_acesso]
 * @param {string} [linkData.usuario]
 * @param {string} [linkData.senha] - New password in plain text (optional)
 * @param {string} [linkData.observacoes]
 * @returns {Promise<Object>} A promise that resolves to the updated link object.
 */
export const updateLink = async (id, linkData) => {
  try {
    const response = await apiClient.put(`${API_ENDPOINT}/${id}`, linkData);
    return response.data;
  } catch (error) {
    console.error(`Error updating link de acesso with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Soft deletes a link de acesso by its ID.
 * @param {string|number} id The ID of the link to delete.
 * @returns {Promise<Object>} A promise that resolves to the backend's response message.
 */
export const deleteLink = async (id) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting link de acesso with ID ${id}:`, error);
    throw error;
  }
};

// For potential future use if a component needs direct access to the apiClient
// or to configure it further (e.g., setting headers dynamically).
// export { apiClient };
