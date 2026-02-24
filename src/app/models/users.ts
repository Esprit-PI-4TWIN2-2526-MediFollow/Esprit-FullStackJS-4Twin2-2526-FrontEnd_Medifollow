import { Role } from "@amcharts/amcharts5/.internal/core/util/Accessibility";

export interface Users {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  id?: string;
=======
  _id?: string;
>>>>>>> Stashed changes
=======
  _id?: string;
>>>>>>> Stashed changes
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  dateOfBirth?: string;
  sexe: string;

  specialization?: string;
  diploma?: string;
  grade?: string;
  yearsOfExperience?: number;
  assignedDepartment?: string;
  auditScope?: string;
  profileImageName?: string;
  primaryDoctor?: string;

  email: string;
  role?: Role | string;
  actif?: boolean;

  createdAt?: string;
  updatedAt?: string;
}
