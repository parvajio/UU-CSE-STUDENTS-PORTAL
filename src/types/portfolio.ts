export type Achievement = {
  id: string
  profileId: string
  title: string
  achievedDate: string | null
  description: string | null
  imageUrl: string | null
  linkUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  profileId: string
  title: string
  description: string | null
  techStack: string[] | null
  demoUrl: string | null
  repoUrl: string | null
  startDate: string | null
  endDate: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Certificate = {
  id: string
  profileId: string
  title: string
  issuer: string
  issueDate: string | null
  credentialUrl: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Experience = {
  id: string
  profileId: string
  company: string
  role: string
  startDate: string | null
  endDate: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export type ProfilePortfolio = {
  achievements: Achievement[]
  projects: Project[]
  certificates: Certificate[]
  experiences: Experience[]
}
