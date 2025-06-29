import LeadsPage from "../leads/LeadsPage";
import Dashboard from "../../../components/dashboard";

export default function Leads() {
  return (
    <Dashboard>
    <div className="space-y-6">
      <LeadsPage/>   
    </div>
    </Dashboard>
  );
}
