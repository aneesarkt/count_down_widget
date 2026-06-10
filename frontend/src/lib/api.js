import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const getWidget = async () => {
  const { data } = await axios.get(`${API}/widget`);
  return data;
};

export const updateShifts = async (shiftsRemaining) => {
  const { data } = await axios.put(`${API}/widget/shifts`, {
    shifts_remaining: shiftsRemaining,
  });
  return data;
};
