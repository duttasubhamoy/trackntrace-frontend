import axios from './axiosConfig';

// Utility function to fetch company cashback status
export const fetchCompanyCashbackStatus = async (company_id) => {
  try {
    const companyRes = await axios.get(`/company/${company_id}`);
    return companyRes.data.cashback_enabled || false;
  } catch (error) {
    console.error('Error fetching company cashback status:', error);
    return false; // Default to false if there's an error
  }
};
