import { collection, getDocs, addDoc } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Employee } from "../../interfaces/employees"

export async function insertEmployee(employee: Employee) {
  try {
    const docRef = await addDoc(collection(db, "Employee"), employee)
    return docRef.id
  } catch (Exception) {
    console.error("Erro ao realizar cadastro do Colaborador", Exception)
    alert("Erro ao adicionar o COLABORADOR a base de dados!!!")
    throw new Error
  }
}

export async function handleAllEmployee(searchTerm?: string): Promise<Employee[]> {
    try {
        const employeeRef = collection(db, "Employee")
        const snapshot = await getDocs(employeeRef)

        const employee: Employee[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Employee[]
        return employee
    } catch (Exception) {
        console.error("Erro ao recuperar a lista de Funcionarios!", Exception)
        alert("Erro interno do servidor!!!")
        throw new Error
    }
}