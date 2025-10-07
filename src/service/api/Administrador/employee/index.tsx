import { apiRequest } from "../../api"
import { Employee } from "../../../interfaces"
import Swal from "sweetalert2"


// Inserir novo colaborador
export async function insertEmployee(employee: Employee) {
  const token: any = localStorage.getItem("token")

  try {
    const response = await apiRequest("employees/create", "POST", employee, token)
    if (!response.ok) {
      return null
    }
    return response
  } catch (error) {
    console.error("Erro ao realizar cadastro do Colaborador", error)
    Swal.fire("Alert", "Erro ao adicionar novo colaborador!", "error")
  }
}

// Buscar todos os colaboradores (com ou sem termo de pesquisa)
export async function handleAllEmployee(token?: string): Promise<Employee[] | any> {
  try {
    const response = await apiRequest(`employees/all`, "GET", undefined, token);
    const employee = response.data

    if (typeof employee === 'object' && !Array.isArray(employee.data)) {
      return [employee]
    }



  } catch (err) {
    console.error("Erro ao recuperar a lista de Funcionários!", err);
    Swal.fire("Erro", "Erro interno do servidor!", "error");
  }
  return []
}
export async function designation(token?: string) {
  try {
    const response = await apiRequest("employees/all", "GET", undefined, token);
    const employees = response.data;

    const grouped = employees.reduce((acc: any, emp: any) => {
      const key = emp.sector || emp.designation || "Sem função";
      if (!acc[key]) acc[key] = [];
      acc[key].push(emp);
      return acc;
    }, {});

    const countsArray = Object.entries(grouped).map(([key, value]) => ({
      designation: key,
      count: (value as any[]).length
    }));


    return countsArray;
  } catch (err) {
    console.error("Erro ao recuperar designações:", err);
    return {};
  }
}

// Atualizar colaborador
export const updatedEmployee = async (id: string, updatedData: Partial<Employee>) => {
  //const token: any = localStorage.getItem("token")
  //try {
  // await apiRequest(`employees/${id}`, "PUT", updatedData, token)
  //} catch (error) {
  // console.error("Erro ao atualizar os dados do colaborador:", error)
  // alert("Erro ao atualizar informações do colaborador!!!")
  //throw new Error("Erro interno do servidor!")
  // }
}

