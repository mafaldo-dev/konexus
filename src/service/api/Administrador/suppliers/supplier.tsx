import { collection, addDoc, getDocs, updateDoc, doc, where, query, deleteDoc } from "firebase/firestore"
import { db } from "../../../../firebaseConfig"
import { Supplier } from "../../../interfaces"
import Swal from "sweetalert2"

export async function insertSupplier (supplier: Supplier) {
    try {
        const docRef = await addDoc(collection(db, "Suppliers"), supplier)
        return docRef.id
    }catch(Exception) {
        console.error("Erro ao adicionar novo fornecedor: ", Exception)
        alert("Erro ao adicionar novo FORNECEDOR... Tente novamente.")
        throw new Error()
    }
}

export async function updateSupplier (id: string, updateData: any)  {
    try {
        const supplierRef = doc(db, "Suppliers", id)
        await updateDoc(supplierRef, updateData)

    }catch(Exception) {
        console.error("Erro ao atualizar informações do Fornecedor: ", Exception)
        alert("Erro ao atualizar as informaçoes do Fornecedor.")
        throw new Error()
    }
}

export async function getAllSuppliers (serchTerm?: string): Promise<Supplier[]> {
    try {
        const supplierRef = collection(db, "Suppliers")
        const snapshot = await getDocs(supplierRef)

        const suppliers: Supplier[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as Supplier[]
        return suppliers
    }catch(Exception) {
        console.error("Erro ao recuperar Fornecedores: ", Exception)
        alert("Erro ao recuperar a lista de fornecedores")
        throw new Error()
    }
}

export const handleSupplierWithCode = async (code: string) => {
  try {
    const productRef = collection(db, "Suppliers")
    const get = query(productRef, where("code", "==", String (code)))
    const snapshot = await getDocs(get)


    if(!snapshot.empty) {
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    }else {
      return null
    }
  }catch(Exception) {
    console.error("Erro ao recuperar Informações do fornecedor: ", Exception)
    throw new Error ("Erro ao buscar fornecedor pelo codigo")
  }
}

export async function searchSuppliers(searchTerm: string): Promise<Supplier[]> {
  try {
    const suppliersRef = collection(db, "Suppliers");
    const suppliers: Supplier[] = [];

    // Consulta por nome (case-insensitive)
    const nameQuery = query(
      suppliersRef,
      where("name", ">=", searchTerm),
      where("name", "<=", searchTerm + "\uf8ff")
    );

    // Consulta por código
    const codeQuery = query(suppliersRef, where("code", "==", searchTerm));

    const [nameSnapshot, codeSnapshot] = await Promise.all([
      getDocs(nameQuery),
      getDocs(codeQuery),
    ]);

    const supplierIds = new Set<string>();

    nameSnapshot.forEach((doc) => {
      if (!supplierIds.has(doc.id)) {
        suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
        supplierIds.add(doc.id);
      }
    });

    codeSnapshot.forEach((doc) => {
      if (!supplierIds.has(doc.id)) {
        suppliers.push({ id: doc.id, ...doc.data() } as Supplier);
        supplierIds.add(doc.id);
      }
    });

    return suppliers;
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw new Error("Erro ao buscar fornecedores");
  }
}

export const deleteSupplier = async (id: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Deseja excluir este Fornecedor?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  try {
    await deleteDoc(doc(db, "Suppliers", id));
    Swal.fire("Excluído!", "Fornecedor excluído com sucesso.", "success");
    return true;
  } catch (error) {
    console.error("Erro ao deletar Fornecedor: ", error);
    Swal.fire("Erro!", "Erro ao excluir Fornecedor.", "error");
    return false;
  }
};

