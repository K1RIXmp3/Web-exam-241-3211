import { API_BASE, API_KEY } from "./config.js";

function buildUrl(path) {
  const url = new URL(API_BASE + path);
  url.searchParams.set("api_key", API_KEY);
  return url.toString();
}

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {},
  };

  if (body !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path), options);
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (data && data.error) throw new Error(data.error);
  return data;
}

export const api = {
  getCourses: () => request("GET", "/api/courses"),
  getTutors: () => request("GET", "/api/tutors"),
  getOrders: () => request("GET", "/api/orders"),

  createOrder: (payload) => request("POST", "/api/orders", payload),
  updateOrder: (id, payload) => request("PUT", `/api/orders/${id}`, payload),
  deleteOrder: (id) => request("DELETE", `/api/orders/${id}`),
  getOrder: (id) => request("GET", `/api/orders/${id}`),

  getTutorById: (id) => request("GET", `/api/tutors/${id}`),

  getCourseById: async (id) => {
    try {
      return await request("GET", `/api/course/${id}`);
    } catch {
      return await request("GET", `/api/courses/${id}`);
    }
  },
};
