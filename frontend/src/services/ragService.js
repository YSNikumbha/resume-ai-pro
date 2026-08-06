import apiClient from './apiClient'

const RAG_OPERATION_TIMEOUT_MS = 90000

export async function indexResume(resumeId) {
  const response = await apiClient.post(`/rag/resumes/${resumeId}/index`, null, {
    timeout: RAG_OPERATION_TIMEOUT_MS,
  })
  return response.data
}

export async function getIndexStatus(resumeId) {
  const response = await apiClient.get(`/rag/resumes/${resumeId}/index-status`)
  return response.data
}

export async function deleteResumeIndex(resumeId) {
  const response = await apiClient.delete(`/rag/resumes/${resumeId}/index`, {
    timeout: RAG_OPERATION_TIMEOUT_MS,
  })
  return response.data
}

export async function askResume(resumeId, question) {
  const response = await apiClient.post(
    `/rag/resumes/${resumeId}/chat`,
    { question },
    { timeout: RAG_OPERATION_TIMEOUT_MS },
  )
  return response.data
}

export async function getChatHistory(resumeId) {
  const response = await apiClient.get(`/rag/resumes/${resumeId}/chat-history`)
  return response.data
}
