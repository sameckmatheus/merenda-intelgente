

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

export interface User {
  id: string
  uid?: string
  name: string
  email: string
  role: 'admin' | 'school_responsible' | 'nutritionist'
  schoolId?: string // If role is school_responsible
  phone?: string
  createdAt?: Date
  status?: 'active' | 'inactive'
}

export interface School {
  id: string
  name: string
  totalStudents: {
    morning: number
    afternoon: number
    night: number
  }
  contacts: {
    email: string
    whatsapp: string
  }
  responsibleIds?: string[]
  updatedAt?: Date
}

export interface HelpRequest {
  id: string
  protocol: string
  schoolId: string
  schoolName: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'declined' | 'cancelled'
  resolutionType?: 'local' | 'central'
  resolutionNotes?: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: number | Date
  updatedAt?: number | Date
}

export type Submission = {
  id: string
  respondentName: string
  school: string
  date: string
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
  // New fields for expansion
  helpRequestId?: string
  menuAdaptationReason?: string // If menuType is improvised
}

export const statusTranslations = {
  pendente: "Pendente",
  atendido: "Atendido",
  atendido_parcialmente: "Atendido parcialmente",
  recusado: "Recusado"
} as const