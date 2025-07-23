import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { Customer } from "../../../interfaces";
import Swal from "sweetalert2";

export async function insertCustomer(customer: Customer) {
    try {
        const docRef = await addDoc(collection(db, "Customer"), customer)
        return docRef.id
    } catch (error) {
        console.error("Erro ao inserir o Cliente ao sistema.", error)
        alert("Erro ao cadastrar cliente!!!")
        throw new Error()
    }
}

export async function updateCustomer(id: string, updatedData: any) {
    try {
        const customerRef = doc(db, "Customer", id)
        await updateDoc(customerRef, updatedData)
    } catch (error) {
        console.error("Erro ao atualizar os dados do cliente!", error)
        throw new Error('Erro interno do servidor')
    }
}

export async function handleAllCustomer(searchTerm?: string): Promise<Customer[]> {
    try {
        const clientRef = collection(db, "Customer")
        const snapshot = await getDocs(clientRef)

        const clients: Customer[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Customer[]
        return clients
    } catch (error) {
        console.error("Erro ao recuperar a lista de Clientes!", error)
        alert("Erro interno do servidor!!!")
        throw new Error('Erro interno do servidor')
    }
}

export const deleteCustomer = async (id: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Deseja excluir este cliente?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  try {
    await deleteDoc(doc(db, "Customer", id));
    Swal.fire("Excluído!", "Cliente excluído com sucesso.", "success");
    return true;
  } catch (error) {
    console.error("Erro ao deletar cliente: ", error);
    Swal.fire("Erro!", "Erro ao excluir cliente.", "error");
    return false;
  }
};