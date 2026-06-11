const API_BASE_URL = 'http://localhost:5000/api';

export const getAllBranches = async () => {
  const response = await fetch(`${API_BASE_URL}/newBranch`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch branches');
  }
  return response.json();
};

export const getBranchById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/newBranch/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch branch');
  }
  return response.json();
};

export const createBranches = async (branches) => {
  const response = await fetch(`${API_BASE_URL}/newBranch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(branches),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add branches');
  }
  return response.json();
};

export const updateBranch = async (id, branch) => {
  const response = await fetch(`${API_BASE_URL}/newBranch/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(branch),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update branch');
  }
  return response.json();
};

export const deleteBranch = async (id) => {
  const response = await fetch(`${API_BASE_URL}/newBranch/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete branch');
  }
  return response.json();
};