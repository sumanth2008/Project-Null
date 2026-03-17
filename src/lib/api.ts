import { auth } from './firebase';

export async function callSecureApi(action: string, payload: any = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to perform secure operations.');
  }

  const token = await user.getIdToken();

  const response = await fetch('/api/secure-operation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Secure API call failed with status ${response.status}`);
  }

  return response.json();
}
