// Imports to add:
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

// State to add:
const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);

// Code to add in useEffect where user data is fetched:
// Fetch company cashback status
const cashbackEnabled = await fetchCompanyCashbackStatus(company_id);
setCompanyCashbackEnabled(cashbackEnabled);

// Update Sidebar component:
<Sidebar userData={userData} companyCashbackEnabled={companyCashbackEnabled} />
