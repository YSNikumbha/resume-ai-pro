import apiClient from './apiClient'

const ANALYSIS_TIMEOUT_MS = 60000

export async function analyzeResume(resumeId) {
  const response = await apiClient.post(`/analyses/resumes/${resumeId}`, null, {
    timeout: ANALYSIS_TIMEOUT_MS,
  })
  return response.data
}

export async function getAnalysis(analysisId) {
  const response = await apiClient.get(`/analyses/${analysisId}`)
  return response.data
}

export async function getResumeAnalyses(resumeId) {
  const response = await apiClient.get(`/analyses/resumes/${resumeId}`)
  return response.data
}

export async function getAllAnalyses() {
  const response = await apiClient.get('/analyses')
  return response.data
}
