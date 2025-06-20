import { collection, getDocs } from "firebase/firestore"
import { db } from "../../../firebaseConfig"
import { Employee } from "../../interfaces/employees"


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