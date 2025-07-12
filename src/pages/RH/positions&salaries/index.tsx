import { useEffect, useState } from "react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { handleAllEmployee } from "../../../service/api/Administrador/employee";
import { Employee } from "../../../service/interfaces";

export default function PositionsAndSalaries() {
    const [employe, setEmploye] =  useState<Employee[]>([])
    const response = async () => {
       const res =  await handleAllEmployee()
        setEmploye(res)
    }

    useEffect(() =>{
        response()
    },[]) 
  const groupedByRole = employe.reduce((acc: Record<string, Employee[]>, emp) => {
    if (!acc[emp.designation]) acc[emp.designation] = [];
    acc[emp.designation].push(emp);
    return acc;
  }, {});

  return (
    <Dashboard>
      <div style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Funcionários por Setor</h1>

        {Object.entries(groupedByRole).map(([role, employees]) => (
          <div key={role} style={{ marginBottom: "2rem", backgroundColor: "#f9f9f9", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.4rem", color: "#333", marginBottom: "0.8rem", borderBottom: "2px solid #ddd", paddingBottom: "0.4rem" }}>{role}</h2>
            
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>Salário</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(({ id, username, salary }) => (
                  <tr key={id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={tdStyle}>{username}</td>
                    <td style={tdStyle}>R$ {salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Dashboard>
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "8px",
  backgroundColor: "#f0f0f0",
  fontWeight: "bold" as const,
  fontSize: "14px"
};

const tdStyle = {
  padding: "8px",
  fontSize: "14px"
};
