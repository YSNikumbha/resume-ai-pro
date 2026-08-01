import apiClient from './apiClient'

export async function uploadResume(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/resumes/upload', formData, {
    onUploadProgress,
  })

  return response.data
}

export async function getResumes() {
  const response = await apiClient.get('/resumes')
  return response.data
}

export async function getResumeById(id) {
  const response = await apiClient.get(`/resumes/${id}`)
  return response.data
}

export async function deleteResume(id) {
  const response = await apiClient.delete(`/resumes/${id}`)
  return response.data
}
