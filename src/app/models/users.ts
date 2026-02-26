import { Role } from "@amcharts/amcharts5/.internal/core/util/Accessibility";

export interface Users {
_id: string;
firstName: string;
lastName: string;
phoneNumber: string;
address: string;
dateOfBirth: Date;
sexe: string;
createdAt: Date;
updatedAt: Date;
actif: boolean;
specialization: string;
diploma: string;
grade: string;
yearsOfExperience: number;
assignedDepartment: string;
auditScope: string;
profileImageName: string;
avatarUrl: string;
primaryDoctor: string;
email: string;
password: string;
role?: Role | string;
resetPasswordToken: string;
resetPasswordExpires: Date;

}
