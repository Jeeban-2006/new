import axios from "axios";

const api = async () => {
  const res = await axios.get("/patients");
  console.log(res.data);
};

export default api;