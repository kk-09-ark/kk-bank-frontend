import client from "./client";

export const getStats = () => client.get("/api/admin/stats");

export const getAllUsers = () => client.get("/api/admin/users");

export const getUserById = (id) => client.get(`/api/admin/users/${id}`);

export const updateUser = (id, data) => client.put(`/api/admin/users/${id}`, data);

export const deleteUser = (id) => client.delete(`/api/admin/users/${id}`);

export const getAllPayments = () => client.get("/api/admin/payments");

export const adminCreateNote = (note) => client.post("/api/admin/notes", note);

export const adminUpdateNote = (id, note) => client.put(`/api/admin/notes/${id}`, note);

export const adminDeleteNote = (id) => client.delete(`/api/admin/notes/${id}`);

export const getSubscriptions = () => client.get("/api/admin/subscriptions");

export const grantAccess = (email) => client.post("/api/admin/grant-access", { email });

export const revokeAccess = (userId) => client.delete(`/api/admin/revoke-access/${userId}`);
