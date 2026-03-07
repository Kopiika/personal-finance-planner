import api from "./api";

export const parseVoiceText = async (text) => {
  const { data } = await api.post("/voice", { text });
  return data; // { title, amount, type, date }
};
