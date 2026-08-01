import apiClient from './apiClient'

const JOB_MATCH_TIMEOUT_MS = 90000

export async function createJobMatch(payload) {
  const response = await apiClient.post('/job-matches', payload, {
    timeout: JOB_MATCH_TIMEOUT_MS,
  })
  return response.data
}

export async function getJobMatches() {
  const response = await apiClient.get('/job-matches')
  return response.data
}

export async function getJobMatchById(id) {
  const response = await apiClient.get(`/job-matches/${id}`)
  return response.data
}

export async function getResumeJobMatches(resumeId) {
  const response = await apiClient.get(`/job-matches/resumes/${resumeId}`)
  return response.data
}

export async function deleteJobMatch(id) {
  const response = await apiClient.delete(`/job-matches/${id}`)
  return response.data
}
