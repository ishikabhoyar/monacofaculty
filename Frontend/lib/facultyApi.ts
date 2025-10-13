
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090';
const API_URL = `${BASE_URL}/api/faculty`;
const TESTS_URL = `${BASE_URL}/api/tests`;
const QUESTIONS_URL = `${BASE_URL}/api/questions`;
const BATCHES_URL = `${BASE_URL}/api/batches`;

export const getFacultyData = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateFacultyData = async (id: string, data: any, token: string) => {
  const response = await axios.put(`${API_URL}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Tests API functions
export const getTests = async (token: string, batchId?: string) => {
  const params = batchId ? { batchId } : {};
  const response = await axios.get(TESTS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  return response.data;
};

export const getTestById = async (id: string, token: string) => {
  const response = await axios.get(`${TESTS_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateTest = async (id: string, data: any, token: string) => {
  const response = await axios.put(`${TESTS_URL}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteTest = async (id: string, token: string) => {
  const response = await axios.delete(`${TESTS_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Questions API functions
export const getQuestionsForTest = async (testId: string, token: string) => {
  const response = await axios.get(`${QUESTIONS_URL}/test/${testId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createQuestion = async (data: any, token: string) => {
  const response = await axios.post(QUESTIONS_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateQuestion = async (id: string, data: any, token: string) => {
  const response = await axios.put(`${QUESTIONS_URL}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteQuestion = async (id: string, token: string) => {
  const response = await axios.delete(`${QUESTIONS_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const bulkCreateQuestions = async (data: any, token: string) => {
  const response = await axios.post(`${QUESTIONS_URL}/bulk`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Test Cases API functions
export const getTestCasesForQuestion = async (questionId: string, token: string) => {
  const response = await axios.get(`${QUESTIONS_URL}/${questionId}/test-cases`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createTestCase = async (questionId: string, data: any, token: string) => {
  const response = await axios.post(`${QUESTIONS_URL}/${questionId}/test-cases`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateTestCase = async (testCaseId: string, data: any, token: string) => {
  const response = await axios.put(`${QUESTIONS_URL}/test-cases/${testCaseId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteTestCase = async (testCaseId: string, token: string) => {
  const response = await axios.delete(`${QUESTIONS_URL}/test-cases/${testCaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Tags API functions
export const getAllTags = async (token: string) => {
  const response = await axios.get(`${QUESTIONS_URL}/tags/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getQuestionTags = async (questionId: string, token: string) => {
  const response = await axios.get(`${QUESTIONS_URL}/${questionId}/tags`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Batches API functions
export const getBatches = async (token: string) => {
  const response = await axios.get(BATCHES_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
