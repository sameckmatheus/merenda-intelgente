import { Timestamp } from "firebase/firestore"

export interface Filter {
  date: Date[]
  filterType: "today" | "week" | "month" | "custom" 
  selectedSchool: string | null
  selectedStatus: string | null
  helpNeededFilter: boolean
}

export const menuTypeTranslations = {
  planned: "Planejado",
  alternative: "Alternativo", 
  improvised: "Improvisado",
} as const

export type Submission = {
  id: string
  respondentName: string
  school: string
  date: Timestamp | number
  shift: string
  menuType: keyof typeof menuTypeTranslations
  totalStudents: number
  presentStudents: number
  helpNeeded: boolean
  description?: string
  itemsPurchased?: boolean
  status?: "pendente" | "atendido" | "atendido_parcialmente" | "recusado"
  alternativeMenuDescription?: string
  missingItems?: string
  canBuyMissingItems?: boolean
  suppliesReceived?: boolean
  suppliesDescription?: string
  observations?: string
}

export const statusTranslations = {
  pendente: "Pendente",
  atendido: "Atendido",
  atendido_parcialmente: "Atendido parcialmente", 
  recusado: "Recusado"
} as const