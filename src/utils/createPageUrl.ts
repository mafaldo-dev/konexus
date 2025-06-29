const createPageUrl = (pageName: string): string => {
  switch (pageName) {
    case "Dashboard":
      return "/crm/dashboard";
    case "Leads":
      return "/crm/leads";
    case "Opportunities":
      return "/crm/oportunidades";
    case "Campanhas":
      return "/crm/campanhas";
    case "Atendimentos":
      return "/crm/atendimentos";
    case "Follow-up":
      return "/crm/followup";
    default:
      return "/crm";
  }
};

export { createPageUrl };
