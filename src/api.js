export const API_URL = "http://localhost:3001";   
export const UPLOAD_URL = "http://localhost:3002"; 


export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    throw new Error(`Server error ${res.status} on ${path}`);
  }
  return res.json();
}


export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${UPLOAD_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Не удалось загрузить файл");
  return res.json(); 
}