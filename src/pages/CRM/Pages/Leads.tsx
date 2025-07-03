import Dashboard from "../../../components/dashboard/Dashboard";
import LeadsPage from "../leads/LeadsPage";

export default function Leads() {
  return (
    <Dashboard>
    <div className="space-y-6">
      <LeadsPage/>   
    </div>
    </Dashboard>
  );
}
