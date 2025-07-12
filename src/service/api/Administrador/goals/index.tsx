import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore"
import { db } from "../../../../firebaseConfig"
import { GoalsData } from "../../../interfaces"

export async function insertGoal(goal: GoalsData) {
  try {
    const docRef = await addDoc(collection(db, "Goal"), goal)
    return docRef.id
  } catch (Exception) {
    console.error("Erro ao criar nova Meta: ", Exception)
    alert("Erro ao adicionar nova meta a base de dados!!!")
    throw new Error()
  }
}

export async function handleAllGoals(searchTerm?: string): Promise<GoalsData[]> {
    try {
        const goalsRef = collection(db, "Goal")
        const snapshot = await getDocs(goalsRef)

        const goals: GoalsData[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as GoalsData[]
        return goals
    } catch (Exception) {
        console.error("Erro ao recuperar a lista de Metas: ", Exception)
        alert("Erro interno do servidor!!!")
        throw new Error()
    }
}

export async function updateGoalsStatus(goalId: string | number, status: string) {
  try {
    const goalRef = doc(db, "Goal", String(goalId))
    await updateDoc(goalRef, { status })
    console.log(`Meta atualizada, ${goalId} atualizada para ${status}`)
  } catch (Exception) {
    console.error("Erro ao atualizar status do Meta:", Exception)
    alert("Erro ao atualizar o status da Meta no banco de dados.")
    throw new Error("Falha ao atualizar status da Meta")
  }
}
